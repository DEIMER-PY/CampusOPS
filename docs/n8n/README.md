# Flujo n8n: orquestador de espacios

Implementa el contrato de [CONTRATO_N8N_FRONTEND.md](../../CONTRATO_N8N_FRONTEND.md) y añade WhatsApp (Evolution API) como segundo canal sobre el mismo estado.

| Archivo | Contenido |
|---|---|
| `campusflow-orquestador.json` | Workflow importable (20 nodos). |
| `campusflow-schema.sql` | Esquema `campusflow` (salas, reservas, incidencias) y función transaccional `apply_plan`. |
| `../../tests/n8n/motor.test.mjs` | 15 pruebas del código real del workflow (`node --test tests/n8n/motor.test.mjs`). |

## Arquitectura

```text
Frontend  POST /webhook/campusflow ───────────┐
WhatsApp  POST /webhook/campusflow-whatsapp ──┤ (Evolution MESSAGES_UPSERT)
                                              ▼
                  Normalizar Entrada (valida contrato; ignora eco/mensajes vacíos)
                                              ▼
                  Leer Estado (PostgreSQL) ─► Preparar Consulta IA
                                              ▼
              Gemini (interpreta texto → JSON con esquema) ─ si falla ─► Gemini de respaldo
                                              ▼
              Motor de Reglas (código determinista: la IA NO decide)
                                              ▼
              Aplicar Plan (una transacción: bloqueo de salas + exclusión GiST)
                                              ▼
              Leer Estado Final ─► Construir Respuesta ─┬─► Responder Frontend (JSON del contrato)
                                                        └─► Enviar WhatsApp (Evolution API)
```

**Papel de la IA:** Gemini solo convierte el reporte en lenguaje natural en `{intencion, sala, horas, asistentes, incidencia}` con `responseSchema`, temperatura 0 y el texto del usuario tratado como dato. El resultado se valida contra enums y nombres de sala. Si Gemini falla o responde fuera del esquema: HTTP 503, `tipoAlerta: ERROR` y **ningún cambio**; nunca se inventa una respuesta.

**Reglas de negocio (en `Motor de Reglas`, y la BD como última defensa):**

1. **Aforo:** asistentes ≤ capacidad.
2. **Sin solapes:** intervalos `[inicio, fin)`; los contiguos son válidos (restricción `EXCLUDE USING gist`).
3. **Estado de la sala:** una sala en `MANTENIMIENTO` no se asigna.
4. **FIFO:** conserva la sala quien reservó primero (`created_at`). Si una extensión choca con una reserva posterior, esa reserva se reubica en la sala libre de menor aforo suficiente; si no hay, la extensión se rechaza sin cambios.
5. **Incidencia grave** (`HIGH`/`CRITICAL` e inhabilita la sala): sala a `MANTENIMIENTO` y reubicación de sus reservas pendientes.

## Puesta en marcha

1. **Base de datos: Supabase PostgreSQL** (proyecto de desarrollo autorizado; Leonardo coordina el proyecto y las migraciones). Con la credencial de migraciones (`DIRECT_URL`, nunca la de runtime):
   `psql "$DIRECT_URL" -v ON_ERROR_STOP=1 -f docs/n8n/campusflow-schema.sql`.
   El script es idempotente, crea el esquema `campusflow` fuera de la Data API, activa RLS, revoca todo a `anon`/`authenticated` y crea el rol `n8n_runtime` **sin login**. No aplicarlo sobre una base compartida sin acuerdo del equipo.
2. **Rol de runtime** (fuera del repo; la contraseña no se guarda en Git): un administrador ejecuta una vez, en el SQL Editor de Supabase o con `psql`,
   `ALTER ROLE n8n_runtime LOGIN PASSWORD '<contraseña generada>';`
   `n8n_runtime` solo puede **leer** salas y reservas y **ejecutar** `apply_plan`; no puede escribir tablas directamente. No usar `service_role` ni el usuario `postgres` en n8n.
3. **n8n:** importar `campusflow-orquestador.json` y crear/asignar tres credenciales (los ids del JSON son los de la instancia local; reasígnalos si cambian):
   - `Header Auth account` (`httpHeaderAuth`): la clave que deben enviar el frontend y Evolution en el header configurado.
   - `Google Gemini Header Auth` (`httpHeaderAuth`): header `x-goog-api-key` con la API key de Gemini.
   - `CampusFlow Postgres` (`postgres`): host y puerto del **pooler de Supabase** (Connect → Session pooler), usuario `n8n_runtime.<project-ref>`, base `postgres`, SSL activado.
4. **Variables de entorno de n8n:** `EVOLUTION_API_KEY` y `EVOLUTION_INSTANCE_CAMPUSFLOW` (instancia propia del proyecto, no la de otro asistente). Requiere `N8N_BLOCK_ENV_ACCESS_IN_NODE=false`.
5. **Evolution API:** webhook de la instancia hacia `http://host.docker.internal:5678/webhook/campusflow-whatsapp`, evento `MESSAGES_UPSERT`, con el header de autenticación.
6. Activar el workflow. Los modelos de Gemini están en los nodos `Gemini Interprete` (`gemini-flash-lite-latest`) y `Gemini Respaldo` (`gemini-flash-latest`); cambiarlos ahí si un modelo deja de estar disponible.

Ninguna clave va en el repositorio. Los datos de ejemplo se crean solo con solicitudes reales al flujo.

## Verificación hecha

- `python -m automation validate docs/n8n/campusflow-orquestador.json`: válido, 0 errores, seguridad limpia (queda un aviso: sin `errorWorkflow`).
- `node --test tests/n8n/motor.test.mjs`: 15/15 (aforo, solape, contiguo, mantenimiento, FIFO, reubicación, incidencia, fallo de IA, esquema, WhatsApp).
- `campusflow-schema.sql` aplicado (dos veces, idempotente) en un PostgreSQL 17 desechable con roles `anon`/`authenticated` simulados: insert, contiguo, solape rechazado, plan atómico (un paso inválido no deja nada), `move`+`extend`, dos inserciones simultáneas del mismo intervalo → exactamente una aceptada. Permisos: `n8n_runtime` lee salas/reservas y ejecuta `apply_plan`, pero se le niega escribir tablas y leer incidencias; `anon` y `authenticated` quedan sin acceso al esquema.

**No verificado:** nada contra un proyecto Supabase real (no hay proyecto ni credenciales todavía: pendiente 1 del handoff), ni la ejecución de extremo a extremo en n8n con Gemini, Postgres y Evolution reales (el build del agente quedó bloqueado por errores 404/429/503 de la API de Gemini), ni recepción real de WhatsApp. Falta comprobar con el proyecto real que `btree_gist` está disponible y que el pooler acepta el usuario `n8n_runtime`.

## Diferencias respecto al contrato

- Respuesta con `status: "error"` y HTTP 503 (IA) / 409 (conflicto concurrente) / 400 (entrada inválida, con `errores[]`); el contrato solo describía el 200.
- `accionEjecutada` toma: `NINGUNA`, `RESERVA_CREADA`, `EXTENSION_APLICADA`, `REUBICACION_AUTOMATICA`, `SALA_EN_MANTENIMIENTO`, `SOLICITUD_RECHAZADA`.
- Campo adicional `interpretacionIA: { intencion, modelo }` para trazabilidad ante el jurado.
- `horario` es de hoy en `America/Bogota`; las salas muestran la reserva tocada por la solicitud o la activa a la hora de referencia.

## Pendientes y decisiones abiertas

- **"Azules" (sala 11):** está en el contrato, pero `data/official/spaces.csv` lista 10 espacios. Confirmar con el organizador.
- El contrato pide `NEXT_PUBLIC_N8N_WEBHOOK_URL`; una URL pública permite que cualquiera consuma Gemini. Recomendado: ruta servidor en Next que reenvíe con el header secreto (`N8N_WEBHOOK_URL` sin `NEXT_PUBLIC`).
- `rol` y `usuario` los envía el cliente: sirven para la demo, no son identidad verificada. Integrar con el token de Supabase cuando exista.
- Los estados de las salas del CSV oficial están `DISABLED` hasta revisión; este esquema las crea `DISPONIBLE` según el contrato. Alinear con Leonardo.
- Decidir con Leonardo si este estado queda en el esquema `campusflow` (n8n) o se mueve a las tablas Prisma de `app_private`; configurar `errorWorkflow`.
