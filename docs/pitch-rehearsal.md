# Neural Routing presenta CampusFlow

Guion oral de aproximadamente 3 minutos, 45 segundos por integrante. Mostrar la web; no se requiere deck. Confirmar duración oficial y ensayar con cronómetro. No afirmar RAG, n8n, visión o correo completos sin evidencia.

## Samuel — problema y experiencia

«Somos Neural Routing. Cuando una sala está ocupada, un computador falla o un equipo está prestado, necesitamos saberlo antes de organizar una actividad. CampusFlow reúne espacios, recursos e incidencias en una plataforma para Campuslands. Diseñamos una experiencia para consultar disponibilidad, solicitar recursos y reportar problemas con seguimiento. El dashboard presenta lo que necesita atención y ayuda a entender el estado de cada solicitud. Nuestro objetivo es reducir la incertidumbre en la operación del campus».

Mostrar portada, login y resumen. No inventar ahorro porcentual ni volumen de usuarios.

## Tomas — agenda y reglas

«Nuestra regla central es no asignar espacios o recursos inhabilitados ni permitir operaciones en conflicto. En reservas validamos aforo y cruces de horario. En préstamos comprobamos disponibilidad e impedimos dos préstamos activos del mismo equipo. Incorporamos un tablero de horarios que conserva la fuente y señala lo que requiere revisión. Desarrollo los flujos de n8n para proponer ajustes de agenda: su integración real sigue pendiente y deberá respetar las mismas validaciones del servidor».

Mostrar horarios y un caso de rechazo autorizado. Actualizar el texto solo cuando el webhook se pruebe de verdad.

## Deimer — IA con propósito

«La IA convierte una descripción del problema en una propuesta de atención. Primero guardamos la incidencia. Después Groq propone categoría, prioridad y área responsable con una explicación. Validamos la respuesta antes de mostrarla; si el proveedor falla, el reporte permanece guardado. Comprobamos este recorrido desde una sesión ADMIN: un reporte ficticio fue clasificado por Groq y su resultado quedó persistido en Supabase. La IA orienta al equipo y las reglas del servidor protegen las operaciones».

Mostrar resultado real y trazabilidad; distinguir un fixture identificado de un incidente real.

## Leonardo — arquitectura y cierre

«Usamos Next y React para la interfaz, Express para la API y PostgreSQL en Supabase, con Prisma para acceder a los datos. El servidor comprueba identidad, permisos y reglas. Las transacciones y restricciones protegen la consistencia ante solicitudes simultáneas. Probamos concurrencia, permisos y persistencia, además de la interfaz desktop y móvil. Los siguientes pasos son cerrar n8n, validar el inventario completo y completar el RAG documental. CampusFlow busca que cada solicitud tenga un recorrido claro y cada decisión pueda explicarse».

Mostrar arquitectura y repositorio, sin leer toda la lista de dependencias.

## Demo y preguntas

Demo autorizada: préstamo válido → duplicado rechazado → devolución operativa → mantenimiento rechazado → reporte ficticio → clasificación real → seguimiento. No alterar recursos de terceros. No mostrar un HTTP 200 de n8n como reserva confirmada.

Preguntas: ¿por qué IA no reemplaza PostgreSQL?, ¿qué pasa si Groq falla?, ¿cómo se protege un reporte ajeno?, ¿qué datos son oficiales?, ¿qué sigue pendiente? Practicar el cambio de regla con docs/live-challenge.md. Ningún documento acredita por sí solo el ensayo humano en menos de tres minutos.
