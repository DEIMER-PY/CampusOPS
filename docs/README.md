# Documentación de CampusFlow

**Del primer clon a la demo:** [Instalar](GETTING_STARTED.md) → [Probar](TESTING.md) → [Revisar aceptación](rubric-audit.md) → [Ensayar pitch](pitch-rehearsal.md).

## Continuar el desarrollo

**Revisión vigente, 23 octubre 2026:** [Integración y escalado](scaling/README.md), con auditoría de ramas/Supabase, tareas para Leonardo/Mantilla/Tomas, SaaS, concurrencia, RAG en Go, correo n8n y maqueta gráfica. Las ampliaciones son propuestas.

| Documento | Para qué sirve |
|---|---|
| [Guía de inicio](GETTING_STARTED.md) | Clonación, herramientas, variables, Prisma y arranque por OS |
| [Plan de pruebas](TESTING.md) | Linux/macOS/Windows, PostgreSQL aislado y lista manual por módulo |
| [Relevo para Leonardo](LEONARDO_HANDOFF.md) | Propiedad, cambios del prototipo y pendientes priorizados |
| [Estado del prototipo](prototype-status.md) | Horarios, planos, evidencia, migraciones y límites |
| [Herramientas](tooling.md) | Versiones, Context7 y Playwright |

## Entender los contratos

| Documento | Alcance |
|---|---|
| [README principal](../README.md) | Producto, stack, diagramas, datos, roles e impacto esperado |
| [Arquitectura](architecture.md) | Decisiones técnicas y límites de confianza |
| [API OpenAPI](openapi.yaml) | Contratos HTTP y permisos |
| [Flujo de decisiones](decision-flow.md) | Reglas deterministas frente a propuestas IA |
| [Integración n8n](n8n-integration.md) | Contrato de Tomas y aceptación real pendiente |
| [Plan RAG](rag-ingestion-plan.md) | Ingesta PDF/Excel pendiente, permisos y referencias |

## Defender con evidencia

- [Rúbrica](rubric-audit.md): requisitos y brechas, sin nota autocalculada.
- [Verificación](verification.md): registros históricos y ejecución más reciente.
- [Pitch entre cuatro](pitch-rehearsal.md): guion oral con recorrido web.
- [Cambio de regla en vivo](live-challenge.md): ejercicio para ensayar en menos de tres minutos.
- [Activos y capturas](assets/README.md): procedencia y límites de las imágenes.

Estado revisado: `develop a2a8916`, con realtime/SaaS en ramas separadas; ver [auditoría actual](scaling/current-state.md). Los apartados históricos de evidencia no sustituyen su actualización final. n8n real, RAG, visión real y entrega de correo no se consideran cerrados por tener diagramas, adaptadores o pruebas con dobles.
