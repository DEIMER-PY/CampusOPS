# Producto y diseño

## P0 — cerrar entrega verificable

1. Conectar Supabase, preparar perfiles y verificar permisos CLIENT/OPERATOR/ADMIN con cuentas reales de prueba aisladas.
2. Importar espacios oficiales con procedencia; estado desconocido = DISABLED hasta confirmación. Inventario tecnológico aún no recibido: no inventarlo.
3. Completar interfaz de consulta/reserva y administración con datos reales. Cancelación y cambios de estado deben mantener bloqueo/auditoría.
4. Completar préstamos/devoluciones y pruebas de dos solicitudes simultáneas.
5. Incidencias + llamada real a IA: JSON validado, categorías/áreas autorizadas, prioridad y explicación persistidas, modelo/prompt/fecha trazables. Fallo = pendiente/reintento, nunca respuesta prefabricada.
6. OpenAPI, pruebas de integración y E2E con usuarios distintos; pitch y cambio de regla en vivo.

## P1 — diseño profesional y operación

Portada editorial con marfil/verde bosque/lima, ilustración conceptual propia en CSS y Lucide. Portal cliente: disponibilidad, mis reservas, préstamos e incidencias. Administración: agenda, inventario, cola de incidencias y auditoría. Contadores se calculan en backend. Navegación móvil, formularios accesibles, vacíos/carga/error, responsive desde 360px y prefers-reduced-motion.

Tailwind es la base; shadcn/ui y sus primitivas accesibles son la opción para diálogos, combobox y tablas cuando se incorporen. No instalar librerías sin uso. Lenis opcional para landing tras probar teclado/móvil; mantener scroll nativo en dashboards. Motion solo para transiciones útiles y después de perf/accessibility. No agregar varias librerías de animación.

Imágenes: fotografías de Campuslands solo con fuente y permiso. ImageGen puede generar una ilustración de marca; indicar su carácter conceptual. No poner rostros/fotos generadas como evidencia real. next/image, tamaños explícitos, WebP/AVIF y texto alternativo; una imagen decorativa no debe bloquear el flujo. Actualmente no se generaron raster con IA.

## P2 — asistente documental y auditorías

Separar dos preguntas:
- «¿Cuál es la política de préstamo?» → RAG sobre documentos oficiales aprobados, fragmentos con versión y cita.
- «¿Quién reservó esta sala?» → herramienta de consulta de BD con permisos y filtros; no embeddings de operaciones como fuente de verdad.

Ingesta validada → fragmentación → embeddings → pgvector en Supabase → recuperación filtrada por permisos ANTES de entregar contexto al modelo → respuesta con fuentes. No hay documento = no inventar. Revocaciones y borrado actualizan índice. El modelo no ejecuta SQL arbitrario ni tiene credenciales de base. Registrar referencias de consulta sin volcar información privada. Permisos del chat iguales a los de la API; ningún cliente consulta auditoría administrativa.

RAG no sustituye triaje ni auditoría estructurada. Evaluar con preguntas con/sin respuesta y comprobaciones de fuga entre usuarios. Corpus original aún no disponible: bloquear ingesta hasta tener fuente autorizada.

## P3 — realtime, reuniones y personal

Primero notificaciones/cambios de estado, después chat si existe necesidad real. Realtime privado con autorización por conversación y filtrado; no publicar tablas de dominio indiscriminadamente. Persistir mensajes, paginar historial, gestionar reconexión y verificar aislamiento de usuarios. No confundir Supabase Auth con autorización de canales.

Reuniones reutilizan reservas como contexto, participantes autorizados y agenda; enlaces externos solo si se necesitan. Personal se limita a responsables/áreas para enrutamiento: no construir RRHH ni guardar datos sensibles innecesarios. Estos módulos no están implementados en el bootstrap.

## Pitch

Seis slides: problema, recorrido, demo real, arquitectura, validación/IA, resultado y evolución. Deimer coordina contenido; Samuel valida estilo. Canva o Slides, una sola herramienta. Video opcional de 45–60 s grabado de la app real como respaldo; no es una funcionalidad del MVP. Confirmar duración oficial del pitch antes del ensayo.
