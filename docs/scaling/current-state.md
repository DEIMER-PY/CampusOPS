# Auditoría del estado actual

Corte: **2026-10-23, aproximadamente 17:14 UTC**. Base local y remota `develop a2a8916`; árbol limpio antes de revisar. Se ejecutó `git fetch origin`; no se mezclaron ramas. Las consultas Supabase fueron de lectura y metadatos/agregados, sin recuperar correos ni cuerpos de mensajes.

## Estado por capacidad

| Capacidad | Evidencia actual | Límite |
|---|---|---|
| Dashboard | Resumen, recursos/préstamos, incidencias, agenda, calendario, planos y auditoría en `develop` | Resumen sobre registros cargados; listas principales limitadas a 50, sin paginación completa |
| Reglas | Bloqueos, transacciones, exclusión de reservas e índice parcial de préstamos en código/migraciones | Pruebas PostgreSQL de esta sesión no ejecutadas; evidencia anterior en verification.md |
| Triaje textual | Adaptador Groq y evidencia histórica real | No se invocó proveedor real en esta revisión |
| n8n | UI, adaptadores y workflow importable; motor 32/32 | `5678/healthz` respondió 200; `5679` sin conexión. Esto no verifica webhook activo ni credenciales ni ejecución |
| Correo | `integrations/email.ts`: Resend HTTP, destinatario fijo de servidor, hash de contenido y clave idempotente | Sin outbox durable ni webhook de entrega; `ACCEPTED` no acredita entrega |
| Visión | Adaptador, normalización de imágenes y estados persistidos | No se ejecutó inferencia real en esta sesión |
| RAG | Componentes `rag-architecture.tsx`/`rag-explainer.tsx`, estilos, imagen y plan | **No funciona como RAG:** sin ingesta, chunks, embeddings, recuperación ni API de preguntas |
| Comunicaciones | Código en rama realtime; tablas ya presentes en Supabase | Fuera de develop; CI quality falla; revisión de permisos y despliegue pendiente |
| SaaS | Modelos/helpers/migración/rutas en rama de integración | Aún no es una plataforma multiempresa operativa ni aislada |

## Ramas remotas comparadas

Los números expresan commits exclusivos de `develop` / exclusivos de la rama mediante `git rev-list --left-right --count origin/develop...<rama>`. No equivalen a funcionalidades pendientes: integraciones anteriores pueden haberse hecho por squash o con cambios equivalentes.

| Rama `origin/…` | HEAD | Diferencia | Lectura y acción |
|---|---|---:|---|
| `develop` | `a2a8916` | 0 / 0 | Base; PR #15 integrado |
| `feature/1-data-foundation` | `8c2e554` | 38 / 0 | Ancestro; bootstrap, sin entrega adicional |
| `feature/2-responsive-ui` | `8c2e554` | 38 / 0 | Ancestro; no representa UI actual |
| `feature/4-auth-triage` | `8c2e554` | 38 / 0 | Ancestro; no inferir trabajo pendiente por su nombre |
| `feature/3-loans-api` | `2c3fd24` | 38 / 2 | Histórica; préstamos ya existen en develop; revisar diferencias antes de reutilizar |
| `feature/3-n8n-orquestador` | `5f5334a` | 22 / 5 | PR #7 cerrado sin merge; no sustituir workflow vigente |
| `feature/3-n8n-prisma-agenda` | `29f0999` | 8 / 13 | PR #8 abierto; parte de su trabajo ya llegó por otras integraciones |
| `feature/n8n-supplied-workflow` | `9e3a0a5` | 9 / 1 | PR #13 abierto; revisar equivalencias de fechas/consulta ya recuperadas |
| `feature/realtime-comms-websocket` | `7f3154e` | 1 / 8 | Comunicaciones, perfiles y roles por área; candidata después de correcciones |
| `feature/integration-saas-realtime` | `d73faba` | 0 / 13 | Incluye realtime anterior y expansión SaaS; no contiene el último arreglo `7f3154e`; evitar merge masivo |

GitHub API confirmó PR #15 merged. En la consulta de check-runs: `a2a8916` tiene quality/macOS/Windows correctos; `d73faba` falla los tres; `7f3154e` tiene compatibilidad macOS/Windows correcta y quality fallido. No se descargaron logs para atribuir la causa del fallo. [CI develop](https://github.com/DEIMER-PY/CampusOPS/actions/runs/39878294389), [CI realtime](https://github.com/DEIMER-PY/CampusOPS/actions/runs/39992858485), [CI SaaS](https://github.com/DEIMER-PY/CampusOPS/actions/runs/39977618236).

## Hallazgos prioritarios

### P0: disponibilidad del despliegue

`https://campusflow-prototype.vercel.app/health`: 200, `status=ok`. `/ready`: 503, `status=unavailable`, observado dos veces. El proveedor Supabase reporta el proyecto activo y saludable; eso no demuestra conectividad desde Vercel. Revisar logs, variables del entorno desplegado, CA/TLS y pool antes de atribuir causa. `/ready` ejecuta `SELECT 1`: no deducir que este fallo se deba a los roles nuevos. No se identificó el commit desplegado.

### P0: divergencia entre aplicación, esquema e historial

Supabase contiene las ocho tablas de dominio de develop **más** `CommunicationChannel` y `ChannelMessage`. El enum `Role` contiene CLIENT/OPERATOR/ADMIN más FORMACION, COWORKING, MARKETING, SOPORTE, FULL_SERVICE y CLONAI. Existen perfiles asignados a esos seis roles adicionales. Sin embargo, `public._prisma_migrations` registra únicamente las nueve migraciones hasta `20261016190000_n8n_execution_guards`, todas terminadas. No registra `20261022180000_realtime_communication`.

Esto demuestra cambios adicionales sin el registro equivalente inspeccionado; no demuestra que toda la migración realtime se haya aplicado correctamente. Comparar columnas, índices, constraints, grants y SQL completo antes de hacer baseline. No ejecutar reset ni marcar aplicada una migración solo porque existan dos tablas. La primera consulta asumió erróneamente `_prisma_migrations` en app_private; se localizó en public y se repitió correctamente.

No aparecen tablas SaaS en app_private/public. No está instalada la extensión `vector` ni hay columnas con ese tipo en la consulta global de columnas. `btree_gist 1.7` sí existe. No se encontraron grants de tablas app_private para `anon`/`authenticated`; esto es una comprobación limitada, no una auditoría completa de roles heredados o funciones.

### P0: autorización incompatible con los nuevos roles

`app.ts` filtra reservas por propietario solo si `role === CLIENT`. `operations.ts` y `evidence.ts` usan el mismo patrón para acceso a incidencias, evidencias y préstamos. Los roles adicionales existentes caen en el ámbito amplio, mientras que las mutaciones operativas solo reconocen ADMIN/OPERATOR. Hay riesgo actual de lectura de terceros y permisos incoherentes; no se ensayó explotación con cuentas reales.

Corregir con permisos explícitos: lectura global solo a roles autorizados, propietario para los demás, rechazo de roles desconocidos, comprobación de organización cuando exista. El área de trabajo no debe convertirse automáticamente en privilegio. Prioridad previa a RAG y nuevos módulos.

### P0/P1: comunicaciones y ampliación SaaS

- La documentación remota de realtime contiene credenciales compartidas de prueba y datos de acceso. No se reproducen aquí. Retirar del contenido, rotar las cuentas afectadas y revisar exposición histórica con el integrador. Borrar una línea no revoca una credencial.
- `socket-server.ts` acepta token en query, conserva rol en memoria y admite JOIN sin validar pertenencia. No se observa validación Origin, límite explícito de payload/eventos ni revalidación periódica de permisos. Corregir antes de activar canales privados.
- La prioridad URGENT dispara un anuncio global; el handler inspeccionado no exige ADMIN para esa prioridad fuera del canal broadcast. Documento y código difieren: acordar política y probar handler real.
- `channel-routes.ts` devuelve directorio con email a cualquier autenticado; minimizar campos y alcance. Historial usa `take:60` con orden ascendente: recupera los primeros mensajes y carece de cursor, no los últimos 50 que describe la documentación.
- Los tests realtime inspeccionados redefinen helpers locales en lugar de importar handler/política productiva: no acreditan el comportamiento del servidor.
- En `d73faba`, `saasRoutes` existe pero no se importa/monta en `app.ts`; tampoco está montado allí `channelRoutes`. Los helpers aislados no prueban endpoints disponibles.
- La ruta propuesta de organizaciones hace `findMany` sin filtro de membresía. La ruta de actas guarda `OTP_VERIFIED_…` desde entrada sin evidencia de emisión/verificación de un desafío. No presentar esa marca como autenticación o validez jurídica probada. El consentimiento de tutor tampoco se acredita asignando una fecha desde una solicitud del usuario.

## Verificación ejecutada en esta sesión

| Comprobación | Resultado |
|---|---|
| Node / npm | 24.22.0 / 11.19.1 |
| `npm ci` | Correcto; auditoría reportó 0 vulnerabilidades; sin cambio de lockfile |
| `npm run db:generate` / `npm run db:validate` | Correctos con Prisma 7.10.1 |
| `npm run check` | Correcto: lint 150 avisos y 1 observación, tipos, 20 unitarias, builds API/web |
| `node --test tests/n8n/motor.test.mjs` | 32/32; sin n8n ni proveedores reales |
| `npm run test:e2e -- --workers=2` | 19 aprobadas, 3 omitidas; rutas públicas desktop/móvil |
| `npm exec playwright -- test -c playwright.frontend.config.ts --workers=2` | 31 aprobadas, 3 omitidas; identidad/API con fixtures |
| BD real | Solo lecturas MCP; no migraciones ni mutaciones |
| Integración PostgreSQL de pruebas | No ejecutada: Docker sin daemon disponible; no se usó la BD compartida |

Context7 se ejecutó para Prisma y Go. La búsqueda Go devolvió paquetes secundarios, sin resolver la biblioteca estándar; se usaron fuentes oficiales Go. La respuesta de Prisma mezcló referencias v6/v7 y comandos ajenos al CLI instalado: se contrastó con la [referencia oficial Prisma v7](https://www.prisma.io/docs/orm/v7/reference/prisma-cli-reference). No se adoptaron instrucciones incompatibles ni la actualización RC sugerida por el CLI. No se ejecutaron pruebas nuevas con login multirrol, entrega real de correo, embeddings o carga.
