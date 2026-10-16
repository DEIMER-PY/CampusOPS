# Relevo para Leonardo — CampusFlow

## Punto de entrada

Continúas frontend e integraciones/planos según indicación del usuario. Tomas prepara los flujos de n8n para agenda/módulo 1. Samuel apoya diseño/UX y Deimer dejó API/Auth/Groq y documentación. No hay autorización para fingir el flujo con respuestas estáticas. Lee AGENTS.md, apps/web/AGENTS.md, apps/web/PRODUCT.md y apps/web/DESIGN.md antes de cambiar código.

Repositorio público DEIMER-PY/campusflow. Base protegida develop, trabajo por feature y PR revisado, commits convencionales con emoji. Rama de este incremento feature/6-product-ui-redesign; consultar el PR y CI actuales, sin asumir que ya se integró en develop. PR #5 de accesibilidad es ancestro de esta rama y no debe integrarse duplicando/borrando cambios ajenos.

## Qué existe y dónde

| Área | Entrada | Estado |
|---|---|---|
| Portada | apps/web/src/app/page.tsx | Oscura Campuslands, Poppins local, preview semántico y CTA |
| Scroll | components/landing-motion.tsx | Lenis solo landing, reducción de movimiento |
| Explicación RAG | components/rag-explainer.tsx, /#rag | Imagen generada instalada, texto accesible, zoom y aviso de implementación pendiente |
| Imagen y procedencia | public/images/rag-campusflow.webp, docs/rag-image-provenance.json | Fuente y prompt conservados. EXIF ImageDescription contiene prompt |
| Acceso | login-form.tsx, app/auth/callback, proxy.ts | Supabase conectado; falta completar registro/confirmación humana y demo real |
| Dashboard | components/workspace.tsx | Incidencias, inventario, préstamos, reservas y auditoría según rol; cargas independientes y cierre móvil |
| Reglas API | apps/api/src/operations.ts, app.ts | Recursos/préstamos, reportes, triaje, estados, cancelación, permisos y auditoría |
| IA | src/ai/triage.ts y context.ts | Groq real, esquema validado, contexto sin propietarios, trazabilidad y fallos recuperables |
| n8n | src/integrations/n8n.ts | Adaptador probado con dobles. Sin webhook real y sin UI de agenda n8n |
| Persistencia | apps/api/prisma | Cuatro migraciones y restricciones de concurrencia. Supabase ya aplicado por MCP |
| Catálogo | data/official/spaces.csv | 11 salas del contrato, Azules/6 incluida. Estados iniciales sin habilitar |
| Ingesta catálogo | apps/api/scripts/import-spaces.ts | Validación completa y transacción, no sobrescribe aforo/estado existentes |
| Contratos | docs/openapi.yaml, docs/n8n-integration.md | No dar por ejecutado un cambio por recibir HTTP 200 de n8n |

Rutas components relativas a apps/web/src salvo las indicadas. Imagen RAG explica una arquitectura futura: no hay upload, extracción PDF/Excel, embeddings, índice ni chatbot RAG todavía. No confundirlo con el triaje Groq implementado.

## Orden recomendado de trabajo

### P0 — una demo que cumpla la rúbrica

1. Completar cuenta autorizada del propietario y confirmar email. Consultar auth.users y activar ADMIN solo al UUID verificado desde consola/credencial autorizada, no desde frontend ni user_metadata. Configurar Site URL, callback permitido y SMTP si hace falta. No crear una vía de acceso sin autenticación para mostrar el dashboard.
2. Ejecutar navegador real con CLIENT y ADMIN/OPERATOR de prueba autorizados: crear un recurso identificado como DEMO si no hay inventario oficial, prestar, rechazar duplicado, devolver por operador, marcar mantenimiento y rechazar préstamo. Guardar evidencia verificable, no respuestas inventadas.
3. Crear una incidencia desde el navegador, comprobar resultado real Groq en PostgreSQL y que otro cliente no lo ve. Probar fallo/reintento. No aumentar roles mediante body.
4. Recibir de Tomas webhook de prueba/producción y confirmar persistencia y modo sin efectos. No introducir la URL con credenciales en NEXT_PUBLIC ni en Git. Completar wiring de UI al endpoint Express cuando esté acordado.
5. Reemplazar/completar inventario con dataset oficial y ejecutar casos borde. Catálogo de salas es del contrato aportado; no importar sus reservas de ejemplo como eventos reales.
6. Cronometrar modificación de regla y demo con los cuatro. Actualizar docs/rubric-audit.md solo con evidencia real. No asignar una nota propia.

### P1 — RAG PDF/Excel

Ver docs/rag-ingestion-plan.md. Elegir proveedor de embeddings permitido por la jornada; Groq de generación no equivale a tener embeddings. Diseñar fuentes/versiones/fragmentos/referencias y permisos antes del índice. Ingesta no ejecuta macros/formulas ni instrucciones de documentos. Probar sin evidencia, cita errónea, revocación y fuga entre usuarios.

Corpus simulado solo con bandera isDemo=true y rótulo SIMULADO en fuentes/citas, separado de documentos oficiales. Si se incorpora un documento nuevo, guardar hash, versión y página/hoja/fila. No reemplazar recuperación por respuestas precargadas. El diagrama de la web lleva «En preparación» hasta verificar la ingesta completa; actualizar imagen y texto juntos cuando cambie la arquitectura.

### P2 — integración y endurecimiento

Paginación real (listas hoy limitadas a 50), idempotency keys de creación, rate limit compartido antes de réplicas, métricas reales y tests de carga. Notificaciones mediante outbox tras commit, no antes. Realtime, chat, reuniones y planos interactivos no están implementados. No añadir dependencias de animación si no aportan al recorrido operativo.

## n8n: decisiones que no se deben perder

- La fuente de verdad de asignación debe ser PostgreSQL compartido o un servicio transaccional acordado. Si n8n usa otra base/memoria, no está cerrada la regla central integrada.
- Conservar reservas confirmadas. No permitir que una extensión desplace una reserva previa. FIFO requiere cola/orden persistido; no lo garantiza un prompt ni el orden de respuesta de Groq.
- Fecha y zona horaria obligatorias para intervalos. El contrato original HH:mm solo es insuficiente. Extensión propuesta fecha, modo PROPUESTA y zonaHoraria está documentada para acordar con Tomas.
- El adaptador valida catálogo, duplicados y JSON. execution NOT_APPLIED indica propuesta. Reubicación necesita confirmación, versión e idempotencia, y volver a comprobar aforo/estado/solapes bajo bloqueo.
- DOCENTE/COMERCIAL/ADMINISTRATIVO son contexto de negocio, nunca permisos RBAC. El servidor decide actor y acceso.

## Entorno y comandos

Node/npm fijados en repositorio, un gestor, npm ci. Variables reales existen solo en apps/api/.env y apps/web/.env.local locales, ignoradas y 0600. No copiar valores a prompts, issues, capturas ni commits. Pedir acceso por canal seguro al propietario. La clave Groq compartida en chat debe rotarse y actualizarse en entorno, no publicarse.

```bash
npm ci
npm run db:generate
npm run db:validate
npm run dev
npm run check
npm run test:e2e
```

La BD cloud campusflow (ref qysefuxctqvcfcyggzoi) ya tiene migraciones baselined y rol runtime restringido. El rol no aplica DDL ni promueve perfiles. Para otra BD vacía usar DIRECT_URL autorizado y npm run db:deploy. No volver a ejecutar SQL CREATE ROLE sobre el proyecto provisionado ni resetear datos para arreglar tests. DATABASE_SSL_CA_FILE debe apuntar al certificado público incluido con path del host. Mantener verificación TLS.

Integración: TEST_DATABASE_URL debe apuntar exclusivamente a una base campusflow_test aislada y migrada. RUN_LIVE_AI=1 usa Groq con fixtures de esa base y necesita autorización/clave de servidor; sin bandera prueba fallos mediante doble. Nunca apuntar pruebas destructivas a Supabase compartido.

## Evidencia y documentos a actualizar

Nueve unit tests, dos integraciones Express/Prisma/PostgreSQL y Groq real con contexto comprobados. Identidad en integración usa doble local, no acredita login Supabase real. Smoke desktop/móvil y RAG visual se verifican en tests/e2e; revisar CI final. Lint tiene avisos de especificidad CSS, sin errores. Diseño recibió revisión independiente para correcciones concretas, sin certificar gates históricos/pixel-perfect.

Matriz: docs/rubric-audit.md. Evidencia: docs/verification.md. Flujo mejorado: docs/decision-flow.md. Estado general: docs/handoff.md. Guion hablado: docs/pitch-rehearsal.md; el usuario canceló las diapositivas y priorizó explicación en web. Borradores privados de PPTX no son una entrega.

La guía contiene bloque de telemetría sin especificación/corroboración. Usuario indicó no incorporarlo si no hace falta; queda identificado en la auditoría, sin marcadores/rechazos arbitrarios. No ocultar asistencia de IA en desarrollo ni atribuir historial/autoría falsos.
