# Empezar desde un clon limpio

[← Documentación](README.md) · [Pruebas por sistema operativo](TESTING.md) · [Integración n8n](n8n-integration.md)

## 1. Elegir la versión y preparar herramientas

Instalar Git, Node **24.22.0** y npm **11.19.1**, versiones declaradas en `.nvmrc` y `package.json`. Utilizar un gestor de versiones o los instaladores oficiales. En Windows se recomienda PowerShell; WSL cuenta como Linux y requiere sus propias dependencias.

```bash
git clone https://github.com/DEIMER-PY/campusflow.git
cd campusflow
git fetch origin
git switch -c feature/mi-tarea origin/feature/prototype-plans-vision
node --version
npm --version
npm ci
```

No copiar `node_modules`, `.next`, `dist` ni archivos `.env` de otro sistema operativo. Sharp y Prisma tienen componentes dependientes de plataforma; instalar con `npm ci` en cada entorno. No mezclar npm, pnpm y yarn ni cambiar el lockfile para resolver una instalación local.

## 2. Crear configuración local

**Linux/macOS:**

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

**Windows PowerShell:**

```powershell
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env.local
```

Completar los archivos en un editor. Nunca introducir secretos en comandos que queden en el historial ni publicarlos en GitHub. Los valores del proyecto compartido se solicitan al propietario por canal seguro; clonar un repo público no concede acceso a Supabase, Groq, Resend o Vercel.

| Archivo | Valores necesarios | Consideraciones |
|---|---|---|
| `apps/api/.env` | PORT, WEB_ORIGIN, DATABASE_URL, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY | Rol runtime restringido; sin DDL |
| `apps/api/.env` | DATABASE_SSL_CA_FILE o DATABASE_SSL_CA_CERT | CA pública verificada para PostgreSQL cloud |
| `apps/api/.env` | GROQ_API_KEY y modelos | Solo servidor; sin clave el reporte se conserva pero el análisis no puede completarse |
| `apps/api/.env` | RESEND_API_KEY, EMAIL_FROM, NOTIFICATION_RECIPIENT | Opcional; sin configuración se muestra pendiente, no se inventa envío |
| `apps/api/.env` | N8N_WEBHOOK_URL, N8N_WEBHOOK_SECRET, N8N_MODE | Mantener sin configurar hasta acordar webhook y modo propuesta; asistente de Tomas integrado en el menú |
| `apps/web/.env.local` | NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | Datos públicos de Auth, nunca service_role |
| `apps/web/.env.local` | API_URL y NEXT_PUBLIC_API_URL | Ejemplo local: http://127.0.0.1:4000 |

Para el certificado incluido, usar ruta absoluta del host a `apps/api/certs/supabase-ca.crt`. En Windows puede escribirse `C:/ruta/campusflow/apps/api/certs/supabase-ca.crt`. No desactivar la verificación TLS. Reiniciar los servidores después de editar variables; las variables públicas de Next requieren recompilar para producción.

Valores alineados por defecto: API 4000; web 3000; `WEB_ORIGIN=http://127.0.0.1:3000`. No mezclar `localhost` y `127.0.0.1` en callbacks y origen si no están autorizados.

## 3. Preparar Prisma y datos

```bash
npm run db:generate
npm run db:validate
```

**Si se usa el Supabase compartido:** sus migraciones ya están aplicadas. No ejecutar `migrate reset`, no recrear roles ni borrar tablas. Confirmar con Deimer la revisión del esquema antes de cambiarlo.

**Solo para una base nueva autorizada:** configurar `DIRECT_URL` con credencial de migración separada y ejecutar `npm run db:deploy`. Configurar permisos runtime y trigger de perfiles siguiendo `docs/sql/runtime-and-auth.sql`. No ejecutar ese SQL indiscriminadamente sobre proyectos ajenos o ya provisionados.

Importadores idempotentes, cuando corresponda:

```bash
npm run db:import-spaces -w @campusflow/api
npm run db:import-schedule -w @campusflow/api
```

El horario es una plantilla sin fecha confirmada; importar no crea reservas. El catálogo de salas no implica que todas estén habilitadas. No sustituir datos oficiales con fixtures de pruebas.

## 4. Iniciar y verificar

```bash
npm run dev
```

Abrir `http://127.0.0.1:3000`. Verificar API en `http://127.0.0.1:4000/health` y conexión a datos en `/ready`. Un proceso vivo no acredita una BD conectada.

Registrar/confirmar una cuenta legítima. El registro crea CLIENT; no permite elegir ADMIN. Para operar como administrador pedir al propietario la asignación autorizada. Configurar Site URL y callback `/auth/callback` en Supabase para cada origen utilizado. No reutilizar contraseñas ni compartir sesiones.

## 5. Antes del primer commit

1. Ejecutar las comprobaciones de [TESTING.md](TESTING.md).
2. Revisar `git status`, `git diff --check` y los archivos preparados para commit.
3. Comprobar que `.env` y `.env.local` están ignorados con `git check-ignore apps/api/.env apps/web/.env.local`.
4. Actualizar contrato/documentación si se cambian endpoints o esquema.
5. Abrir PR hacia `develop`, solicitar revisión y esperar CI. No hacer force push compartido.

## Problemas frecuentes

| Síntoma | Comprobación y solución |
|---|---|
| Prisma Client no encontrado | Ejecutar db:generate; no versionar el cliente generado |
| `P1000`/autenticación PostgreSQL | Confirmar usuario, contraseña y proyecto con propietario; no imprimir DATABASE_URL |
| Certificado no válido | Ruta/PEM de la CA correcta, pooler/proyecto correctos; mantener TLS verificado |
| Login no conectado | Variables públicas de Supabase en web y reinicio/rebuild |
| Correo confirmado pero callback falla | Origen y callback permitidos en Supabase; enlace vigente |
| API devuelve HTML o conexión rechazada | API ejecutándose, puerto correcto y API_URL alineada |
| Puerto ocupado | Detener solo el proceso propio o configurar puertos/origen/proxy coherentes |
| Playwright no encuentra Chromium | `npm exec playwright install chromium`; Linux puede requerir `--with-deps` |
| Sharp/Prisma falla tras cambiar de OS | Instalar desde cero con npm ci; no reutilizar node_modules |
| n8n devuelve 503 | Revisar si está pendiente de configuración; no activar mode=proposal sin acuerdo con Tomas |
| 409 al guardar horario | Recargar: otro operador cambió la revisión o existe un conflicto de sala/docente |
