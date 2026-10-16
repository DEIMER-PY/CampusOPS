-- Rol de n8n para el proyecto dedicado de CampusFlow. Aplicar solo tras aprobación de Leonardo/Deimer,
-- DESPUÉS de la migración 20261016150000_n8n_agenda. Sin contraseña en el repositorio.
-- n8n no recibe acceso a tablas: únicamente EXECUTE de dos funciones SECURITY DEFINER que validan y auditan.
CREATE ROLE n8n_runtime NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
GRANT USAGE ON SCHEMA app_private TO n8n_runtime;
GRANT EXECUTE ON FUNCTION app_private.n8n_state() TO n8n_runtime;
GRANT EXECUTE ON FUNCTION app_private.n8n_apply_plan(jsonb) TO n8n_runtime;
-- Habilitar el login con una contraseña generada, fuera de Git (SQL Editor o psql):
--   ALTER ROLE n8n_runtime LOGIN PASSWORD '<contraseña generada>';
-- Conexión de n8n: pooler de Supabase, usuario n8n_runtime.<project-ref>, SSL requerido.
