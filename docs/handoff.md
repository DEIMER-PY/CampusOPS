# Estado para continuar

Última actualización: 16 octubre 2026. Bootstrap preparado por solicitud de Deimer; no confundir con entrega completa de hackatón.

## Terminado y comprobado localmente

- Monorepo npm con dependencias exactas y lockfile; Node 24.22.0.
- Portada responsive, identidad visual, acceso y estructura de portal/admin. Ilustración conceptual CSS; no hay datos ficticios ni fotografías generadas presentadas como reales.
- Express: health/readiness, validación Supabase Auth y perfil, lectura de espacios/reservas, creación transaccional de reserva y consulta ADMIN de auditoría.
- Prisma 7.10.1 con esquema app_private; migración inicial con CHECK, GiST anti-solapes e índice parcial para préstamos activos.
- `npm run check`: lint limpio, TypeScript, dos pruebas de reglas y builds Express/Next correctos.
- `npm run db:validate`: esquema válido.
- Migración aplicada sobre PostgreSQL 18 temporal, puerto 55439, base campusflow_test. Prueba real con dos conexiones concurrentes: exactamente una reserva solapada y un préstamo activo aceptados. Intervalo contiguo aceptado; intervalo inválido rechazado. Datos sintéticos solo en esa BD aislada y eliminados por la prueba.
- `npm run test:e2e`: 6/6 smoke tests desktop/móvil correctos. Verifican render/navegación, no desbordamiento, estado sin configuración y rechazo de auditoría sin sesión.
- Playwright CLI usado para inspección y capturas desktop/móvil en artifacts/ (ignorado). Detectó favicon faltante; se añadió icon.svg.
- Context7 CLI instalado y consultado; resultados genéricos contrastados con documentación oficial y build instalado. Configuración MCP de ejemplo, sin claves ni cambios globales.
- Instalación npm reportó cero vulnerabilidades conocidas; es un resultado puntual, no garantía de seguridad.

## Pendientes reales

1. Proyecto Supabase, variables y acceso a datos oficiales. No se creó ni modificó infraestructura cloud.
2. Verificar Auth real, expiración, perfiles y separación de usuarios/roles. No hay cuentas sembradas ni promoción automática de administrador.
3. Formularios funcionales sobre API, préstamos/devoluciones, cancelaciones/cambios de estado, paginación e idempotencia.
4. Incidencias y triaje con proveedor IA real. Modelo de Incident existe, endpoints/servicio IA pendientes.
5. RAG/documentos oficiales, realtime/chat y reuniones, según fases de roadmap. No instalados ni simulados.
6. Revisar guía oficial original, inventario de equipos y cierre del evento; capacidades CSV deben contrastarse. Los estados desconocidos se mantienen deshabilitados en datos propuestos.
7. CI remota debe ejecutar antes de considerar el repositorio verificado en GitHub. Revisar resultado, no confundir checks locales con remotos.

## Continuación por responsable

Leonardo: conexión/migración/datos; Tomas: servicios y contratos; Samuel: formularios/vistas sobre datos; Deimer: Auth/IA/integración. Flujo develop → feature/* → PR a develop. No desarrollar cuatro soluciones divergentes.

Los archivos AGENTS.md raíz y apps/web/AGENTS.md (generado por Next) aportan reglas complementarias. Antes de cambiar APIs de Next, leer sus docs instaladas en node_modules/next/dist/docs/.

## Publicación y colaboración

Repositorio público: https://github.com/DEIMER-PY/campusflow . Primer commit 8c2e554; develop predeterminada y protegida con PR, una aprobación, check quality y sin force push. Ramas feature/1-data-foundation, feature/2-responsive-ui, feature/3-loans-api y feature/4-auth-triage publicadas. Issues 1–4 creadas. Invitaciones con escritura enviadas a Leonardo4516, SamuelJoseMantilla y TEstebanGQ; deben aceptarlas.

La primera CI detectó falta de title accesible en icon.svg, añadido después de la última comprobación local. La corrección se prepara en fix/icon-accessibility y sigue PR/revisión del equipo; no desactivar la protección de develop para integrarla.
