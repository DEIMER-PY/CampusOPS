-- Revalidate current space status on extensions; keep external triage separate from the validated Groq schema.
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
  IF jsonb_typeof(plan -> 'ops') IS DISTINCT FROM 'array' OR jsonb_array_length(plan -> 'ops') > 50 THEN
    RAISE EXCEPTION 'plan inválido o demasiado grande';
  END IF;
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
        SELECT s.status, s.capacity, r.attendees INTO sp
          FROM app_private."Reservation" r JOIN app_private."Space" s ON s.id = r."spaceId"
          WHERE r.id = (item ->> 'id')::uuid AND r."cancelledAt" IS NULL FOR UPDATE OF r;
        IF NOT FOUND THEN RAISE EXCEPTION 'reserva no encontrada'; END IF;
        IF sp.status <> 'AVAILABLE' OR sp.attendees > sp.capacity THEN
          RAISE EXCEPTION 'espacio no habilitado o aforo inválido';
        END IF;
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
        VALUES (gen_random_uuid(), svc,
                (item ->> 'descripcion') || E'\nClasificación externa n8n: prioridad ' || COALESCE(item ->> 'prioridad', 'sin especificar') || ', área ' || COALESCE(item ->> 'area', 'sin especificar'),
                'PENDING', NULL, 'OPEN')
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
