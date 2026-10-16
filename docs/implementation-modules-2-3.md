# Incremento operativo: recursos e incidencias

## Módulo 2

Inventario vacío por diseño hasta registrar equipos reales. ADMIN/OPERATOR registran código único, nombre, procedencia y estado; cada cambio de estado bloquea la fila del recurso y genera auditoría. CLIENT solicita un préstamo para sí mismo. La API bloquea el recurso y comprueba estado AVAILABLE y ausencia de préstamo activo. El índice parcial de PostgreSQL protege incluso otros caminos de escritura. Solo ADMIN/OPERATOR confirman devoluciones; repetir devolución no duplica auditoría. Un equipo en mantenimiento o deshabilitado nunca se presta aunque la pantalla del cliente estuviera desactualizada.

## Módulo 3 e IA

Crear reporte persiste descripción y auditoría antes de contactar Groq. Un segundo endpoint reclama el análisis atómicamente (PROCESSING), sin mantener una transacción durante inferencia. Solicitudes simultáneas reciben 409; tras 60 segundos una reclamación interrumpida puede recuperarse. Cada petición tiene timeout de 25 segundos. COMPLETE se devuelve sin volver a cobrar inferencia. FAILED conserva reporte, código seguro y opción de reintento. Rate limit adicional de 8 análisis por usuario/minuto en una instancia.

Groq directo por fetch nativo de Node; no se añade un SDK que duplique el contrato HTTP. Modelo configurable, valor inicial openai/gpt-oss-20b, verificado en /models y con una inferencia real. JSON Schema estricto + validación Zod, límites de longitud, rechazo de truncamientos y rutas inconsistentes. Prompt campus-triage-v2. Se guardan modelo, ID de proveedor, fecha, latencia y tokens. Se envían descripción y snapshot operativo acotado (hasta 20 recursos y 20 espacios, con total y marca de truncamiento). No propietarios, perfiles, auditorías, reservas de terceros ni secretos. El snapshot usa RepeatableRead y termina antes de inferencia; se registra fecha de consulta, nunca se presenta como disponibilidad futura garantizada. El texto del reporte se trata como datos no confiables y el modelo no dispone de herramientas ni SQL.

Categorías TECHNICAL/FACILITIES/ACADEMIC/OTHER; prioridades LOW/MEDIUM/HIGH/CRITICAL. Colas iniciales SOPORTE_TECNICO/MANTENIMIENTO/COORDINACION/REVISION_ADMINISTRATIVA son una configuración de producto propuesta, no un organigrama oficial de Campuslands. Se muestran como sugerencias revisables; no existe todavía asignación nominal a empleados. El operador actualiza OPEN/IN_PROGRESS/RESOLVED. La IA no habilita equipos ni anula conflictos.

## Identidad y operación

Supabase dedicado campusflow, región us-east-2. El proyecto verbarena fue pausado por autorización expresa, conservando datos. Esquema app_private fuera de Data API, sin permisos anon/authenticated. Runtime puede leer perfiles, operar dominio y añadir auditoría; no borrar ni promover perfiles. Perfil CLIENT automático al registro Auth. El primer ADMIN se activa por UUID real y correo verificado desde la consola autorizada, nunca desde el navegador. No se versiona contraseña del rol.

TLS verifica certificado y hostname con CA oficial Supabase (apps/api/certs/supabase-ca.crt), SHA256 807025AD50D4ED219D2C9C7D299C004F824EB00CF7F65AFEF607D07B72E6CAFA. Fuente https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt . Configurar DATABASE_SSL_CA_FILE absoluto en cada host. No usar rejectUnauthorized=false.

Configurar Supabase Auth Site URL y redirect permitido a /auth/callback del origen local/producción. El registro requiere correo y contraseña propia; si el proveedor exige confirmar correo no se omite la confirmación. SMTP y entrega de correo requieren configuración del propietario antes de invitar a todo el equipo.

## Contrato con Tomas

Módulo 1 conserva /api/spaces, /api/reservations y /api/reservations/:id/cancel. Cambios de estado bloquean la misma fila del espacio que las reservas. Mantener UTC y aforo. Next consume Express por rewrite /api, con bearer real verificado por getUser y rol desde PostgreSQL. No duplicar reservas en otra tabla o aceptar userId del navegador.

## Validación y límites

Pruebas unitarias cubren JSON inválido/truncado, campos extra, ruta inconsistente, cuota y fallo de red. Integración real PostgreSQL+Express: dos préstamos simultáneos, devolución autorizada, mantenimiento, aislamiento entre usuarios, auditoría y fallo IA sin resultado inventado. El proveedor de identidad es doble de prueba local en esa integración; no certifica correo/login Supabase. RUN_LIVE_AI=1 permite comprobar Groq real con reportes de prueba sobre la BD aislada campusflow_test, limpiando sus fixtures.

RAG requiere documentos oficiales; no está implementado ni simulado. Sin chat realtime, reuniones ni métricas ficticias. Listas actuales limitadas a últimos 50 elementos, sin paginación; contadores etiquetados como recientes. Rate limiting distribuido, idempotency keys de creación y carga de múltiples réplicas quedan pendientes antes de escalar producción. Las imágenes del campus se incorporarán después: por ahora no se presentan fotos generadas como reales.

Fuentes verificadas: https://console.groq.com/docs/structured-outputs (también consultado con Context7), https://supabase.com/docs/guides/auth/server-side/creating-a-client , https://lenis.dev/ . Arko Sushi https://arko-sushi.midudev.workers.dev/ aporta ritmo de scroll y composición, sin sustituir el stack Next/Express autorizado.
