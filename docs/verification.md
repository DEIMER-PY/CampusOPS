# Evidencia de verificación

> Registro histórico: la última sección prevalece para el estado vigente.

16 octubre 2026. No sustituye la demostración exigida por el jurado.

- npm run check: lint sin errores (avisos de especificidad CSS), typecheck API/web, nueve tests unitarios y builds correctos.
- npm run db:validate: schema Prisma válido.
- Cuatro migraciones aplicadas en PostgreSQL 18 aislado y en Supabase CampusFlow. Cloud por MCP con baselining de checksums de Prisma, no mediante credencial runtime de DDL.
- test:integration: dos pruebas reales Express/Prisma/PostgreSQL. Protecciones de aforo/solapes, préstamo único, inhabilitados, autorización, propiedad, auditoría y fallo IA sin respuesta ficticia. Identidad de esas pruebas usa doble local y fixtures aislados.
- RUN_LIVE_AI=1: recorrido HTTP con reporte fixture, contexto no personal, Groq real y resultado persistido en campusflow_test. Fecha de contexto y límites conservados. Modelo openai/gpt-oss-20b confirmado disponible. No equivale a login real Supabase.
- Playwright desktop y móvil: seis smoke pasaron. Dos escenarios sin configuración se omiten localmente por usar servicios configurados; corren en CI sin secretos. Capturas de landing real y revisión estática del componente dashboard. No declarar dashboard E2E autenticado verificado.
- n8n: dos unit tests de contrato/adaptador con doble explícito. Webhook no recibido ni activado; no se certifica ejecución real ni persistencia de agenda.
- Supabase advisors: solo INFO por RLS sin políticas en _prisma_migrations, intencional denegación pública. Runtime no puede promover perfiles ni borrar auditoría. btree_gist fuera de public.
- Diseño: detector [] una vez. Revisor independiente disposition ship para cuatro correcciones concretas; no certifica pixel-perfect. Documentador entregó DESIGN.md y sidecar. Faltan gates comp-led históricos, sin evidencia fabricada.
- Usuario canceló diapositivas: se conserva guion hablado y se integró explicación RAG con imagen generada, texto accesible y aviso de implementación pendiente. Ensayo grupal y modificación en menos de tres minutos aún pendientes.

Antes de merge: CI remota del PR final y revisión por otro integrante. Antes de la demo: cuenta registrada y confirmada, inventario privado recibido y webhook/persistencia de Tomas acordados.

## Incremento de planos, evidencia y horarios — 16/10/2026

Compilación completa API/Next, typecheck y seis archivos unitarios aprobados. Dos suites de integración pasaron con Express/Prisma/PostgreSQL aislado: concurrencia, permisos, evidencia normalizada/inmutable, conversación, caché de visión, correo con destinatario fijo e idempotencia y horarios con revisión/solapes. Identidad, Groq y Resend usan dobles en esas integraciones; no acreditan entrega real ni inferencia visual real. Lint sin errores con avisos CSS existentes.

ScheduleBoard verificado en Supabase: 24 bloques, 9 columnas, fecha nula y revisión inicial 1. /ready del despliegue Vercel respondió ready. La suite completa Playwright Test no se repitió para todo el incremento. Playwright CLI sí capturó portada y login desktop/móvil sobre compilación local 3100, sin sesión ni credenciales. Capturas privadas de revisión anterior se identifican por separado en docs/assets/README.md.

Siguen pendientes: webhook n8n real, RAG documental, mapeo de plano, fecha/equivalencias del horario, visión real y entrega de correo. No asignar calificación de rúbrica a partir de estas pruebas.


## Última ejecución y recorrido real — 16/10/2026

`npm run check` final completado con éxito: 16 pruebas unitarias, typecheck y build API/Next. Biome informa 100 avisos, sin errores; no solo CSS. Dos pruebas de integración PostgreSQL aislado aprobadas. Playwright: 10 passed, 2 skipped, desktop/móvil; las omitidas son escenarios sin configuración reservados a CI sin servicios.

Comando E2E ejecutado: `E2E_EXTERNAL_SERVERS=1 E2E_BASE_URL=http://127.0.0.1:3100 E2E_API_URL=http://127.0.0.1:4100 npm run test:e2e`.

Historia verificada: navegador ADMIN legítimo → crear reporte ficticio marcado PRUEBA FUNCIONAL AUTORIZADA → Express → Groq real → PostgreSQL → resultado visible. Reporte 2ee7ee8a: status OPEN, aiStatus COMPLETE, category TECHNICAL, priority LOW, comprobados por lectura SQL. Se conservó ese reporte identificado como prueba; no se cambió ningún equipo real. Esto no acredita alta/confirmación de todos los perfiles ni visión/correo/n8n reales.

Adaptador n8n ampliado con casos de configuración/URL, modo incorrecto, red/HTTP, JSON y catálogo inconsistente. URL malformada corregida para devolver N8N_INVALID_CONFIG. Proveedor de esas pruebas es un doble explícito.

CI ahora incluye jobs Windows/macOS además de Linux con PostgreSQL; su ejecución remota debe consultarse en Actions. No se realizaron pruebas locales Windows/macOS. La falta de runs anteriores en esta rama se explica por el trigger previo, limitado a develop/main y PR; se añadió feature/**.

Documentación reproducible: docs/GETTING_STARTED.md y docs/TESTING.md. Neural Routing es el nombre del equipo; su imagen de presentación no acredita capacidades de entrenamiento ni optimización de redes.

### Ajuste tras CI sin credenciales

CI detectó que /portal, sin configurar Supabase, mostraba el shell desconectado en vez de redirigir. Se unificó el acceso: sin cliente Auth o sin sesión, redirige a /login, donde el estado sin configuración ya deshabilita credenciales. No se omitió ni relajó el test de protección del portal. Requiere consultar el siguiente resultado remoto de CI.


### Robot integrado en login

Imagen editada mediante image_gen a alpha real; WebP de 840×840 conserva cuatro canales. Nueva composición responsiva verificada a 1033×900 y 390×844. Build web, typecheck y cuatro Playwright enfocados (login y navegación desktop/móvil) aprobados. Revisión independiente acotada: ship, sin defectos materiales. Solo cambia presentación; no se modifican credenciales, Auth ni reglas.

## Integración de Tomas y refinamiento del dashboard — 16/10/2026

Rama de Tomas incorporada con su historial: feature/3-n8n-prisma-agenda, commit 99d05a6 (PR #8). Incluye workflow, motor determinista, asistente y contrato API. Se conservaron los nuevos formularios, robot editado y portada con captura completa del dashboard. El SVG del stack incorpora iconos de Simple Icons con procedencia y revisión fijadas.

Se añadieron GET /api/agenda/status (solo roles operativos, sin URLs/secretos) y bloqueo visual de ejecución cuando el servidor no la habilita. La API envía UUID de actor, no el prefijo de su correo. La fecha opcional ya no se rellena automáticamente con hoy, para no sobrescribir la intención del texto. PROPUESTA siempre se presenta como NOT_APPLIED. APPLIED se identifica como declaración de n8n; requiere contrastar la agenda, no prueba por sí solo entrega ni operación externa.

SQL de agenda y protección adicional aplicados en Supabase CampusFlow, registrados con checksums Prisma. No se creó rol/login n8n ni se habilitó ejecución remota. Tres pruebas de integración PostgreSQL aislado aprobadas, incluida extensión sobre sala deshabilitada, rollback, ausencia de permiso PUBLIC y clasificación externa separada de Groq. Las nueve migraciones también se aplicaron desde cero en campusflow_migration_smoke. La base de pruebas histórica tenía tres migraciones aplicadas manualmente sin registro: se baselinaron sin reset ni cambios destructivos.

npm run check aprobado: 20 unitarias, tipos y build; 141 avisos de lint en esa corrida, sin errores. Motor n8n probado mediante node --test tests/n8n/motor.test.mjs (un archivo contenedor; los escenarios están dentro). Playwright configurado: 10 aprobadas / 2 omitidas. No confundir los tests del motor con Gemini/Evolution reales. La máquina sigue sin N8N_WEBHOOK_URL/N8N_MODE; se solicitó URL al usuario. Integración externa real pendiente.

Plano: vista horizontal centrada de la geometría original, modo integrado monocromo/original, zoom y catálogo real separado. No hay marcadores de coordenadas inventados. Incidencias y reservas tienen componentes separados y composición adaptativa, con las mismas mutaciones y validaciones de API.

### URL de n8n recibida

Usuario proporcionó localhost:5679/webhook-test/campusflow y localhost:5678/webhook/campusflow. Prueba healthz: 5678=200, 5679 sin conexión. Consulta ficticia PROPUESTA a 5678: 404 webhook no registrado; interfaz /setup pide cuenta propietaria. Se solicitó al usuario completar el acceso sin compartir contraseña. URL local guardada en archivo ignorado y N8N_MODE=proposal. No se habilitó ejecución, rol login ni WhatsApp. La declaración anterior de URL no suministrada queda superada; conexión operativa sigue pendiente de propietario/workflow/credenciales.
