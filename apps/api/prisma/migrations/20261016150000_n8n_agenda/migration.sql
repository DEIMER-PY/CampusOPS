-- Integración de agenda n8n sobre las MISMAS tablas de app_private (una sola fuente de verdad).
-- n8n no recibe acceso a tablas: solo EXECUTE de dos funciones que validan y auditan en la misma transacción.

ALTER TABLE app_private."Reservation"
  ADD COLUMN "requesterName" TEXT,
  ADD COLUMN "source" TEXT NOT NULL DEFAULT 'WEB',
  ADD COLUMN "note" TEXT,
  ADD COLUMN "relocatedFrom" TEXT,
  ADD CONSTRAINT "Reservation_source_valid" CHECK ("source" IN ('WEB', 'N8N_FRONTEND', 'N8N_WHATSAPP', 'IMPORT'));

-- Perfil de servicio para operaciones que llegan por n8n/importación (no puede iniciar sesión: no existe en auth.users).
-- La identidad del solicitante de WhatsApp es un nombre sin verificar: queda en requesterName, no como actor autenticado.
INSERT INTO app_private."Profile" ("id", "role")
VALUES ('00000000-0000-4000-8000-00000000cf01', 'CLIENT')
ON CONFLICT ("id") DO NOTHING;

-- Estado para el motor de reglas de n8n. DISABLED (sin habilitar) y MAINTENANCE no se pueden asignar.
CREATE OR REPLACE FUNCTION app_private.n8n_state() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'now', now(),
    'rooms', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'nombre', s.name, 'capacidad', s.capacity,
        'estado', CASE s.status WHEN 'AVAILABLE' THEN 'DISPONIBLE' WHEN 'MAINTENANCE' THEN 'MANTENIMIENTO' ELSE 'DESHABILITADA' END
      ) ORDER BY s.capacity DESC, s.name)
      FROM app_private."Space" s), '[]'::jsonb),
    'bookings', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', r.id, 'sala', s.name, 'ocupante', COALESCE(r."requesterName", 'Reserva CampusFlow'),
        'inicio', r."startAt", 'fin', r."endAt", 'asistentes', r.attendees,
        'nota', r."note", 'reubicado_desde', r."relocatedFrom", 'created_at', r."createdAt"
      ) ORDER BY r."startAt")
      FROM app_private."Reservation" r
      JOIN app_private."Space" s ON s.id = r."spaceId"
      WHERE r."cancelledAt" IS NULL
        AND r."endAt" > (date_trunc('day', now() AT TIME ZONE 'America/Bogota') AT TIME ZONE 'America/Bogota')
    ), '[]'::jsonb)
  );
$$;

-- Aplica el plan del motor en UNA transacción: bloquea los espacios en orden fijo, revalida estado y aforo
-- (el solape lo vuelve a impedir la exclusión GiST "Reservation_no_overlap") y audita cada operación.
CREATE OR REPLACE FUNCTION app_private.n8n_apply_plan(plan jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  svc CONSTANT uuid := '00000000-0000-4000-8000-00000000cf01';
  item jsonb;
  sp RECORD;
  new_id uuid;
  aplicadas jsonb := '[]'::jsonb;
BEGIN
  PERFORM 1 FROM app_private."Space" ORDER BY name FOR UPDATE;
  FOR item IN SELECT * FROM jsonb_array_elements(COALESCE(plan -> 'ops', '[]'::jsonb)) LOOP
    CASE item ->> 'op'
      WHEN 'insert' THEN
        SELECT id, status, capacity INTO sp FROM app_private."Space" WHERE name = item ->> 'sala';
        IF NOT FOUND THEN RAISE EXCEPTION 'sala % no encontrada', item ->> 'sala'; END IF;
        IF sp.status <> 'AVAILABLE' THEN RAISE EXCEPTION 'sala % no habilitada', item ->> 'sala'; END IF;
        IF (item ->> 'asistentes')::integer > sp.capacity THEN RAISE EXCEPTION 'aforo excedido en %', item ->> 'sala'; END IF;
        INSERT INTO app_private."Reservation"
          ("id", "spaceId", "userId", "startAt", "endAt", "attendees", "purpose", "requesterName", "source")
        VALUES (gen_random_uuid(), sp.id, svc, (item ->> 'inicio')::timestamptz, (item ->> 'fin')::timestamptz,
                (item ->> 'asistentes')::integer, 'Reserva solicitada por ' || (item ->> 'ocupante'),
                item ->> 'ocupante', CASE item ->> 'origen' WHEN 'WHATSAPP' THEN 'N8N_WHATSAPP' ELSE 'N8N_FRONTEND' END)
        RETURNING id INTO new_id;
        INSERT INTO app_private."AuditEvent" ("id", "actorId", "action", "entityId")
        VALUES (gen_random_uuid(), svc, 'n8n.reservation.created', new_id);
        aplicadas := aplicadas || jsonb_build_object('op', 'insert', 'id', new_id);
      WHEN 'move' THEN
        SELECT id, status, capacity INTO sp FROM app_private."Space" WHERE name = item ->> 'sala';
        IF NOT FOUND THEN RAISE EXCEPTION 'sala % no encontrada', item ->> 'sala'; END IF;
        IF sp.status <> 'AVAILABLE' THEN RAISE EXCEPTION 'sala % no habilitada', item ->> 'sala'; END IF;
        UPDATE app_private."Reservation"
           SET "spaceId" = sp.id, "relocatedFrom" = item ->> 'desde', "note" = item ->> 'nota'
         WHERE "id" = (item ->> 'id')::uuid AND "cancelledAt" IS NULL AND attendees <= sp.capacity;
        IF NOT FOUND THEN RAISE EXCEPTION 'reserva % no reubicable', item ->> 'id'; END IF;
        INSERT INTO app_private."AuditEvent" ("id", "actorId", "action", "entityId")
        VALUES (gen_random_uuid(), svc, 'n8n.reservation.relocated', (item ->> 'id')::uuid);
        aplicadas := aplicadas || jsonb_build_object('op', 'move', 'id', item ->> 'id');
      WHEN 'extend' THEN
        UPDATE app_private."Reservation"
           SET "endAt" = (item ->> 'fin')::timestamptz, "note" = item ->> 'nota'
         WHERE "id" = (item ->> 'id')::uuid AND "cancelledAt" IS NULL;
        IF NOT FOUND THEN RAISE EXCEPTION 'reserva % no encontrada', item ->> 'id'; END IF;
        INSERT INTO app_private."AuditEvent" ("id", "actorId", "action", "entityId")
        VALUES (gen_random_uuid(), svc, 'n8n.reservation.extended', (item ->> 'id')::uuid);
        aplicadas := aplicadas || jsonb_build_object('op', 'extend', 'id', item ->> 'id');
      WHEN 'room_state' THEN
        UPDATE app_private."Space" SET status = 'MAINTENANCE' WHERE name = item ->> 'sala' RETURNING id INTO new_id;
        IF new_id IS NULL THEN RAISE EXCEPTION 'sala % no encontrada', item ->> 'sala'; END IF;
        INSERT INTO app_private."AuditEvent" ("id", "actorId", "action", "entityId")
        VALUES (gen_random_uuid(), svc, 'n8n.space.maintenance', new_id);
        aplicadas := aplicadas || jsonb_build_object('op', 'room_state', 'sala', item ->> 'sala');
      WHEN 'incident' THEN
        INSERT INTO app_private."Incident" ("id", "userId", "description", "aiStatus", "triage", "status")
        VALUES (gen_random_uuid(), svc, item ->> 'descripcion', 'COMPLETE',
                jsonb_build_object('fuente', 'n8n-gemini', 'sala', item -> 'sala', 'prioridad', item ->> 'prioridad',
                                   'area', item -> 'area', 'reportadoPor', item ->> 'usuario'), 'OPEN')
        RETURNING id INTO new_id;
        INSERT INTO app_private."AuditEvent" ("id", "actorId", "action", "entityId")
        VALUES (gen_random_uuid(), svc, 'n8n.incident.created', new_id);
        aplicadas := aplicadas || jsonb_build_object('op', 'incident', 'id', new_id);
      ELSE
        RAISE EXCEPTION 'operación desconocida: %', item ->> 'op';
    END CASE;
  END LOOP;
  RETURN aplicadas;
END;
$$;

REVOKE ALL ON FUNCTION app_private.n8n_state() FROM PUBLIC;
REVOKE ALL ON FUNCTION app_private.n8n_apply_plan(jsonb) FROM PUBLIC;
