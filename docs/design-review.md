# Dirección visual y revisión

## Elección y contrato

El usuario pidió ver composiciones antes de implementar y después adjuntó «producto primero» oscuro como referencia, autorizando comenzar a codificar. Landing comp-led; dashboard Operate code-led. No queda una elección visual pendiente. Las imágenes adicionales del usuario fijan Cal.com para densidad, AgentFlow para organización de dashboard y chat para legibilidad de resultados IA.

THESIS: el campus en orden; un portal integrado para recursos e incidencias.
OWN-WORLD: grafito neutro #111111/#1a1a1a, Poppins local, azul Campuslands #0076b7/#56b4ff y logo oficial de campuslands.com/camper.
STORY: presentación, preview de producto con disponibilidad desconocida, recorrido de solicitudes, explicación del triaje, acceso.
FIRST VIEWPORT: encabezado compacto, titular centrado con énfasis azul, dos CTA, preview ancho sidebar y tres filas.
FORM: portada de presentación con Lenis y tilt sutil del preview al avanzar; dashboard de formularios/listas y scroll nativo. Reducción de movimiento desactiva la animación. Referencias corroboradas: composición adjunta por usuario y Cal.com adjunto. Arko Sushi (https://arko-sushi.midudev.workers.dev/) consultado como referencia de ritmo, recorrido y CTA; no se copian contenido ni fotografías y no cambia Next por Astro.
QUALITY BAR: composición oscura adjunta, organización Cal.com y tokens de marca observados en https://campuslands.com/ documentados en campuslands-brand-reference.md. El kit Figma no fue accesible por el conector; no se afirma fidelidad a ese archivo.

## Evidencia y límites

Capturas desktop 1440×1000 y móvil 390×844 bajo artifacts/ (ignoradas). Portada capturada de Next real con Playwright CLI; dashboard inicialmente renderizado desde el componente real en estado de revisión sin sesión, no como evidencia de autenticación. Pruebas Playwright comprueban navegación y ausencia de overflow. No se conservó state/spec ni gates medidos del protocolo comp-led antes de construir. No se fabrican retroactivamente. Por tanto la evidencia valida dirección/composición y funcionamiento probado, no reproducción pixel-perfect ni cierre completo de esos gates.

Detector mecánico ejecutado una vez: []. Revisor independiente Impeccable: disposition inicial fix; conservó tipografía/colores/hero/preview y pidió acciones de cuenta móviles, cargas independientes, documentación vigente y persistir este contrato. Aplicado: cierre de sesión disponible en barra móvil; cargas con Promise.allSettled, cada resultado inspeccionado, fallos parciales informados sin bloquear módulos que respondieron. PRODUCT.md y handoff actualizados. Confirmación final del revisor: disposition ship para los cuatro ajustes puntuados (persistencia, cuenta móvil, carga parcial y verdad documental), sin certificar reproducción pixel-perfect ni autenticación E2E.

No hay métricas inventadas, fotos del campus ni respuestas IA simuladas en la aplicación. Las capacidades del preview son catálogo transcrito pendiente de contraste con guía original; disponibilidad no afirmada. No se usan screenshots como interfaz del producto.

## Procedencia de exploración y pin del usuario

candidate-notes.md conserva el seed histórico seed:30c777a1d889e9be (candidato 7). Al ejecutar concept-seed --check-seed se obtuvo «SEED UNKNOWN: ... record is gone»; no hay roll output íntegro conservado para corroborarlo. Se registra como no corroborado, sin reroll ni afirmar procedencia comprobada. Esa exploración no es autoridad de la dirección actual: el usuario fijó la composición oscura al adjuntarla y pedir «vamos a tomar la referencia ... comienza a codificar». FORM queda fijado por ese pin explícito. Según new-work.md, una dirección fijada por usuario/brief puede entrar sin concept-seed y debe leer mode-persuade/mode-operate; esos modos se aplicaron a portada y dashboard respectivamente. No se condiciona el trabajo autorizado a repetir la exploración.

La ampliación posterior RAG es una sección explicativa dentro del mundo aprobado, sin torneo nuevo. Imagen solicitada por usuario generada con image_gen e incorporada como WebP con metadatos del prompt, procedencia y lectura textual accesible. Revisión acotada adicional de la sección con captura desktop y móvil.

Referencia visual aprobada conservada para el relevo: docs/design/reference-product-first.png, con procedencia y prompt en su sidecar. Los otros borradores exploratorios quedan fuera de Git.
