> Estado revisado el 19 de octubre de 2026: workflow Groq principal / Gemini de respaldo y asistente del dashboard integrados desde `develop` (`c179d63`). La interfaz usa la API autenticada y distingue propuesta, aplicación y resultado incierto. La instancia local de n8n no responde en esta sesión; no se acredita ejecución real de proveedores ni cambios en la BD compartida. Ver [verificación vigente](../verification.md).

# Flujo n8n: orquestador de espacios

Implementa el contrato de [CONTRATO_N8N_FRONTEND.md](../../CONTRATO_N8N_FRONTEND.md) y añade WhatsApp (Evolution API) como segundo canal. **La fuente de verdad es PostgreSQL de CampusFlow (`app_private`, Prisma)**: n8n no guarda estado propio.

| Archivo | Contenido |
|---|---|
| `campusflow-orquestador.json` | Workflow importable (24 nodos). |
| `../../apps/api/prisma/migrations/20261016150000_n8n_agenda/` | Migración: columnas de `Reservation`, perfil de servicio, funciones `n8n_state()` y `n8n_apply_plan()`. |
| `../sql/n8n-runtime.sql` | Rol `n8n_runtime` (solo `EXECUTE` de las dos funciones; sin acceso a tablas). |
| `../../tests/n8n/motor.test.mjs` | 32 pruebas del código real del workflow (`node --test tests/n8n/motor.test.mjs`). |

## Interfaz web: «Asistente de agenda»

Pestaña **Asistente de agenda** del espacio de trabajo (solo ADMIN y OPERATOR). El navegador nunca habla con n8n: llama a `POST /api/agenda/assistant` de Express, que valida la sesión y el rol, toma el UUID del actor autenticado (no del body), reenvía al webhook con `Authorization: Bearer <N8N_WEBHOOK_SECRET>` y valida la respuesta contra el catálogo antes de devolverla.

- El usuario escribe en lenguaje natural y, opcionalmente, fecha, sala, asistentes y horas.
- **Solo proponer** (`modo: PROPUESTA`): n8n calcula todo y **no escribe**. **Aplicar** (`modo: EJECUCION`): exige `N8N_MODE=execute` y confirma con el usuario; el resultado solo se muestra como aplicado si n8n informa `ejecucion: APLICADA`.
- Muestra la decisión, la interpretación de la IA, el estado de aplicación, la incidencia detectada y el tablero de salas leído de la base tras la solicitud.
- Variables de `apps/api/.env`: `N8N_WEBHOOK_URL=<URL de producción del webhook>/webhook/campusflow`, `N8N_WEBHOOK_SECRET=<secreto, sin la palabra Bearer>` y `N8N_MODE=proposal` para empezar. Habilitar `execute` solo después de verificar el entorno y la escritura auditada. En n8n, la credencial del webhook del frontend es Header Auth con nombre `Authorization` y valor `Bearer <secreto>`.

> ¿Vas a usarlo en otro equipo? Sigue [USO_EN_OTRO_EQUIPO.md](USO_EN_OTRO_EQUIPO.md): código, n8n local, credenciales propias y cómo comprobar que la IA responde.

## Arquitectura

```text
Frontend  POST /webhook/campusflow ───────────┐
WhatsApp  POST /webhook/campusflow-whatsapp ──┤ (Evolution MESSAGES_UPSERT)
                                              ▼
                  Normalizar Entrada (valida contrato; ignora eco/mensajes vacíos)
                                              ▼
        Leer Estado: SELECT app_private.n8n_state()  ─► Preparar Consulta IA
                                              ▼
              Groq (interpreta texto → JSON con esquema) ─ si falla ─► Gemini ─ si falla ─► Gemini de respaldo
                                              ▼
              Motor de Reglas (código determinista: la IA NO decide)
                                              ▼
        Aplicar Plan: SELECT app_private.n8n_apply_plan(plan)   (una transacción, auditada)
                                              ▼
              Leer Estado Final ─► Construir Respuesta ─┬─► Responder Frontend (JSON del contrato)
                                                        └─► Enviar WhatsApp (Evolution API)
```

**Papel de la IA:** Groq (`openai/gpt-oss-20b`, JSON Schema estricto; Gemini como respaldo) solo convierte el reporte en lenguaje natural en `{intencion, sala, horas, asistentes, incidencia}` con esquema de salida, temperatura 0 y el texto del usuario tratado como dato. La salida se valida contra enums y nombres de sala. Si todos los intérpretes fallan o responden fuera del esquema: HTTP 503, `tipoAlerta: ERROR` y **ningún cambio**.

**Reglas de negocio** (en `Motor de Reglas`; la base vuelve a comprobarlas bajo bloqueo):

1. **Aforo:** asistentes ≤ capacidad (también en `n8n_apply_plan`).
2. **Sin solapes:** intervalos `[inicio, fin)`; los contiguos son válidos (exclusión GiST `Reservation_no_overlap`).
3. **Estado del espacio:** `DISABLED` (sin habilitar) y `MAINTENANCE` no se asignan.
4. **FIFO:** conserva el espacio quien reservó primero (`createdAt`). Una extensión que choca con una reserva posterior la reubica en la sala libre de menor aforo suficiente; si no hay, se rechaza sin cambios.
5. **Incidencia grave** (`HIGH`/`CRITICAL` e inhabilita el espacio): pasa a `MAINTENANCE` y reubica sus reservas pendientes. La incidencia se guarda en `Incident` (`aiStatus=PENDING`; la clasificación externa no sustituye el triaje Groq de CampusFlow).

Cada operación escribe un `AuditEvent` en la misma transacción (`n8n.reservation.created|relocated|extended`, `n8n.space.maintenance`, `n8n.incident.created`).

## Mapeo a las tablas existentes

| Flujo | Tabla Prisma |
|---|---|
| Sala | `Space` (`AVAILABLE`→DISPONIBLE, `MAINTENANCE`→MANTENIMIENTO, `DISABLED`→se muestra como MANTENIMIENTO con nota «Sin habilitar por el operador») |
| Reserva | `Reservation` + `requesterName`, `source` (`N8N_FRONTEND`, `N8N_WHATSAPP`, `IMPORT`), `note`, `relocatedFrom` |
| Incidencia | `Incident` |
| Actor de escritura | Perfil de servicio `00000000-0000-4000-8000-00000000cf01` (no existe en `auth.users`; no puede iniciar sesión) |

**Limitación de identidad:** quien escribe por WhatsApp se identifica con su nombre de perfil, sin verificar. Queda en `requesterName`; no es una identidad autenticada ni concede permisos. Integrar con el token de Supabase cuando el canal lo permita.

## Puesta en marcha (coordinar con Leonardo y Deimer)

1. **Migración** (credencial `DIRECT_URL`, nunca la de runtime): `npm run db:deploy`. Es aditiva (columnas nuevas con valor por defecto, un perfil y dos funciones).
2. **Rol de n8n:** aplicar `docs/sql/n8n-runtime.sql` y poner contraseña fuera de Git: `ALTER ROLE n8n_runtime LOGIN PASSWORD '<generada>';`.
3. **Catálogo y habilitación:** `npm run db:import-spaces -w @campusflow/api`. Las salas llegan `DISABLED`; el operador autorizado las habilita tras revisarlas, por ejemplo `UPDATE app_private."Space" SET status = 'AVAILABLE' WHERE name = '...';`. Mientras estén `DISABLED` el flujo rechaza reservas, a propósito.
4. **n8n:** importar `campusflow-orquestador.json`, crear la credencial Postgres con el **pooler de Supabase** (usuario `n8n_runtime.<project-ref>`, SSL requerido) y asignarla en `Leer Estado`, `Aplicar Plan` y `Leer Estado Final`. Credenciales de los webhooks (Header Auth), de Groq (Header Auth `Authorization: Bearer <clave>`) y de Gemini (`x-goog-api-key`) en n8n; nada de claves en el repositorio.
5. **Variables de n8n:** `EVOLUTION_API_KEY` (y opcional `EVOLUTION_INSTANCE_CAMPUSFLOW`, por defecto `campusflow-demo`). Requiere `N8N_BLOCK_ENV_ACCESS_IN_NODE=false`.
6. **Evolution API:** instancia propia, webhook hacia `/webhook/campusflow-whatsapp` (evento `MESSAGES_UPSERT`, con el header de autenticación).
7. Activar el workflow.

## Verificación histórica (corrida anterior, no repetida en esta sesión)

- `python -m automation validate docs/n8n/campusflow-orquestador.json`: válido, 0 errores, seguridad limpia (un aviso: sin `errorWorkflow`).
- `node --test tests/n8n/motor.test.mjs`: 21/21. API: 18 pruebas (incluye `agenda.test.ts`: modos, identidad del servidor, respuesta fuera de contrato).
- **Ejecución real en n8n** (instancia de pruebas aislada, PostgreSQL local con las 8 migraciones, roles y el horario cargado): webhook con autenticación (403 sin credencial), lectura con `n8n_state()`, motor, `n8n_apply_plan()` y respuesta. Casos: consulta; reserva aplicada; misma reserva rechazada por orden de llegada; aforo excedido; **propuesta que no escribe**; reserva contigua; extensión que reubica a quien llegó después; incidencia crítica que pone la sala en mantenimiento y reubica; entrada inválida (400); fallo de Gemini (503, sin cambios); canal WhatsApp (respuesta enviada al doble de Evolution; el mensaje propio se ignora); dos reservas simultáneas (solo una aplicada). La auditoría quedó registrada (`n8n.*`).
- La UI se verificó en el navegador contra ese mismo n8n de pruebas: tablero de salas, decisión, insignia de ejecución y la interpretación mostrada.
- **Límite de esa verificación:** Gemini y Evolution fueron dobles de prueba locales; esa corrida no cuenta como prueba de la IA real ni de WhatsApp real.
- Las 5 migraciones aplicadas en orden sobre un PostgreSQL 17 desechable y las funciones probadas contra las tablas reales: insert, solape rechazado (exclusión GiST), aforo y sala sin habilitar rechazados, atomicidad (un paso inválido no deja nada), incidencia + mantenimiento + auditoría, y dos inserciones simultáneas del mismo intervalo → exactamente una aceptada.
- Rol `n8n_runtime`: puede llamar las dos funciones y se le niega leer o escribir tablas (`Reservation`, `Space`, `Profile`); `anon` sin acceso.

**No verificado:** nada contra un Supabase real (hace falta el proyecto con sus credenciales), ni el inicio de sesión con Supabase Auth desde la UI, ni Gemini y Evolution reales de punta a punta con estas tablas (la prueba local usó dobles). `npm run check` completo pasa en la rama de integración.

## Diferencias respecto al contrato

- Respuesta con `status: "error"` y HTTP 503 (IA) / 409 (conflicto concurrente) / 400 (entrada inválida, con `errores[]`).
- `accionEjecutada`: `NINGUNA`, `RESERVA_CREADA`, `EXTENSION_APLICADA`, `REUBICACION_AUTOMATICA`, `SALA_EN_MANTENIMIENTO`, `SOLICITUD_RECHAZADA`.
- Campo adicional `interpretacionIA: { intencion, modelo }`.
- `horario` es de hoy en `America/Bogota`.

## Pendientes y decisiones abiertas

- **Modos vigentes:** `PROPUESTA` vacía las operaciones antes de llamar a `n8n_apply_plan` y no envía avisos administrativos. Es el valor por defecto del canal web. `EJECUCION` es explícito y Express lo permite solo con `N8N_MODE=execute`; n8n aplica mediante la función transaccional auditada. Express no aplica un segundo plan. Un timeout de ejecución requiere revisar el estado antes de repetir.
- El adaptador envía `Authorization: Bearer <secreto>`: usar una credencial Header Auth con ese formato en el webhook del frontend.
- Horarios oficiales de salones: se cargan como reservas `IMPORT` con un script privado (no versionado: contiene nombres de docentes). Faltan datos de «Sala Nueva», la cohorte D3 Feb-26 y el aforo de Sputnik.
- Registrar la deriva de esquema en `docs/handoff.md` cuando se integre.


## Verificación de esta entrega

- 32 regresiones del código real de los nodos: reglas, fechas relativas, consulta por sala, propuesta sin operaciones, grafo Groq/respaldo, avisos solo tras aplicación confirmada y reportes largos sin truncamiento a 1000 caracteres.
- UI aislada desktop/móvil: solicitud → payload del contrato → propuesta; ejecución deshabilitada/configurable, confirmación cancelada/aceptada, actualización tras `APPLIED` y errores sin mostrar un resultado anterior como vigente.
- En la sesión actual no hay listener n8n en 5678/5679 ni daemon Docker disponible. Importar el JSON, asignar las credenciales y activar el webhook de producción en la instancia autorizada sigue siendo necesario para probar un servicio real. No copiar credenciales de exportaciones antiguas.
- El asistente está en Gestión → Asistente de agenda para ADMIN/OPERATOR. `GET /api/agenda/status` devuelve configuración, no salud. La comprobación efectiva ocurre al enviar una solicitud autenticada.
