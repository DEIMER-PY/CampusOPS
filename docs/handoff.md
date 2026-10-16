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
