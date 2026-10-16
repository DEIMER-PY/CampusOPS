> El usuario canceló las diapositivas. Este guion sirve para práctica oral y recorrido de la web; la explicación del RAG está en /#rag. No hay PPTX entregado.

# Pitch de práctica de CampusFlow

Formato de ensayo: seis momentos principales en aproximadamente 3 minutos 20 segundos, más dos anexos. La guía no fija duración de pitch; confirmar la oficial. Hablar del estado comprobado el 16 de octubre, sin afirmar n8n conectado, login E2E o RAG listo mientras falte evidencia.

## 1. El problema — Samuel, 25 s

«Cuando un equipo falla o dos actividades necesitan el mismo recurso, el problema no es solamente registrar una solicitud. Necesitamos conocer el estado actual y conservar una decisión consistente. CampusFlow reúne la operación del campus y da seguimiento a cada incidencia desde el reporte hasta la atención».

Mostrar portada. No inventar ahorro de tiempo ni cifras de usuarios.

## 2. Un recorrido integrado — Tomas, 35 s

«Nuestro flujo empieza con una persona autenticada. Para los recursos, comprobamos que el equipo esté operativo y que no tenga otro préstamo activo. Una incidencia se guarda antes de analizarla. Los flujos de n8n de agenda se integran por un contrato validado y deben confirmar la operación a través de las mismas reglas transaccionales».

Aclaración actual: adaptador n8n listo, webhook y ejecución conjunta pendientes. No decir «reubicamos automáticamente» si no se demuestra persistencia.

## 3. IA con una función concreta — Deimer, 40 s

«Groq recibe el reporte y contexto operativo acotado, sin propietarios ni datos personales de terceros. Propone categoría, prioridad y cola de atención con una explicación. Validamos la respuesta contra un esquema y guardamos el modelo y la fecha. Si el proveedor falla, el reporte sigue guardado y se puede reintentar. La IA no decide si una operación inválida debe aceptarse».

Mostrar una clasificación real guardada cuando la cuenta esté preparada. Una captura de revisión del dashboard no reemplaza la demostración.

## 4. Reglas que resisten concurrencia — Leonardo, 40 s

«Probamos tres condiciones observables: un recurso inhabilitado no se presta, dos solicitudes simultáneas no reciben el mismo equipo y la devolución requiere un perfil operativo. La base añade una restricción para un solo préstamo activo. En reservas, validamos aforo y solapes. La auditoría se guarda con la operación en la misma transacción».

Mostrar prueba válida y rechazo. Explicar bloqueo e índice sin leer todo el código.

## 5. Arquitectura — Deimer y Leonardo, 35 s

«Next y React presentan la experiencia. Express verifica la identidad con Supabase y toma el rol de PostgreSQL. Prisma ejecuta las transacciones. Groq analiza fuera de ellas para no bloquear conexiones. n8n recibe una petición del servidor y devuelve una propuesta validada. Cada límite tiene un responsable y una comprobación».

Distinguir snapshot de realtime y propuesta de ejecución. No atribuir optimización matemática global a un LLM.

## 6. Evidencia y siguiente paso — Samuel, 25 s

«Tenemos pruebas de concurrencia y del triaje real persistido, además de una interfaz responsive. Antes de defender la entrega completa debemos cerrar el acceso de la cuenta, integrar el webhook de Tomas y ejecutar la demo con el inventario oficial. El siguiente paso es demostrar ese recorrido sin sustituir fallos por respuestas de ejemplo».

Cerrar con el producto y abrir preguntas. Ajustar esta frase cuando los pendientes se resuelvan con evidencia real.

## Demo en vivo preparada

1. Operador registra un equipo ficticio autorizado para evaluación y lo habilita. Identificarlo como demostración.
2. Cliente obtiene préstamo. Segunda solicitud del mismo equipo devuelve conflicto.
3. Operador registra devolución y cambia a mantenimiento. Nueva solicitud devuelve rechazo.
4. Cliente reporta un problema; mostrar persistencia, triaje real, explicación, prioridad y seguimiento.
5. Solo con n8n conectado: solicitar propuesta de agenda y comprobar reglas al confirmar. Nunca presentar HTTP 200 como evidencia de asignación.

## Anexos

La matriz de auditoría contiene pesos oficiales y estado de evidencia, sin una nota autocalculada. El documento live-challenge prepara el cambio de regla de aforo; ensayo real en docs/live-challenge.md.

## Preguntas para practicar

- ¿Por qué la IA no reemplaza las restricciones de PostgreSQL?
- ¿Qué ocurre cuando Groq o n8n no responden?
- ¿Cómo impiden que un cliente cambie el rol o vea reportes ajenos?
- ¿Qué parte es dato oficial y qué parte es fixture de prueba?
- ¿Cómo recuperan un análisis interrumpido sin duplicar inferencias terminadas?
- ¿Dónde vive la fuente de verdad cuando n8n interviene?
- ¿Qué no está implementado todavía y cómo lo comprobarían?

Para practicar, recorrer la web con el guion hablado y las fuentes de la matriz. La sección /#rag explica el futuro flujo documental sin simular un chatbot activo.
