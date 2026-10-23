# RAG documental: PDF, Excel y corpus de demostración

> Actualización 23 octubre 2026: RAG sin funcionamiento en código y estructura de Supabase inspeccionados. El usuario pidió plantear implementación en **Go**: [servicio y contratos](scaling/rag-go.md), [arquitectura](scaling/architecture.md) y [reparto del trabajo](scaling/team-backlog.md). Este documento conserva requisitos de fuentes y seguridad.

Alcance solicitado para la siguiente iteración de Leonardo: PDF, Excel y, cuando falten fuentes, documentos simulados identificados. Aún no existe upload, extracción, índice vectorial ni chat RAG implementado. El triaje Groq actual es independiente.

## Flujo acordado

Ingesta autenticada ADMIN/OPERATOR, límite de tamaño y tipos permitidos por contenido. PDF: texto por página, OCR solo si hace falta y con proveedor autorizado. Excel: lectura sin ejecutar macros ni fórmulas, hoja/fila/rango como referencia; conservar valor original y advertir celdas vacías o inconsistentes. Cada fuente debe incluir nombre, hash, versión, fecha de carga, permisos, estado de aprobación y bandera isDemo.

Fragmentar sin perder página/hoja/fila. Indexar únicamente documentos aprobados. Recuperar con filtro de permisos antes de enviar contexto al modelo, con referencias estables y versión. La IA responde con citas y reconoce cuando no hay evidencia. Texto de archivos es contenido no confiable, nunca instrucciones que otorguen roles, ejecuten herramientas o alteren el sistema.

Para políticas/documentos usar recuperación semántica o híbrida cuando se implemente. Para estado y disponibilidad consultar PostgreSQL con herramientas autorizadas; no usar embeddings de reservas como fuente de verdad. Revocar acceso o borrar documento debe invalidar fragmentos e índice.

## Semillas y procedencia

El catálogo de once salas tiene fuente en el contrato n8n, no se confunde con respuestas de IA. Las semillas de tests se generan en campusflow_test y se limpian. Un corpus ficticio para demo debe estar separado (data/demo-rag), con título «SIMULADO», isDemo=true y citas que lo indiquen en pantalla; no atribuir políticas ficticias a Campuslands. No precargar respuestas o métricas para aparentar inferencia. Las referencias visuales de portada se conservan en docs/design-review.md; seed de diseño histórico no corroborado y dirección final fijada por el usuario.

## Criterios pendientes de prueba

Pregunta con respuesta y página/fila correcta; pregunta sin evidencia; dos usuarios con permisos distintos sin fuga; hoja con celdas conflictivas; PDF escaneado; documento sustituido/revocado; fallo de proveedor; presupuesto de tokens. Confirmar API de embeddings autorizada para la jornada antes de elegir un modelo. Groq para generación no implica tener un endpoint de embeddings disponible.
