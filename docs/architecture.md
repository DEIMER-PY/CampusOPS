# Arquitectura decidida — 16 octubre 2026

## Selección

Next.js App Router + React + TypeScript + Tailwind para presentación; Express para API de dominio; Supabase PostgreSQL + Prisma para datos; Supabase Auth para identidad. npm workspaces evita añadir orquestadores antes de necesitarlos. Next no duplica servicios de dominio ni usa un custom server Express: son dos procesos y dos despliegues coordinados.

| Alternativa | Velocidad inicial | Decisión |
|---|---|---|
| Supabase Auth + Data API/RPC | Menos backend para CRUD; lógica transaccional en SQL | La más rápida si se elimina Express/ORM; no sigue el stack solicitado |
| Supabase PostgreSQL/Auth + Express + Prisma | Algo más de configuración, consultas tipadas y migraciones | Elegida por el stack y la concurrencia solicitados |
| PostgreSQL propio + Prisma + Auth propio | Más operación y seguridad que resolver | No aporta velocidad hoy |

Supabase es el proveedor/plataforma; PostgreSQL es la base; Prisma es el ORM. No son tres sustitutos. RAG o realtime no justifican otra base.

## Límites de confianza

Navegador → Next (UI/sesión SSR). Navegador o Server Component → Express mediante bearer token. Express verifica usuario en Supabase Auth, obtiene perfil/rol desde BD y aplica permisos/propiedad. Prisma conecta únicamente desde Express. El identificador del actor no se acepta del cliente.

Perfil CLIENT consulta sus operaciones; OPERATOR opera reservas/préstamos y atiende incidencias; ADMIN gestiona configuración y consulta auditoría. La autorización efectiva reside en Express y queries filtradas. Ocultar botones no protege datos. El primer código implementa perfil, lectura de reservas propias y auditoría restringida; extender el contrato antes de añadir nuevos endpoints.

Sesiones: @supabase/ssr con cookies y proxy de actualización; usuario validado con getUser. Respuestas privadas sin caché compartida. Credencial Prisma runtime con permisos DML mínimos sobre app_private; credencial de migración separada. Roles administrativos asignados por operador autorizado en BD, sin usar user_metadata. No exponer app_private en Data API ni en publicación Realtime sin revisar acceso.

## Integridad y concurrencia

Prisma simplifica modelos y consultas pero **no evita carreras por sí solo**. La migración añade CHECK positivos/intervalos, exclusión GiST con btree_gist para impedir solapes de reservas activas, e índice único parcial para un solo préstamo activo por recurso. SQL personalizado debe conservarse al generar migraciones futuras.

Reservas bloquean la fila del espacio, revalidan capacidad/estado, consultan conflictos y crean reserva y auditoría en una transacción ReadCommitted. El bloqueo debe ser respetado también al cambiar aforo/estado. La exclusión protege incluso ante rutas de inserción nuevas. No mantener conexiones mientras se llama a IA.

Préstamos deben bloquear recurso y crear/cerrar préstamo con auditoría atómica; aún pendiente de servicio. Reintentos de creación deben incorporar idempotency keys para evitar duplicados tras timeout. Errores SQL no se exponen al usuario. Ensayo obligatorio con dos conexiones simultáneas: solo una reserva/préstamo debe sobrevivir para el mismo activo.

## Comunicaciones en tiempo real y modelo de áreas (WebSocket nativo)

El subsistema de coordinación operativa utiliza un servidor WebSocket nativo (`ws`) acoplado al ciclo de vida del servidor HTTP Express (`apps/api/src/index.ts`):

1. **Protocolo y Autenticación:** Las conexiones cliente inician con un handshake en `ws://.../ws?token=JWT`. El servidor valida el token contra Supabase Auth y resuelve el rol y perfil desde PostgreSQL (`app_private.profiles`). No se admiten conexiones anónimas ni se aceptan identificadores de usuario desde el cliente.
2. **Modelo de Áreas Transversales:** Se sustituye la jerarquía vertical rígida por 7 áreas de campus (`FORMACION`, `COWORKING`, `MARKETING`, `SOPORTE`, `FULL_SERVICE`, `CLONAI`, junto a `ADMIN`). Todas las áreas pueden comunicarse entre sí en canales temáticos abiertos para solicitar préstamos, colaboración o traslados. El canal `#avisos-generales` está restringido para escritura exclusiva de `ADMIN`.
3. **Menciones y Notificaciones Dirigidas:** El motor de sockets analiza los mensajes entrantes con sintaxis formal (`@usuario:Nombre`, `@espacio:Nombre`, `@equipo:Código`). Cuando un usuario es mencionado, se genera y despacha un evento `USER_MENTIONED` de alta prioridad a las conexiones activas del destinatario, activando notificaciones flotantes (toasts) en tiempo real en el frontend.
4. **Presencia y Latido:** Control de conexiones activas con `ping`/`pong` cada 30s. Al unirse o salir de un canal, se difunde `PRESENCE_STATE` para actualizar los indicadores de presencia (`● N en línea`).
5. **Persistencia de Historial:** Los mensajes se almacenan transaccionalmente en `app_private.channel_messages` vinculados a `app_private.communication_channels` y `app_private.profiles`, permitiendo lectura paginada vía REST (`GET /api/channels/:slug/messages`) al abrir cualquier canal.

## Entorno y despliegue

Web 3000, API 4000. Origen web explícito en CORS, peticiones con Authorization y JSON validado. No guardar tokens en logs. API con Helmet, límites de cuerpo/solicitudes y request ID. Revisar trust proxy solo al conocer la topología; rate limit en memoria es para una instancia, usar almacenamiento compartido antes de escalar réplicas.

Supabase: región cercana, runtime por pooler, conexión de migraciones directa o session pooler compatible con IPv4. Pool máximo inicial 5 por proceso: presupuestar réplicas × pool + conexiones de Auth/realtime/admin, medir y ajustar, no prometer una cantidad de usuarios sin carga real. No desactivar verificación TLS para resolver conexiones.

Web y API pueden alojarse en servicios Node existentes; Supabase almacena datos. Elegir cuentas y costes antes de provisionar. Logs de aplicación sin datos personales, salud separada de readiness, apagado ordenado. Migraciones se ejecutan una vez por release y con copia de seguridad en producción.

## Fuentes verificadas

- https://nextjs.org/docs/app/getting-started/installation
- https://tailwindcss.com/docs/installation/framework-guides/nextjs
- https://supabase.com/docs/guides/database/prisma
- https://supabase.com/docs/guides/auth/server-side/creating-a-client
- https://www.prisma.io/docs/orm/v7/prisma-client/setup-and-configuration/introduction
- https://www.postgresql.org/docs/current/ddl-constraints.html

Se consultó changelog Supabase: cambio anunciado de cifrados TLS heredados para 10 noviembre 2026; usar clientes modernos. Las versiones exactas provienen del registro npm, no de recordar ejemplos antiguos.
