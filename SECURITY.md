# Seguridad

No publiques vulnerabilidades con claves, datos personales o sesiones. Contacta al mantenedor por un canal privado acordado con el equipo. Este proyecto no tiene todavía un proceso empresarial de respuesta.

- .env, tokens, dumps y sesiones de navegador fuera de Git. Si una clave se publica, revocarla inmediatamente y revisar historial.
- Dominio PostgreSQL en app_private; no exponerlo por Data API. Runtime DB con mínimo privilegio, migraciones separadas. Prisma no transporta identidad de Supabase al contexto SQL automáticamente.
- Auth verificada en servidor; permisos por rol y propietario. Nunca autorización por user_metadata o un rol enviado por el navegador.
- Rutas administrativas no pueden fiarse solo del layout. Auditoría, informes y futuro RAG aplican la misma autorización que el dato original.
- Sin datos sintéticos en demo ni respuestas IA estáticas. Entornos de prueba separados.
- Antes de producción: pruebas reales de roles/concurrencia, TLS, política de contraseñas/sesiones en Supabase, rate limiting compartido si hay réplicas, monitorización, backups y revisión de migraciones.
