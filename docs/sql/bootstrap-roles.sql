-- Roles de runtime para un proyecto Supabase NUEVO (por ejemplo, el propio de cada integrante).
-- IDEMPOTENTE. Aplicar DESPUÉS de `npm run db:deploy`, con la credencial de migraciones (postgres / DIRECT_URL).
-- A diferencia de runtime-and-auth.sql, no crea el trigger de auth.users: ya lo crea la migración auth_profile.
-- No contiene contraseñas. El login se habilita aparte (ver el final) y la contraseña nunca va a Git.

DO $roles$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'campusflow_runtime') THEN
    CREATE ROLE campusflow_runtime NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'n8n_runtime') THEN
    CREATE ROLE n8n_runtime NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO campusflow_runtime, n8n_runtime', current_database());
END
$roles$;

-- API Express (campusflow_runtime): sin DELETE, sin DDL, sin promoción de perfiles.
GRANT USAGE ON SCHEMA app_private TO campusflow_runtime, n8n_runtime;
GRANT SELECT ON app_private."Profile" TO campusflow_runtime;
GRANT SELECT, INSERT, UPDATE ON
  app_private."Space", app_private."Resource", app_private."Reservation",
  app_private."Loan", app_private."Incident", app_private."ScheduleBoard"
  TO campusflow_runtime;
GRANT SELECT, INSERT ON app_private."AuditEvent" TO campusflow_runtime;

-- ScheduleBoard tiene RLS activado: sin políticas el rol de runtime no vería filas.
DROP POLICY IF EXISTS runtime_schedule_select ON app_private."ScheduleBoard";
DROP POLICY IF EXISTS runtime_schedule_insert ON app_private."ScheduleBoard";
DROP POLICY IF EXISTS runtime_schedule_update ON app_private."ScheduleBoard";
CREATE POLICY runtime_schedule_select ON app_private."ScheduleBoard" FOR SELECT TO campusflow_runtime USING (true);
CREATE POLICY runtime_schedule_insert ON app_private."ScheduleBoard" FOR INSERT TO campusflow_runtime WITH CHECK (true);
CREATE POLICY runtime_schedule_update ON app_private."ScheduleBoard" FOR UPDATE TO campusflow_runtime USING (true) WITH CHECK (true);

-- n8n (n8n_runtime): ninguna tabla, solo las dos funciones auditadas de la migración n8n_agenda.
GRANT EXECUTE ON FUNCTION app_private.n8n_state() TO n8n_runtime;
GRANT EXECUTE ON FUNCTION app_private.n8n_apply_plan(jsonb) TO n8n_runtime;

-- Nada de la Data API de Supabase sobre app_private.
DO $deny$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON SCHEMA app_private FROM anon;
    REVOKE ALL ON ALL TABLES IN SCHEMA app_private FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON SCHEMA app_private FROM authenticated;
    REVOKE ALL ON ALL TABLES IN SCHEMA app_private FROM authenticated;
  END IF;
END
$deny$;

-- ---------------------------------------------------------------------------------------------
-- HABILITAR EL LOGIN (manual, una vez, con contraseñas generadas; NO las pegues en chats ni en Git):
--   ALTER ROLE campusflow_runtime LOGIN PASSWORD '<contraseña 1>';   -- DATABASE_URL de apps/api/.env
--   ALTER ROLE n8n_runtime        LOGIN PASSWORD '<contraseña 2>';   -- credencial Postgres de n8n
-- Usuario de conexión por el pooler de Supabase: <rol>.<project-ref>
-- ---------------------------------------------------------------------------------------------
