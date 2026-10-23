# Estado vigente — incremento módulos 2 y 3

## Implementado

Portada oscura azul Campuslands con Poppins autoalojada, logo oficial y Lenis solo landing. Dashboard responsive con formularios/listas para inventario, estados, préstamos, devoluciones, incidencias y propuesta de IA; espacios/reservas integran el contrato de Tomas. Estado/carga/error/vacíos explícitos; sin métricas ni operaciones ficticias. Cierre de sesión móvil y cargas parciales independientes.

Express implementa recursos (alta y cambio de estado), préstamos y devolución operativa, incidencias (alta, lectura por propietario, análisis y seguimiento), cancelación de reserva y auditoría ADMIN. Mutaciones auditadas; bloqueo de recursos e índice parcial para concurrencia. Triaje real Groq configurable openai/gpt-oss-20b con JSON Schema estricto, Zod, lease recuperable, timeout y reintentos explícitos. COMPLETE no vuelve a invocar proveedor.

Supabase campusflow creado por autorización del usuario: qysefuxctqvcfcyggzoi, us-east-2. Verbarena pausado con datos conservados. Cuatro migraciones de Prisma aplicadas vía MCP y baselined con checksums; runtime restringido, TLS con CA oficial, esquema privado, perfiles CLIENT por trigger Auth. Secretos solo .env ignorados con permisos 0600. Catálogo 11 espacios del contrato n8n importado como DISABLED, pendiente de validar guía original. Inventario tecnológico vacío hasta registro real.

## Verificación de este incremento

- Groq /models validó modelo; inferencia real clasificó prueba de proyector como TECHNICAL/HIGH/SOPORTE_TECNICO en aproximadamente 0.9s (medición puntual, no SLA).
- Nueve unit tests de reglas y adaptación IA pasaron; check incluye lint, TypeScript y builds. Lint conserva avisos de especificidad CSS, sin errores.
- PostgreSQL aislado campusflow_test: restricciones de reservas y préstamos concurrentes verificadas. Integración HTTP con Express+Prisma: préstamo único, rechazo por mantenimiento, devolución solo operador, privacidad por propietario y auditoría. Auth en esa prueba usa servidor doble local; no certifica Supabase Auth.
- RUN_LIVE_AI=1 también pasó integración HTTP → PostgreSQL → Groq → resultado persistido; fixtures eliminados de la BD aislada.
- Playwright: cuatro smoke desktop/móvil pasaron; dos casos sin configuración omitidos localmente al usar servicios configurados, deben correr en CI sin secretos. Capturas CLI desktop y móvil de portada, sin overflow ni errores JS.
- Advisors Supabase: movida btree_gist fuera de public. Solo INFO de RLS sin políticas en _prisma_migrations, intencional para denegar acceso público; anon/authenticated sin permisos.

## Pendiente antes de declarar entrega operativa completa

Cuenta humana administradora: usuario debe registrarse y confirmar email; aún no se verificó login real ni se asignó ADMIN. No versionar su correo/contraseña ni incluir claves en salida. Configurar Site URL, allowlist /auth/callback y SMTP del proveedor si la entrega de correo lo requiere. No omitir verificación para completar una demo.

Revisar CI remota del PR actual, aprobación por integrante y merge a develop. No desactivar protección. Historial inicial PR #5 corrige accesibilidad de icono; esta rama incluye ese ancestro. No hay despliegue público de la app todavía.

RAG, chat realtime, reuniones, paginación y claves de idempotencia de creación no están implementados. Rate limit en memoria sirve una instancia; revisar almacenamiento compartido antes de múltiples réplicas. Áreas IA son colas configuradas, no organigrama oficial; no se asignan personas automáticamente. Consultar docs/implementation-modules-2-3.md y OpenAPI.

## Equipo y Git

Última instrucción: nuestro alcance módulos 2 y 3; Tomas lo demás (módulo 1/espacios). Leonardo datos/SQL, Samuel experiencia, Deimer integración/Auth/IA. Repo https://github.com/DEIMER-PY/campusflow , default develop protegido con aprobación y quality. Ramas feature y commits convencionales con emoji. Invitaciones write previamente enviadas a Leonardo4516, SamuelJoseMantilla, TEstebanGQ.

Antes de continuar leer AGENTS.md, apps/web/AGENTS.md, PRODUCT.md y DESIGN.md. Contrato visual y límites de gates comp-led en docs/design-review.md; no afirmar pixel-perfect. La primera composición verde/marfil fue descartada.

## Última ampliación del usuario: contrato n8n, rúbrica y RAG

Guía oficial y contrato recibidos y revisados. Matriz completa en docs/rubric-audit.md, sin puntuación inventada. Bloque de telemetría no confirmado/no incorporado por indicación del usuario. Catálogo corregido con Azules/6, ahora 11 espacios. Importador transaccional valida archivo completo y no altera estados/aforos existentes.

Triaje v2 envía snapshot acotado aprobado por usuario a Groq, excluyendo propietarios y reservas de terceros; fecha/límites trazables. Groq real + snapshot probado en BD aislada. Adaptador n8n POST /api/calendar/proposals validado y solo para ADMIN/OPERATOR, sin webhook configurado: requiere modo propuesta confirmado por Tomas; no ejecuta reubicación ni sustituye estados de PostgreSQL. No hay interfaz n8n activa todavía.

Leonardo continúa frontend e integraciones/planos según última indicación. Tomas desarrolla n8n/módulo 1. Guion hablado en docs/pitch-rehearsal.md; el usuario canceló diapositivas y priorizó explicación RAG en web; demo con cuenta real y ensayo grupal pendientes. Plan RAG PDF/Excel/datos simulados etiquetados en docs/rag-ingestion-plan.md: no afirmar ingesta o RAG implementados.

Relevo final completo para Leonardo: docs/LEONARDO_HANDOFF.md. Explicación RAG en /#rag implementada con WebP generado, procedencia y prompt en docs/rag-image-provenance.json, texto accesible y límite de estado previsto. Ingesta/chat RAG no implementados.

## Continuación frontend — 19 octubre 2026

Rama local `feature/frontend-campus-operations` desde el `develop` que estaba abierto. Sin merge, push ni despliegue. Se preserva el cambio previo de `apps/web/next-env.d.ts`.

Rediseño completo de presentación: portada asimétrica con fotos aportadas y retocadas por IA, galería navegable, capítulos con transiciones por scroll y Lenis; login con robot 2D que responde al puntero fino. Portal abre en Resumen, navegación agrupada y menú móvil. Incidencias separa lista/detalle/composición, devuelve foco y conserva error de análisis después de refrescar. Recursos separa inventario/préstamos y filtros locales. Resumen deriva tareas y alcance de los registros cargados. Shell, tipos compartidos, detalle e interfaces extraídos de Workspace; estilos divididos por superficie y 146 reglas heredadas sin uso retiradas.

Contratos API, BD, permisos y operaciones existentes conservados. No se han acreditado nuevas capacidades de RAG, n8n, visión, correo o realtime. Las pruebas nuevas de presentación usan identidad y respuestas aisladas, rotuladas como PRUEBA; no equivalen a E2E real de Supabase o Groq. Consultar la última sección de `docs/verification.md` para resultados y límites.

Fotografías: las 12 del ZIP se revisaron; tres seleccionadas para edición con image_gen y exportación WebP. Procedencia en `docs/campus-photographs.json`, prompts en `docs/media/campusflow-photo-edit-prompts.md`. Las versiones retocadas no son datos oficiales ni fuentes para contar o posicionar activos.

Video solicitado: guion español de 206 palabras y brief de ocho escenas, duración orientativa 105 s, preparados en `docs/media/campusflow-explainer/`. El MCP HyperFrames no estaba conectado y ElevenLabs redirigía a login. Se solicitó al usuario conectar los servicios. No existe render MP4 ni voz generada; continuar por los proveedores solicitados después de autenticar, sin sustituirlos silenciosamente ni prometer ingesta RAG funcional.

### Segunda iteración visual — carrusel, acceso, consola y RAG nativo

Se implementaron las nuevas referencias del usuario: carrusel de tres fotos propias con tarjetas expandibles, navegación por flechas/teclado y gestos; robot ilustrado de cuerpo completo, extendido desde la mascota anterior con ImageGen. Acceso con escena fotográfica, orientación y ayuda de roles; formulario y marca primero en móvil. No es un modelo 3D: el puntero transforma la ilustración mediante CSS.

El resumen ahora utiliza una consola compacta: identidad del campus, buscador de módulos con permisos, cola de atención, catálogo local con búsqueda y vista lista/tarjetas, préstamos, seguimiento y reservas. No cambia cargas ni contratos API. Los estilos se separan en `campus-gallery.css`, `rag-architecture.css`, `access.css` y `console.css`; se retiraron reglas sustituidas de las superficies anteriores.

`/#rag` muestra siete pasos nativos de HTML/SVG, selección manual y reproducción finita con pausa. Movimiento reducido conserva los controles manuales y desactiva reproducción. El WebP anterior queda como enlace secundario; ingesta, índice y chat siguen pendientes. El video narrado HyperFrames/ElevenLabs permanece pendiente de conexión, como se documentó arriba.

Calidad final: `npm run check` aprobado con Node 24.19.0/npm 11.19.1; lint sin errores, 130 advertencias y una observación, tipos API/web, 20 unitarias y ambos builds. Suite pública 17 aprobadas/3 omitidas; presentación aislada 21 aprobadas/3 omitidas. Matrices 360/390/768/1024/1440, reflujo CSS 200%, roles de presentación, filtros, fallos parciales, foco y movimiento reducido. Sigue pendiente acreditar recorridos autenticados reales y auditoría formal de accesibilidad. Sin push ni deploy; cambio local anterior de `next-env.d.ts` conservado.


## Entrega consolidada — dashboard y flujo n8n (19 octubre 2026)

Base actualizada por fast-forward a `origin/develop c179d63` (PR #14: Groq principal/Gemini de respaldo). Rama de entrega `feature/frontend-campus-operations`, destinada a PR hacia `develop`; no se mezcla ni publica directamente sobre develop. El cambio previo de `next-env.d.ts` se conserva fuera del commit. Las secciones anteriores son históricas: esta actualización prevalece para el estado actual.

- Gestión → Asistente de agenda: tareas guiadas, campos opcionales, contexto con alcance, comprobación/reintento de configuración, envío real mediante API autenticada existente, separación propuesta/aplicación, confirmación y refresco de módulos tras `APPLIED`. La UI no toma el rol de autorización del formulario ni llama directamente al webhook.
- Workflow importable de 24 nodos: Groq y respaldo Gemini conservados, web por defecto en `PROPUESTA`, reportes de 4000 caracteres sin truncamiento a 1000, avisos administrativos solo después de `APLICADA` confirmada. Se conservan las reglas y funciones transaccionales existentes. Ante fallo de respuesta en ejecución, la API ya no asegura que no hubo cambios: pide revisar reservas/incidencias/auditoría antes de repetir.
- Se recuperan las tres regresiones de fechas/consulta del PR #13; la lógica correspondiente ya está en develop. No se reemplaza el intérprete actual por la exportación más antigua ni se cierran PR de compañeros automáticamente.
- Feedback visual: plano con vinculación manual local por navegador (sin coordenadas oficiales inventadas), marcador/zoom/eliminación; agenda guiada; calendario por sala sin scroll por bloque; auditoría agrupada y detalle; avatar del rol; hero con selección de fotos, revisión humana por pasos, RAG por etapas y footer ampliado; login con robot sin fotografía de fondo.
- HyperFrames: composición HTML real de 8 escenas/105 s en `docs/media/campusflow-explainer/composition`, CLI 0.8.178, `check` aprobado con 8 advertencias estructurales. Preview local 3102. Voz ElevenLabs y MP4 pendientes, sin afirmar render terminado ni servicio RAG implementado.

Verificación local con Node 24.19.0/npm 11.19.1: `npm run check` aprobado (150 advertencias y una observación, sin errores; tipos, 20 unitarias y builds); motor n8n 32/32; UI aislada 31 aprobadas/3 omitidas; pública 19 aprobadas/3 omitidas. La nueva suite de dashboard se incluye también en CI. Matriz responsive 360/390/768/1024/1440 y pruebas de foco/movimiento reducido dentro del alcance aislado. No equivalen a cuentas Supabase multirrol ni a servicios reales.

Bloqueo operativo actual: puertos locales n8n 5678/5679 sin respuesta y Docker sin daemon. Para acreditar el flujo real hacen falta instancia disponible, credenciales asignadas, webhook activado y recorrido autenticado con escritura autorizada. No se activaron `N8N_MODE=execute`, WhatsApp ni rol de login de BD en esta sesión; no se cambiaron esquema, permisos ni dependencias raíz.

## Entrega módulo comunicaciones en tiempo real (WebSocket nativo) — 23 octubre 2026

Rama de trabajo: `feature/realtime-comms-websocket` (aislada de develop).

### Implementado
- **Roles por Área:** Ampliación del enum `Role` a 7 áreas operativas del campus: `ADMIN`, `FORMACION`, `COWORKING`, `MARKETING`, `SOPORTE`, `FULL_SERVICE`, `CLONAI` (con retrocompatibilidad para `CLIENT` y `OPERATOR`).
- **Esquema de Datos y Canales:** Modelo `CommunicationChannel` y `ChannelMessage` en PostgreSQL vía Prisma con migración `20261022180000_realtime_communication`. Canales base: `#avisos-generales`, `#formacion`, `#co-working`, `#marketing-alianzas`, `#soporte-tecnico`, `#full-service`, `#clonai`.
- **Motor WebSocket Nativo:** Servidor WS montado en Express HTTP upgrade en `apps/api/src/realtime/socket-server.ts`. Handshake con validación JWT contra Supabase Auth, presencia en tiempo real con heartbeat `ping/pong`, difusión de mensajes por canal y eventos de alta prioridad (`URGENT`).
- **Sistema de Menciones y Notificaciones:** Detección de menciones a usuarios (`@usuario:Nombre`) en el payload del mensaje con despacho directo de evento `USER_MENTIONED` a los sockets activos del destinatario y toast flotante en frontend. Soporte de menciones de recursos y espacios.
- **Directorio y Reasignación de Área:** Endpoints `GET /api/members`, `GET /api/admin/users`, `PATCH /api/admin/users/:id/role` con validación estricta de rol `ADMIN`.
- **Frontend Interactivo:** Hook `useCampusSocket` y componente `CommsView` integrado en el dashboard bajo la pestaña "Comunicaciones" y barra de alerta `RealtimeAlertBanner`.
- **Cuentas Simuladas Verificadas:** 6 cuentas de área creadas con contraseña `CampusFlow2026!` probadas exitosamente con Supabase Auth:
  - Formación: `carlos.formacion@campuslands.com`
  - Co-Working: `ana.coworking@campuslands.com`
  - Marketing: `laura.marketing@campuslands.com`
  - Soporte: `david.soporte@campuslands.com`
  - Operaciones / Full-Service: `marta.operaciones@campuslands.com`
  - ClonAI: `felipe.clonai@campuslands.com`

### Verificación
- Pruebas unitarias de realtime (`apps/api/tests/realtime.test.ts`): 4 tests pasando (24/24 tests totales en API).
- `npm run typecheck`: 0 errores en `@campusflow/api` y `@campusflow/web`.
- `npm run build`: compilación limpia en ambos paquetes.
- Biome check: 0 errores de formateo o lint en los archivos creados/modificados.

