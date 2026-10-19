> Actualización: composición implementada y comprobada con el CLI oficial HyperFrames 0.8.178 en `composition/`. Ocho escenas, 105 s, preview editable local en localhost:3102. `check` sin errores y con 8 advertencias estructurales. Continúan pendientes voz ElevenLabs y exportación MP4; no se generó audio por otro proveedor. Las limitaciones MCP descritas abajo corresponden a la revisión inicial.

# CampusFlow — brief de producción audiovisual

Estado: guion y escenas preparados; render HyperFrames y voz ElevenLabs pendientes de conexión autorizada. Este archivo no es un MP4 generado.

## Entrega

Un video horizontal 1920 × 1080, 30 fps, aproximadamente 105 segundos, MP4 H.264/AAC, subtítulos en español y archivo de subtítulos separado. Adaptar duración al audio real antes de renderizar; no recortar palabras para cumplir un tiempo rígido.

Voz: catálogo ElevenLabs, español latino, tono claro, cercano y profesional. Sin clonación ni imitación de personas. Primero comprobar cuenta, licencia y créditos; no comprar planes ni recargar créditos. Sin música predeterminada para favorecer la comprensión.

Identidad: Poppins, grafito #111111, texto #f3f3f3, azul Campuslands #0076b7 y acento legible #73c7ff. Formas planas, jerarquía tipográfica, transiciones de 300–600 ms, sin partículas, neón ni métricas. Texto a 48 px mínimo en lienzo 1080p; títulos a 72–88 px.

## Material y veracidad

- Narración: `narration.es.txt`.
- Fotografías del campus: `../../../apps/web/public/campus/`, utilizar las versiones retocadas después de revisión visual.
- Logo: `../../../apps/web/public/brand/campuslands.svg`; no insinuar afiliación adicional.
- Diagrama previsto: `../../../apps/web/public/images/rag-campusflow.webp`, ilustración conceptual generada; recrear como capas legibles de texto en el video, no ampliar toda la imagen con letras pequeñas.
- No usar capturas autenticadas con correos, cookies, tokens, personas, conversaciones o datos de terceros.
- RAG siempre lleva rótulo «Arquitectura prevista · En preparación». No mostrar carga de archivos ni chatbot como operaciones disponibles.
- Triaje, visión y RAG son capacidades distintas. No presentar inferencia visual, correo, realtime o ejecución n8n como verificados.

## Escenas

| Tiempo orientativo | Imagen y movimiento | Mensaje en pantalla |
|---|---|---|
| 0–9 s | Fotografía real retocada, acercamiento sutil; nombre del producto | CampusFlow · El campus, en orden |
| 9–24 s | Flujo de capas: persona → Next.js → Express → PostgreSQL/Supabase; identidad y permisos junto a Express | Consulta → Solicitud → Validación → Registro |
| 24–36 s | Dos carriles: reservas [aforo, horario] y préstamos [un préstamo activo]; registro de auditoría | Reglas antes de confirmar |
| 36–53 s | Reporte guardado → Groq → categoría/prioridad/área → revisión humana; rama de error hacia reintento | La IA propone. El equipo decide. |
| 53–62 s | Cambio de capítulo, rótulo persistente de estado futuro | RAG documental · En preparación |
| 62–79 s | PDF/Excel autorizado → fuente/versión/permisos → fragmentos → embeddings → índice previsto | Preparar fuentes con trazabilidad |
| 79–96 s | Pregunta → verificar acceso → recuperar fragmentos autorizados → generar con contexto → citas; rama «sin evidencia» | Responder con fuentes; reconocer los límites |
| 96–105 s | Separar dos destinos: documentos/RAG y operaciones/API; cierre con fotografía y marca | La IA propone. Las reglas validan. El equipo decide. |

No se ha elegido proveedor de embeddings ni debe atribuirse esa función a Groq por defecto. El índice pgvector en Supabase pertenece al plan futuro, no a una implementación ya verificada.

## Conexiones solicitadas

MCP oficial HyperFrames: https://mcp.heygen.com/mcp/hyperframes/ . Guía: https://hyperframes.heygen.com/guides/mcp#chatgpt . Al comprobar esta sesión no se encontraron herramientas HyperFrames/ElevenLabs ni servidores configurados para ellos. El catálogo ofrece HeyGen general, que no garantiza exponer HyperFrames. Confirmar herramientas y OAuth antes de generar.

La voz y el render deben registrar proveedor, voz elegida, composición, render ID, duración final, fecha, formato y resultado. No registrar claves ni tokens. No sustituir silenciosamente el MCP solicitado por otro renderizador.
