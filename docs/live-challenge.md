# Ensayo de modificación en menos de 3 minutos

El requisito se evalúa con el equipo en vivo. Este documento prepara el ensayo y no certifica que los cuatro lo hayan superado.

## Reto sugerido: margen de aforo

Solicitud de práctica del jurado: «Reservar un 10% del aforo como margen de seguridad». Es una política temporal del ejercicio, no una regla oficial inventada ni un cambio vigente del producto.

0:00–0:30: abrir apps/api/src/domain/rules.ts y explicar hasCapacity. El frontend no decide la aceptación; Express la usa dentro de una transacción con bloqueo.

0:30–1:15: cambiar el límite de attendees <= capacity a attendees <= Math.floor(capacity * 0.9). Abrir apps/api/tests/rules.test.ts, ajustar el caso exacto del límite y añadir límite reducido aceptado/exceso rechazado. Con capacidad 25, 22 pasa y 23 falla.

1:15–2:15: ejecutar npm run test -w @campusflow/api y explicar que no se toca el aforo oficial guardado ni la exclusión de solapes. Mostrar rechazo desde API si el entorno autenticado está listo.

2:15–3:00: explicar el impacto sobre reservas futuras y existentes, mostrar diff y acordar si el cambio se conserva. No cancelar reservas previas sin una migración/política explícita. Revertir solo el parche del ensayo, no trabajo ajeno.

Alternativa módulo 2: localizar la condición AVAILABLE y el índice Loan_one_active_per_resource. Explicar por qué eliminar solo una comprobación en UI no debe permitir un préstamo inválido. No demostrar relajando la regla central y dejando el sistema inconsistente.

Todos: Samuel encuentra el flujo en UI; Leonardo muestra la protección SQL; Tomas explica la integración n8n/servicio; Deimer explica el JSON de IA y los fallos. Cronometrar al menos un ensayo completo por persona y registrar tiempo real, sin inventarlo.
