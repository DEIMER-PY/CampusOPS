# Estado para continuar

Última actualización: 16 octubre 2026. Bootstrap preparado por solicitud de Deimer; no confundir con entrega completa de hackatón.

## Terminado y comprobado localmente

- Monorepo npm con dependencias exactas y lockfile; Node 24.22.0.
- Portada responsive, identidad visual, acceso y estructura de portal/admin. Ilustración conceptual CSS; no hay datos ficticios ni fotografías generadas presentadas como reales.
- Express: health/readiness, validación Supabase Auth y perfil, lectura de espacios/reservas/recursos/préstamos, creación transaccional de reserva, servicios transaccionales de préstamo/devolución (`POST /api/loans`, `POST|PATCH /api/loans/:id/return`) con bloqueo `FOR UPDATE` y auditoría atómica (`loan.created`, `loan.returned`), y consulta ADMIN de auditoría. Contrato actualizado en `docs/openapi.yaml`.
- Prisma 7.10.1 con esquema app_private; migración inicial con CHECK, GiST anti-solapes e índice parcial para préstamos activos.
- `npm run typecheck`, `npm test` (5/5 pruebas unitarias y de servicio transaccional) y `npm run build` (Express y Next) correctos; Biome limpio en `apps/api` y `docs`.
- `npm run db:validate`: esquema válido.
- Migración aplicada sobre PostgreSQL 18.6 temporal (WSL2), puerto 55439, base `campusflow_test` (`npm run db:deploy`). Prueba real `npm run test:integration` (1/1 pass): dos reservas y dos préstamos concurrentes (solo uno persiste), rechazo de recursos `DISABLED` y `MAINTENANCE`, rechazo de devolución por cliente no propietario (`FORBIDDEN`), rechazo de devolución duplicada concurrente y secuencial (`LOAN_ALREADY_RETURNED`), y auditoría atómica verificada (`loan.created`, `loan.returned`). Datos sintéticos solo en esa BD aislada y eliminados por la prueba.
- `npm run test:e2e`: 6/6 smoke tests desktop/móvil correctos. Verifican render/navegación, no desbordamiento, estado sin configuración y rechazo de auditoría sin sesión.
- Playwright CLI usado para inspección y capturas desktop/móvil en artifacts/ (ignorado). Detectó favicon faltante; se añadió icon.svg.
- Context7 CLI instalado y consultado; resultados genéricos contrastados con documentación oficial y build instalado. Configuración MCP de ejemplo, sin claves ni cambios globales.
- Instalación npm reportó cero vulnerabilidades conocidas; es un resultado puntual, no garantía de seguridad.

## Pendientes reales

1. Proyecto Supabase, variables y acceso a datos oficiales. No se creó ni modificó infraestructura cloud.
2. Verificar Auth real, expiración, perfiles y separación de usuarios/roles. No hay cuentas sembradas ni promoción automática de administrador.
3. Formularios funcionales en web sobre API (reservas y préstamos/devoluciones), cancelaciones/cambios de estado, paginación e idempotencia.
4. Incidencias y triaje con proveedor IA real. Modelo de Incident existe, endpoints/servicio IA pendientes.
5. RAG/documentos oficiales, realtime/chat y reuniones, según fases de roadmap. No instalados ni simulados.
6. Revisar guía oficial original, inventario de equipos y cierre del evento; capacidades CSV deben contrastarse. Los estados desconocidos se mantienen deshabilitados en datos propuestos.
7. CI remota debe ejecutar antes de considerar el repositorio verificado en GitHub. Revisar resultado, no confundir checks locales con remotos.

## Continuación por responsable

Leonardo: conexión/migración/datos; Tomas: servicios y contratos; Samuel: formularios/vistas sobre datos; Deimer: Auth/IA/integración. Flujo develop → feature/* → PR a develop. No desarrollar cuatro soluciones divergentes.

Los archivos AGENTS.md raíz y apps/web/AGENTS.md (generado por Next) aportan reglas complementarias. Antes de cambiar APIs de Next, leer sus docs instaladas en node_modules/next/dist/docs/.
