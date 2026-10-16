# Evidencia de verificación

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
