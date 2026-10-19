# Revisión interna del rediseño

No es una calificación del jurado ni una auditoría formal de accesibilidad. La rúbrica oficial conserva sus seis pesos y pendientes.

Dirección: One motif, semilla 632005633; app True-black flat, conservando marca y tipografía. En esta página, el marco abierto de las salas aportadas se convierte en la composición de fotografía y texto. Interacción propia: recorrer fotografías del campus; el recorrido por capítulos conecta los espacios con recursos, reportes y decisiones. Kiro y el proyecto de Midudev orientan jerarquía y narrativa, sin copiar sus marcas o medios.

ROUND 3

Seen in one second: CampusFlow coordina espacios, recursos e incidencias; el acceso principal está visible.
Idea (one sentence): Los espacios aportados por el equipo son el material visual del recorrido operativo.
Live thing: Galería de fotos y capítulos navegables; robot de acceso responde al puntero fino.
Layout words by section: hero=texto/fotografía asimétricos / campus=galería amplia / flujo=fotografía fija y capítulos / IA=campo azul / RAG=diagrama y texto / cierre=acción y marca.
Scores: design 7.5 · usability 8 · creativity 7 · content 8 → overall 7.6, valoración interna subjetiva.
Caps applied: creatividad limitada a 7 por usar un patrón reconocible de producto; no se atribuye originalidad absoluta. El inspector terminó sin FAIL; sus avisos permanecen registrados.
Top three problems (most visible first), each with the screenshot it shows in and the fix:

1. El diagrama RAG completo tiene letras pequeñas en móvil: se conserva acceso al tamaño completo y recorrido textual accesible. No se presenta como chat funcional.
2. El cierre de tablet deja una franja lateral: se acepta como cierre breve, después de secciones densas; no bloquea contenido ni acción.
3. La variedad de escalas incluye marca y wordmark de cierre: se acepta su función editorial. Las pantallas operativas mantienen una escala más compacta.

Corregidos antes de este registro: titulares en tres líneas; metadatos pequeños del recorrido RAG; contenido de capítulos que podía permanecer oculto; robot móvil oculto por una regla heredada; foco al volver del detalle y error de análisis que desaparecía al refrescar.

Gate: 0 FAIL, 4 WARN (escala, footage pendiente, movimiento discreto, cierre tablet). Capturas examinadas a 1440, 768 y 390, más matriz Playwright 360/390/768/1024/1440. Reporte local en `/tmp/campusflow-inspect-reviewed/report.json`, no forma parte de la entrega pública.

## Iteración posterior: referencias de carrusel y consola

Solicitud nueva: composición de Campuslands con fotos y robot, catálogo de carruseles HubSpot, dashboard inmobiliario de Fuselab y captura de Vercel aportada. Se conserva la marca y la dirección anterior; las referencias orientan composición y densidad, sin copiar personas, testimonios ni métricas.

- Portada: tres fotografías propias editadas, selección expandida, gestos y teclado; mascota extendida a cuerpo completo mediante ImageGen. Sin reproducción automática del carrusel.
- Acceso: escena fotográfica con mascota, explicación de los tres primeros pasos, ayuda de permisos desplegable. El formulario aparece primero en móvil.
- RAG: arquitectura HTML con iconos SVG, dos fases, siete pasos seleccionables, reproducción finita y pausa. Movimiento reducido desactiva reproducción y mantiene exploración manual. El diagrama estático queda como descarga secundaria; no hay búsqueda ni ingesta real.
- Consola: sidebar con identidad del campus y buscador que respeta destinos autorizados; cola de atención, inventario buscable con lista/tarjetas, préstamos, seguimiento y reservas. Todos los recuentos proceden de las cargas existentes; errores conservan guion y aviso.
- Estilos nuevos separados por superficie (`campus-gallery`, `rag-architecture`, `access`, `console`). Eliminadas reglas antiguas de galería, resumen y acceso que habían sido sustituidas. La identidad gráfica se mantiene con CSS/React y Lenis existente, sin modificar dependencias raíz.

Revisión en navegador: corregidos desbordamiento del robot a 360 px, escena móvil ocultada por CSS heredado y espacio excesivo antes de la fotografía de acceso. Las capturas del dashboard proceden exclusivamente del entorno aislado con registros PRUEBA; no acreditan acceso real multirrol.

ROUND 4 — revisión de producción

La inspección final de la compilación local terminó con **0 FAIL / 5 WARN** a 1440, 768 y 390 px (`/tmp/campusflow-round2-inspect-production/report.json`). Se revisaron además el login, las fotos y la consola de fixtures en escritorio/móvil. Se simplificó el diagrama para que sus nodos se lean como recorrido, sin cajas repetidas, numeración ornamental o tipografía pequeña. El indicador real de paso queda en una línea.

Avisos conservados: marco del lienzo RAG (agrupación funcional); escalas de la marca y contenido; ausencia de video hasta conectar proveedor; movimiento por interacción, deliberadamente sin bucles de portada; cierre breve en tablet con espacio lateral. No se ocultó contenido para pasar el inspector. La explicación RAG conserva lectura manual y texto accesible.

Valoración interna subjetiva: diseño 8, usabilidad 8, creatividad 7.5, contenido 8.5. No es calificación del jurado ni certificación de accesibilidad. Los pendientes relevantes son video externo, recorrido autenticado real y comprobación asistida de accesibilidad; las capturas aisladas no los sustituyen.
