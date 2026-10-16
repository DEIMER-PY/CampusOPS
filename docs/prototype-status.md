# Estado del prototipo publicado

Rama: `feature/prototype-plans-vision`. La publicación fue autorizada después de trabajar inicialmente sin push. No se ha fusionado con develop ni con el trabajo paralelo de Leonardo.

## Horarios

Fuente estructurada: `data/imports/schedule-reference.json`, transcrita de la imagen aportada por el usuario y con hash de procedencia. Persistida en Supabase como ScheduleBoard: 24 bloques, 9 columnas, revisión inicial 1, fecha de aplicación nula. Contiene 12 bloques Inglés (Grupo 11 cancelado), 6 SER y 6 Software.

La imagen no determina día, fecha o recurrencia. Los rangos de Software se infieren de la cuadrícula y deben confirmarse. Los nombres de salas y ubicaciones escritas no siempre coinciden. `spaceId` permanece sin vincular hasta revisión humana. No se crean reservas, no se presume disponibilidad ni se aplican automáticamente esos bloques a un calendario real.

`GET /api/schedule` devuelve tablero, espacios y advertencias; `PATCH /api/schedule/:id/entries/:entryId` exige operador, revisión vigente, intervalos de 15 minutos y ausencia de conflictos por sala/docente entre bloques no cancelados. Un conflicto de revisión devuelve 409. La asignación real sigue pasando por las reglas de reservas.

Importación idempotente: `npm run db:import-schedule -w @campusflow/api`. Una fuente ya existente no se sobrescribe al ejecutar de nuevo.

## Evidencia y comunicación

Rutas autenticadas bajo `/api/incidents/:id`: evidence, vision, messages y notify. Propietario u operador para evidencia/lectura/conversación; operador para envío manual de correo. Una foto inmutable por reporte, código de equipo verificado, validación real con Sharp, EXIF eliminado y acceso privado. El listado de reportes no incluye el contenido binario.

Visión tiene lease/reintento, timeout y salida Zod validada. No determina funcionamiento de un PC ni ejecuta cambios de estado del inventario. Las pruebas usan doble del proveedor; falta inferencia visual real. Conversación persistida con actualización manual, no realtime.

Resend conserva estado de envío e idempotencia, destinatario fijo de servidor y resultado auditable. Integración creada y conectada en Vercel. Clave sensible permanece en hosting. No hay dominio propio verificado ni prueba de entrega al buzón. No se ha comprado campusflow.com. No confundir aceptación del proveedor con entrega.

## Migraciones y entorno

Migraciones aditivas aplicadas al proyecto CampusFlow y a la base de integración aislada:

- `20261016170000_prototype_evidence`
- `20261016171000_vision_claim`
- `20261016180000_schedule_board`

No ejecutar reset sobre Supabase compartido. Usar credencial de migración separada; mantener rol runtime restringido. La CA admite path local o PEM inline en hosting. No desactivar TLS para corregir errores de conexión.

## Pendientes de aceptación

- Confirmar fecha/recurrencia, rangos Software y equivalencias de salas con la fuente del horario.
- Mapear salas/equipos sobre el plano con coordenadas reales; hoy solo hay visor fiel del PDF.
- Recibir webhook n8n de Tomas y probar modo propuesta contra persistencia acordada.
- Ejecutar una inferencia visual real y verificar correo/entrega con proveedor y dominio autorizados.
- Implementar ingesta PDF/Excel, embeddings, recuperación con referencias y permisos: RAG sigue pendiente.
- Paginación, rate limit distribuido, almacenamiento de evidencia escalable y outbox durable.
- Ensayar demo por rol y cambio de regla en vivo con los cuatro integrantes.
