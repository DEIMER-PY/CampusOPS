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
