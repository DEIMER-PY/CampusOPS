-- Estado operativo del flujo n8n de CampusFlow en Supabase PostgreSQL.
-- Esquema propio `campusflow`, fuera de los esquemas expuestos por la Data API de Supabase
-- (no agregarlo en Settings > API > Exposed schemas) y separado de app_private/Prisma.
-- Aplicar solo con la credencial de migraciones (DIRECT_URL) sobre una BD de desarrollo autorizada.
-- No se ejecuta automáticamente. No contiene contraseñas: ver docs/n8n/README.md para el rol de runtime.
-- Salas: contrato n8n↔frontend (11 espacios). OJO: data/official/spaces.csv lista 10; "Azules" solo
-- figura en el contrato y debe confirmarse con el organizador antes de la entrega.

CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA extensions;
CREATE SCHEMA IF NOT EXISTS campusflow;

CREATE TABLE IF NOT EXISTS campusflow.rooms (
  nombre    text PRIMARY KEY,
  capacidad integer NOT NULL CHECK (capacidad > 0),
  estado    text NOT NULL DEFAULT 'DISPONIBLE' CHECK (estado IN ('DISPONIBLE', 'MANTENIMIENTO'))
);

CREATE TABLE IF NOT EXISTS campusflow.bookings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sala            text NOT NULL REFERENCES campusflow.rooms (nombre),
  ocupante        text NOT NULL,
  rol             text NOT NULL CHECK (rol IN ('DOCENTE', 'COMERCIAL', 'ADMINISTRATIVO')),
  inicio          timestamptz NOT NULL,
  fin             timestamptz NOT NULL,
  asistentes      integer NOT NULL CHECK (asistentes > 0),
  origen          text NOT NULL CHECK (origen IN ('FRONTEND', 'WHATSAPP')),
  nota            text,
  reubicado_desde text,
  cancelada       boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CHECK (fin > inicio),
  -- Última defensa contra solapes, también bajo concurrencia: intervalos [inicio, fin).
  CONSTRAINT bookings_sin_solape EXCLUDE USING gist (
    sala WITH =, tstzrange(inicio, fin, '[)') WITH &&
  ) WHERE (NOT cancelada)
);
CREATE INDEX IF NOT EXISTS bookings_inicio_idx ON campusflow.bookings (inicio);

CREATE TABLE IF NOT EXISTS campusflow.incidents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sala        text REFERENCES campusflow.rooms (nombre),
  usuario     text NOT NULL,
  descripcion text NOT NULL,
  prioridad   text NOT NULL CHECK (prioridad IN ('NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  area        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Catálogo del contrato. No incluye reservas, ocupantes ni incidencias de ejemplo.
INSERT INTO campusflow.rooms (nombre, capacidad) VALUES
  ('Auditorio', 100), ('Spooki', 38), ('Apolo', 34), ('Artemis', 32), ('Cosmos', 25), ('Skilab', 20),
  ('Blanca', 12), ('Azul', 10), ('Amarillas', 6), ('Azules', 6), ('Verdes', 6)
ON CONFLICT (nombre) DO NOTHING;

-- Aplica el plan calculado por el motor de reglas de n8n en UNA transacción (la de la llamada).
-- Bloquea todas las salas en orden fijo, así dos planes concurrentes se serializan sin interbloqueo.
-- SECURITY DEFINER: el rol de runtime solo puede ejecutar esta función, no escribir las tablas.
CREATE OR REPLACE FUNCTION campusflow.apply_plan(plan jsonb) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = campusflow, extensions, pg_temp
AS $$
DECLARE
  item jsonb;
  new_id uuid;
  aplicadas jsonb := '[]'::jsonb;
BEGIN
  PERFORM 1 FROM campusflow.rooms ORDER BY nombre FOR UPDATE;
  FOR item IN SELECT * FROM jsonb_array_elements(COALESCE(plan -> 'ops', '[]'::jsonb)) LOOP
    CASE item ->> 'op'
      WHEN 'insert' THEN
        INSERT INTO campusflow.bookings (sala, ocupante, rol, inicio, fin, asistentes, origen)
        VALUES (item ->> 'sala', item ->> 'ocupante', item ->> 'rol', (item ->> 'inicio')::timestamptz,
                (item ->> 'fin')::timestamptz, (item ->> 'asistentes')::integer, item ->> 'origen')
        RETURNING id INTO new_id;
        aplicadas := aplicadas || jsonb_build_object('op', 'insert', 'id', new_id);
      WHEN 'move' THEN
        UPDATE campusflow.bookings
           SET sala = item ->> 'sala', reubicado_desde = item ->> 'desde', nota = item ->> 'nota'
         WHERE id = (item ->> 'id')::uuid AND NOT cancelada;
        IF NOT FOUND THEN RAISE EXCEPTION 'reserva % no encontrada', item ->> 'id'; END IF;
        aplicadas := aplicadas || jsonb_build_object('op', 'move', 'id', item ->> 'id');
      WHEN 'extend' THEN
        UPDATE campusflow.bookings SET fin = (item ->> 'fin')::timestamptz, nota = item ->> 'nota'
         WHERE id = (item ->> 'id')::uuid AND NOT cancelada;
        IF NOT FOUND THEN RAISE EXCEPTION 'reserva % no encontrada', item ->> 'id'; END IF;
        aplicadas := aplicadas || jsonb_build_object('op', 'extend', 'id', item ->> 'id');
      WHEN 'room_state' THEN
        UPDATE campusflow.rooms SET estado = item ->> 'estado' WHERE nombre = item ->> 'sala';
        IF NOT FOUND THEN RAISE EXCEPTION 'sala % no encontrada', item ->> 'sala'; END IF;
        aplicadas := aplicadas || jsonb_build_object('op', 'room_state', 'sala', item ->> 'sala');
      WHEN 'incident' THEN
        INSERT INTO campusflow.incidents (sala, usuario, descripcion, prioridad, area)
        VALUES (item ->> 'sala', item ->> 'usuario', item ->> 'descripcion', item ->> 'prioridad', item ->> 'area')
        RETURNING id INTO new_id;
        aplicadas := aplicadas || jsonb_build_object('op', 'incident', 'id', new_id);
      ELSE
        RAISE EXCEPTION 'operación desconocida: %', item ->> 'op';
    END CASE;
  END LOOP;
  RETURN aplicadas;
END;
$$;

-- ---------------------------------------------------------------------------------------------
-- Seguridad (Supabase): nada de anon/authenticated ni de la Data API sobre tablas de dominio.
-- ---------------------------------------------------------------------------------------------
ALTER TABLE campusflow.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE campusflow.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE campusflow.incidents ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON SCHEMA campusflow FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA campusflow FROM PUBLIC;
REVOKE ALL ON FUNCTION campusflow.apply_plan(jsonb) FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON SCHEMA campusflow FROM anon;
    REVOKE ALL ON ALL TABLES IN SCHEMA campusflow FROM anon;
    REVOKE ALL ON FUNCTION campusflow.apply_plan(jsonb) FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON SCHEMA campusflow FROM authenticated;
    REVOKE ALL ON ALL TABLES IN SCHEMA campusflow FROM authenticated;
    REVOKE ALL ON FUNCTION campusflow.apply_plan(jsonb) FROM authenticated;
  END IF;
  -- Rol de runtime de n8n: sin LOGIN ni contraseña en el repositorio (ver README).
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'n8n_runtime') THEN
    CREATE ROLE n8n_runtime NOLOGIN;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA campusflow TO n8n_runtime;
GRANT SELECT ON campusflow.rooms, campusflow.bookings TO n8n_runtime;
GRANT EXECUTE ON FUNCTION campusflow.apply_plan(jsonb) TO n8n_runtime;

DROP POLICY IF EXISTS n8n_runtime_lee_rooms ON campusflow.rooms;
CREATE POLICY n8n_runtime_lee_rooms ON campusflow.rooms FOR SELECT TO n8n_runtime USING (true);
DROP POLICY IF EXISTS n8n_runtime_lee_bookings ON campusflow.bookings;
CREATE POLICY n8n_runtime_lee_bookings ON campusflow.bookings FOR SELECT TO n8n_runtime USING (true);
