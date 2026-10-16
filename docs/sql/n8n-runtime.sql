-- Solo el rol de n8n (idempotente). Para un proyecto nuevo es más simple aplicar bootstrap-roles.sql,
-- que ya incluye este rol y el de la API. Aplicar DESPUÉS de la migración 20261016150000_n8n_agenda.
-- n8n no recibe acceso a tablas: únicamente EXECUTE de dos funciones SECURITY DEFINER que validan y auditan.
DO $role$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'n8n_runtime') THEN
    CREATE ROLE n8n_runtime NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;
END
$role$;
GRANT USAGE ON SCHEMA app_private TO n8n_runtime;
GRANT EXECUTE ON FUNCTION app_private.n8n_state() TO n8n_runtime;
GRANT EXECUTE ON FUNCTION app_private.n8n_apply_plan(jsonb) TO n8n_runtime;
-- Habilitar el login con una contraseña generada, fuera de Git (SQL Editor o psql):
--   ALTER ROLE n8n_runtime LOGIN PASSWORD '<contraseña generada>';
-- Conexión de n8n: pooler de Supabase, usuario n8n_runtime.<project-ref>, SSL requerido.
