# Integración y escalado de CampusFlow

Fecha de revisión: **23 octubre 2026**. Rama de documentación: `feature/integrations-scaling-plan`, nacida de `develop a2a8916`. Este paquete distingue evidencia actual, defectos observados y propuestas. No implementa ni despliega las ampliaciones descritas.

## Ruta de lectura y entregables

| Documento | Contenido |
|---|---|
| [Auditoría actual](current-state.md) | Ramas, CI, Supabase, RAG, disponibilidad y brechas verificadas |
| [Trabajo por integrante](team-backlog.md) | Leonardo, Mantilla, Tomas y Deimer; dependencias y aceptación |
| [Arquitectura y migraciones](architecture.md) | SaaS, permisos, concurrencia, rendimiento e infraestructura |
| [RAG en Go](rag-go.md) | Servicio, ingesta, recuperación, contratos y pruebas |
| [Correo y n8n](email-n8n.md) | Eventos después de commit, entrega, reintentos y responsables |
| [Producto y diseño](product-design.md) | Ideas Campuslands, dashboards por cargo y evolución visual |
| [Maqueta navegable](designs/dashboard-proposal.html) | Diseño conceptual local; sin conexión a servicios ni datos de producción |

## Decisión recomendada

Mantener Next.js, Express y PostgreSQL/Supabase; incorporar Go exclusivamente para el servicio documental y sus trabajadores. Primero resolver disponibilidad, permisos y divergencia de esquema. Después integrar comunicaciones, correo durable y paginación. El primer RAG será un recorrido completo con una fuente autorizada y citas comprobables. Multiempresa comercial viene después del aislamiento demostrado.

No migrar todo el backend a Go, reemplazar PostgreSQL ni incorporar Kubernetes para este incremento. No hay mediciones que justifiquen ese coste. Las cuotas, planes o SLA de este paquete son propuestas de producto; no son servicios contratados ni compromisos vigentes.

## Orden de entrega

1. **E0 — estabilización:** `/ready`, permisos con los roles ya existentes, credenciales expuestas en ramas y reconciliación de esquema/historial.
2. **E1 — operación fiable:** paginación y resumen por servidor, outbox y correo, integración de comunicaciones revisada y pruebas de concurrencia.
3. **E2 — conocimiento:** RAG Go con PDF textual, aprobación, recuperación autorizada y citas; ampliar a Excel y OCR tras cerrar ese recorrido.
4. **E3 — SaaS:** organizaciones/sedes, membresías y aislamiento probado en toda la aplicación; piloto por institución.
5. **E4 — ampliaciones:** calendario externo, QR de activos, mantenimiento planificado, portal de aliados y facturación según demanda validada.

Cada entrega exige PR revisado hacia `develop`, contratos versionados, pruebas y evidencia. Ninguna fase autoriza cambiar una BD compartida, contratar infraestructura o activar ejecución n8n sin la configuración y pruebas requeridas en AGENTS.md.
