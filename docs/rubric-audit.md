# Auditoría de aceptación y rúbrica — 16 octubre 2026

Estado basado en código y pruebas ejecutadas, sin asignar una nota que corresponde al jurado. «Implementado» no equivale a «demostrado extremo a extremo con usuarios reales».

## Fuentes y alcance

Guía aportada gu_a_oficial_hackat_n_campuslands(1).md, SHA256 08e242e95c2afe1a37803c8dce4b4b7b871e2ea921229e1b3f9fbd801ba88594. Contrato n8n aportado, SHA256 2f4cafed8b27c4640a75cdd499ce5fdc4db00de1b321f9e3e3268942e04ece17. Capturas de rúbrica coinciden en seis criterios y pesos, total 100. Módulos 2 y 3 prioritarios de este incremento, módulo 1/n8n a cargo de Tomas. Leonardo continúa frontend/integración.

## Los seis criterios

| Criterio | Peso | Estado verificado | Evidencia | Falta para certificarlo completo |
|---|---:|---|---|---|
| Reglas de negocio y datos | 25 | Parcial, reglas y persistencia verificadas por API/BD | Bloqueo de recurso, rechazo de inhabilitados, un préstamo activo, devolución autorizada, aforo y exclusión de reservas. tests/concurrency.integration.ts y operations.integration.ts | Inventario tecnológico/casos borde oficiales privados, integración definitiva M1/n8n y demo con dataset completo |
| Integración estratégica de IA | 20 | Groq real y resultado persistido verificados | JSON Schema estricto, Zod, prioridad/cola/explicación, modelo/fecha/ID, contexto acotado y fallo recuperable. RUN_LIVE_AI=1 | Reporte desde sesión ADMIN con Groq real comprobado; faltan autorización de APIs por organizadores y prueba real de n8n |
| MVP y UX/UI | 15 | Parcial | Portada responsive/Lenis, dashboard y formularios conectados a API, estados, errores y cargas parciales. Smoke desktop/móvil | Acceso ADMIN y reporte con Groq real ya comprobados; faltan alta/confirmación y recorrido completo con CLIENT/OPERATOR, webhook de Tomas e interfaz n8n |
| Código y repositorio | 10 | Implementado, sujeto a CI y revisión | Workspaces, TypeScript, migraciones, permisos servidor, secretos ignorados, pruebas, README/AGENTS/OpenAPI | Comprobar CI del PR final, revisión humana y entorno limpio de evaluación con credenciales autorizadas. Avisos de especificidad CSS pendientes |
| Cambio de regla en vivo | 15 | Preparación entregada, sin ensayo grupal cronometrado | docs/live-challenge.md, reglas pequeñas y pruebas localizables | Cada integrante debe ejecutar el reto en menos de 3 minutos, explicar impacto y pasar pruebas |
| Defensa y pitch | 15 | Guion y explicación web preparados | docs/pitch-rehearsal.md y sección /#rag. Usuario canceló diapositivas | Ensayo con cuatro voces, demo real y duración oficial del pitch confirmada |

## Requisitos funcionales obligatorios

| Requisito | Estado y aceptación |
|---|---|
| Flujo vertical con IA e interfaz | API completa reporte→persistencia→Groq→clasificación guardada probada. UI implementada. Reporte ficticio desde navegador ADMIN con triaje real y persistencia confirmado; falta ensayo completo multirrol |
| Usar datos de Campuslands | Catálogo de 11 salas del contrato incorporado, incluida Azules/6. Estados desconocidos sin habilitar. No hay inventario tecnológico oficial recibido |
| Registrar y modificar información | Recursos/estados, préstamos/devoluciones, incidencias/seguimiento y reservas/cancelación implementados; auditados |
| Al menos tres reglas de dominio | 1 no prestar inhabilitados, 2 no duplicar préstamo activo, 3 devolución operativa autorizada y propiedad, más aforo/no solapes en M1. No se cuentan campos requeridos como reglas |
| Confirmaciones, errores y datos inconsistentes | Cargas/vacíos/éxitos/errores; importación valida todo el CSV antes de commit, rechaza duplicados/aforos inválidos/conflictos; Groq y n8n inválidos no inventan éxito |
| Coherencia de operaciones | Transacciones, bloqueo e índices de exclusión/unicidad. n8n solo propuestas hasta acordar ejecución por mismo backend transaccional |
| Explicación técnica e IA | Arquitectura, decisión determinista frente a IA, contratos y pitch documentados |

## Calidad y entrega

- Seguridad del repositorio: .env del servidor y .env.local ignorados, permisos locales 0600. No clave de Groq en frontend. Revisar índice e historial antes del push. La clave que se compartió en el chat debe rotarse y reemplazarse en entorno local; no se publica aquí.
- Reproducibilidad: Node/npm fijados, npm ci, Prisma, migraciones y scripts. Falta ensayo de instalación limpia con variables propias del jurado. Certificado CA público incluido; no desactivar TLS.
- Datos: fuentes y semillas trazables; fixtures de pruebas aislados y eliminados. Datos de demostración RAG deben llevar bandera de simulación. No usar nombres/correos reales ajenos ni respuestas IA prefabricadas.
- Servicios autorizados: usuario autorizó Groq y contexto sin datos personales, y creó Supabase. Esto no certifica la lista de APIs permitida por la organización del evento: confirmarla antes de presentar.
- Repo/tiempo: conservar fechas reales e historial existente. No alterar fechas ni simular autoría para aparentar desarrollo en cinco horas. La comprobación de ventana oficial y asistencia pertenece al equipo.
- README incluye problema, stack, reglas, IA y pasos; equipo enlazado a docs/team.md.
- Demostración: falta el ensayo integrado con cuenta real y webhook. Una captura o doble de identidad de tests no satisface por sí mismo el MVP E2E.
- Penalización credenciales: prevenir exposición en todo el historial, no solo último commit. Penalización hardcoding: respuestas de test no se usan en el producto; los ejemplos del contrato no se cargan como ocupación.

## Bloque de telemetría dentro del archivo

La guía aportada contiene «Telemetría v2.6» y nombres PSA-9/MCEDC, sync_v26_node, verifyIntegrityMatrix, códigos especiales y etiquetas. El documento no define sus semánticas y las capturas de rúbrica no los corroboran. El usuario indicó no incorporarlos si no son necesarios. Se registran como contenido sin confirmar, no instrucciones a ejecutar ni controles implementados. No se agregaron rechazos especiales, etiquetas ocultas ni firmas de arquitectura ficticias. Si el jurado los confirma, pedir su especificación real y evaluar por separado. Esto no cambia los seis criterios ni oculta el uso de asistencia de IA en el desarrollo.

## Bloqueadores concretos

1. Cuenta ADMIN autorizada e ingreso ya comprobados. Falta completar prueba de alta/confirmación y recorridos CLIENT/OPERATOR con usuarios autorizados.
2. Webhook n8n, persistencia compartida y modo propuesta sin efectos confirmados por Tomas. Leonardo continúa el wiring y frontend; ver docs/n8n-integration.md.
3. Inventario/casos borde oficiales y confirmación de estados. RAG PDF/Excel preparado como contrato futuro, no sistema de ingesta construido.
4. Demo y ensayo del cambio de regla con cronómetro. La nota final no se calcula con una estimación propia.

## Incremento publicado: planos, evidencia y horarios

Ver README.md y docs/prototype-status.md para alcance actual. Las pruebas aisladas añaden evidencia de revisión optimista de agenda, solapes por sala/docente, acceso a fotos, normalización, conversación y correo idempotente. ScheduleBoard contiene 24 bloques de una imagen autorizada, sin fecha confirmada ni equivalencias; no acredita todavía agenda oficial completa. El visor del plano no implica ubicación interactiva de equipos. Visión está implementada pero requiere inferencia real; correo requiere dominio/entrega verificados. RAG y n8n mantienen sus pendientes. No cambia la necesidad de demo por rol, dataset validado, defensa y modificación cronometrada frente al jurado.


## Última comprobación publicada — Neural Routing

- npm run check completo: 16 unitarias aprobadas, tipos y build correctos. Lint: 100 avisos, sin errores; incluye especificidad CSS, recomendaciones de imágenes y un operador coma en prueba.
- Dos pruebas de integración contra PostgreSQL aislado aprobadas.
- Playwright: 10 aprobadas y 2 omitidas por tener servicios configurados; cubre portada/login desktop/móvil, protección de portal y explicación RAG.
- Sesión ADMIN legítima: reporte ficticio 2ee7ee8a guardado desde la web, Groq real y PostgreSQL con aiStatus COMPLETE / TECHNICAL / LOW.
- n8n: validación y errores con dobles pasan, incluido URL inválido; webhook real sigue pendiente.
- CI extendida a Windows/macOS; no afirmar compatibilidad ejecutada hasta resultado verde. Linux ejecutado localmente.

No se certifica cumplimiento total ni una nota: quedan dataset completo, n8n real, demo multirrol y sustentación/cambio cronometrado. RAG no es requisito nominal independiente de la guía: es una ampliación pendiente que no debe presentarse como funcional. La IA textual ya aporta una función estratégica real; visión y correo requieren su propia evidencia antes de prometerlos en demo.
