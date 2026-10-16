---
name: CampusFlow
description: "El campus en orden: recursos e incidencias con estados verificables."
colors:
  background: "#111111"
  panel: "#1a1a1a"
  panel-raised: "#202020"
  border: "#303030"
  text: "#e9e9e9"
  secondary: "#cfcfcf"
  muted: "#a6a6a6"
  blue: "#0076b7"
  blue-hover: "#006ba7"
  accent: "#56b4ff"
  white: "#ffffff"
  field-background: "#141414"
  field-border: "#444444"
  badge-background: "#292929"
  nav-selected-background: "#12344c"
  nav-selected-text: "#89cdff"
typography:
  display:
    fontFamily: "Poppins, sans-serif"
    fontSize: "clamp(42px, 5.8vw, 80px)"
    fontWeight: 600
    lineHeight: 1.14
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Poppins, sans-serif"
    fontSize: "42px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Poppins, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Poppins, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Poppins, sans-serif"
    fontSize: "12px"
    fontWeight: 500
rounded:
  label: "4px"
  control: "6px"
  notice: "8px"
  panel: "12px"
  feature: "16px"
  badge: "20px"
spacing:
  compact: "8px"
  control-gap: "12px"
  form-gap: "16px"
  section-gap: "24px"
  panel: "30px"
components:
  button-primary:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.white}"
    rounded: "{rounded.control}"
    padding: "13px 23px"
  button-primary-hover:
    backgroundColor: "{colors.blue-hover}"
  button-light:
    backgroundColor: "{colors.text}"
    textColor: "{colors.background}"
    rounded: "{rounded.control}"
    padding: "13px 23px"
  button-light-hover:
    backgroundColor: "{colors.white}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "13px 23px"
  button-dark:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.white}"
    rounded: "{rounded.control}"
    padding: "13px 23px"
  field:
    backgroundColor: "{colors.field-background}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "11px 13px"
  navigation-item:
    backgroundColor: "transparent"
    textColor: "{colors.secondary}"
    rounded: "{rounded.control}"
    padding: "11px 12px"
  navigation-item-selected:
    backgroundColor: "{colors.nav-selected-background}"
    textColor: "{colors.nav-selected-text}"
  status-badge:
    backgroundColor: "{colors.badge-background}"
    textColor: "{colors.secondary}"
    rounded: "{rounded.badge}"
    padding: "5px 11px"
  incident-card:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text}"
    rounded: "{rounded.panel}"
    padding: "23px"
---

# Design System: CampusFlow

## Overview

**Creative North Star: "El campus en orden"**

El campus en orden expresa una interfaz sobria de grafito, tipografía Poppins y azul Campuslands. La jerarquía se apoya en contraste tonal y espacio; los estados y acciones son legibles antes que decorativos. La identidad y el logo proceden de las referencias de marca registradas, sin atribuir a CampusFlow una afiliación oficial.

La portada aprobada usa una composición de producto primero; el dashboard Operate usa formularios y listas densas con scroll nativo. Son expresiones de un mismo sistema, no plantillas intercambiables. La primera paleta verde/marfil fue descartada por el usuario.

**Key Characteristics:**

- Grafito con acentos azules y superficies planas.
- Poppins autoalojada, jerarquía amplia en portada y compacta en operación.
- Datos, errores, vacíos y cargas con significado explícito.

Fuente de extracción: `src/app/globals.css`, `src/app/layout.tsx`, componentes de workspace y movimiento. El frontmatter es normativo para los patrones reutilizados; no pretende enumerar todos los valores puntuales del CSS. Contexto de producto en `PRODUCT.md`; contrato y evidencia en `../../docs/design-review.md`.

No se conservaron state/spec ni gates medidos comp-led antes de implementar. Este registro describe el código actual y la dirección aprobada, sin reconstruir esos gates ni certificar reproducción pixel-perfect. El kit Figma no fue accesible. En la revisión actual del prototipo, el integrador comprobó una sesión humana ADMIN real en navegador; las menciones de registro pendiente en documentos anteriores no describen esa comprobación. Su alcance y los límites de las capturas actuales quedan en `../../docs/design-review.md`.

## Colors

Azul funcional sobre neutrales grafito; los tokens del frontmatter mantienen los nombres de la fuente cuando existen.

### Primary

- **Azul Campuslands** (`blue`): acciones principales; `blue-hover` oscurece la respuesta al puntero.
- **Azul luminoso** (`accent`): énfasis de titulares, enlaces e indicador de foco.

### Neutral

- **Grafito base y paneles** (`background`, `panel`, `panel-raised`): capas de página y componentes.
- **Texto claro** (`text`, `secondary`, `muted`): jerarquía de contenido, explicación y metadatos.
- **Límites y campos** (`border`, `field-border`, `field-background`): estructura visible sin sombras.
- **Selección operativa** (`nav-selected-background`, `nav-selected-text`): localización de la sección activa.

Los badges reales añaden pares semánticos verde, ámbar y rojo para estados. Sus valores no son una escala de marca intercambiable. Las variables teal y danger declaradas pero no consumidas no se promueven como tokens normativos.

Las rampas OKLCH de ocho pasos del sidecar son muestras sintetizadas para el panel de documentación; no existen como escalas en la aplicación ni sustituyen los colores normativos del frontmatter.

**The Blue Action Rule.** Usar azul principal para acciones y azul claro para enlaces, foco y énfasis; mantener el grafito como base.

## Typography

**Display Font / Body Font:** Poppins, con fallback sans-serif. Los pesos locales cargados son 400, 500, 600 y 700.

### Hierarchy

- **Display:** titular de portada, con escala fluida; móvil usa una excepción de tamaño y altura descrita en Layout.
- **Headline:** título de la sección de recorrido; títulos de otras secciones y acceso tienen tamaños propios observados, no una escala matemática común.
- **Title:** encabezados de formularios y paneles operativos.
- **Body:** base de lectura global; las descripciones operativas usan también tamaños compactos.
- **Label:** etiquetas de formularios. No extender el tamaño reducido de metadatos a instrucciones principales.

La anchura de lectura se limita según contexto: introducción de portada (75ch), recorrido (43–44ch) y explicación IA (48ch). Los números de registros y fechas usan tabular-nums cuando aplica.

**The Local Poppins Rule.** Usar la familia Poppins autoalojada en portada, acceso y operación; distinguir funciones por escala y peso.

## Layout

La portada centra el contenido en un contenedor máximo (1320px), con ancho disponible menos márgenes (96px en escritorio, 56px bajo 1150px y 36px bajo 640px). Hero centrado con CTA pareados; preview construido con HTML y datos de catálogo, no una captura usada como interfaz.

El dashboard combina sidebar (235px), contenido flexible y cabecera (72px). La sidebar reduce a 205px bajo 1150px y a 175px bajo 900px. Formularios/listas pasan a una columna bajo 900px. El contenido tiene máximo (1600px) y padding (36px), ampliado a 48px desde 1600px.

Bajo 640px, navegación operativa horizontal desplazable, cabecera (58px), padding lateral (18px) y cierre de sesión disponible en la barra móvil. La sidebar inferior de escritorio se oculta; su acción de cuenta tiene acceso móvil equivalente. Las filas se envuelven y los textos largos rompen línea. El hero usa tamaño móvil (47px) y line-height (1.12); el cuerpo global baja a 13px. El acceso de dos columnas pasa a una y oculta el bloque promocional lateral.

El ritmo varía por superficie: separaciones compactas para formularios, paneles contenidos y secciones amplias en portada. Los tokens de spacing son pasos observados, no una obligación de convertir todas las distancias a una única retícula.

El refinamiento operativo añade un corte (750px) para apilar filtros y resumen; desde 1100px el formulario de incidencias permanece visible junto a una cola más ancha. El login ordena formulario antes del panel de identidad en escritorio e incorpora el robot suministrado por el usuario. Estas reglas describen el CSS; las capturas actuales etiquetadas como móvil incluyen archivos de 1018px de ancho y no certifican todavía el comportamiento a ancho móvil real.

## Elevation & Depth

Superficies planas, bordes discretos y cambios de tono. El calendario incorpora una excepción funcional: su popover elevado usa `box-shadow: 0 16px 40px #0008` para distinguir la capa superpuesta del formulario; las tarjetas y filas siguen siendo planas. El preview usa perspectiva (1800px) y una inclinación inicial (2.2deg) que disminuye hasta cero en los primeros 600px de scroll; es una expresión de portada, no elevación de tarjetas operativas. Lenis solo se monta en landing (duración 1.05s). Las transiciones de botón usan 0.2s; el indicador de carga gira en 1s lineal. La preferencia de reducción de movimiento desactiva transiciones, animaciones y tilt, y evita montar Lenis.

**The Tonal Depth Rule.** Separar superficies por tono y borde antes de introducir sombras. Reservar la sombra observada del calendario para distinguir su capa superpuesta.

## Shapes

Rectángulos suavizados: controles compactos, paneles de radio medio y bloques de presentación más amplios. Los valores normativos están en `rounded`. Los badges tienen silueta de píldora; los pasos del recorrido usan círculos. Contenedores de filas y preview recortan el contenido dentro de sus bordes. Los bordes estructurales son finos (1px); no se usan sombras duras desplazadas.

## Components

### Buttons

Acciones claras de peso medio, con variante azul, clara y de contorno. `button-dark` conserva su nombre heredado aunque actualmente usa el mismo azul principal. El botón base tiene altura mínima (46px), variante pequeña (38px); el acceso de cabecera usa una excepción (42px). Hover cambia fondo/borde; foco global azul claro con contorno (2px) y separación (4px). Disabled reduce opacidad a la mitad y evita cursor de acción. Las variantes permanecen separadas en el sidecar.

### Chips

Badges de estado con texto explícito, neutros por defecto; verde para resultados disponibles/completos/resueltos, rojo para fallos/prioridades altas y ámbar para procesamiento/prioridad media. El color acompaña al significado textual.

### Cards / Containers

Incidencias y formularios usan paneles con borde y radio medio. El preview y el bloque de explicación IA usan radio mayor. Los listados operativos se estructuran mediante filas y divisores; no convertir cada dato en tarjeta.

### Inputs / Fields

Campos oscuros con borde perceptible, radio de control y caret azul claro. Etiqueta persistente por encima, placeholder secundario y textarea redimensionable verticalmente. Foco global y disabled coinciden con acciones. Error y éxito tienen contenedores semánticos separados; no sustituirlos por decoraciones de color sin explicación.

### Navigation

La navegación de portada enlaza a secciones y se oculta en móvil; la de operación conserva los destinos como fila horizontal desplazable. La opción actual usa aria-current y fondo/texto de selección. Mantener el enlace inicial para saltar al contenido. El sidecar presenta una muestra estática de la selección, no una aplicación funcional.

### Incident result

La propuesta IA se presenta dentro de su incidencia: separador, estado, categoría/prioridad/área, explicación y trazabilidad disponibles. Carga, vacío, error y reintento explican el estado real. La carga usa resultados independientes (Promise.allSettled): el fallo de un módulo se informa sin bloquear otros resultados. No representar como finalizado un resultado aún pendiente.

### Incident queue and summary

La cola combina recuentos por estado con búsqueda por descripción, número o resumen IA y un selector de estado. Los recuentos proceden de los reportes cargados y muestran un guion mientras el módulo no está listo; el filtro activo se distingue con azul y aria-pressed. Los títulos de incidencia ganan jerarquía y el reporte original permanece desplegable. El resumen usa barras nativas meter y cifras tabulares para la distribución de esos mismos registros visibles, limitada a los últimos 50: no representa un total histórico ni una tasa global del campus.

### Booking calendar and participants

El campo nativo de fecha sigue siendo editable y se complementa con un calendario desplegable y atajos Hoy, Mañana y En una semana, calculados para America/Bogota. La selección usa azul principal, cierra el calendario y devuelve foco al botón; Escape y cierre explícito ocultan el panel. Los participantes opcionales se muestran en etiquetas compactas y no envían invitaciones. El número de personas incluye a quien organiza y sigue sujeto al aforo validado por servidor.

### Audit history

El historial presenta acciones conocidas en español, iconos SVG por tipo, referencia abreviada y fecha local. Código de acción e identificador completo quedan bajo Detalle técnico. Las acciones desconocidas conservan su código con un prefijo explicativo; no fabricar una traducción ni el significado de un evento no reconocido.

### Campus plan and identity assets

El visor muestra un plano real de Torre Zenith nivel 6 suministrado por el equipo, con descarga del PDF, zoom, rotación en pasos de 90 grados y restablecimiento. El fondo claro conserva la lectura del documento dentro de la interfaz oscura y la región desplazable admite foco de teclado. Las posiciones del catálogo todavía no están vinculadas: no hay coordenadas confirmadas ni disponibilidad inferida del plano. El aviso de integración n8n mantiene su estado pendiente. El robot del login es un asset suministrado por el usuario; el favicon usa azul Campuslands y geometría blanca, sin sustituir el logo oficial ni presentar la ilustración como fotografía del campus.

### Incident follow-up

Dos secciones desplegables mantienen evidencia y conversación dentro de cada reporte. La fotografía se asocia a un código de equipo y muestra estado del análisis, observación, limitaciones y recomendación; el formulario comunica los límites de archivo y evita confundir observación visual con funcionamiento comprobado o disponibilidad. La conversación persistida muestra rol y fecha, permite guardar contexto y consulta mensajes nuevos mediante Actualizar datos. No se presenta como chat realtime. Las acciones tienen estados de espera y error explícitos; ampliar la evidencia conserva el contexto del reporte.

## Do's and Don'ts

### Do:

- Do mantener foco visible y navegación por teclado.
- Do conservar estados de carga, vacío y error por módulo; una respuesta parcial no debe ocultar módulos que respondieron.
- Do respetar prefers-reduced-motion y scroll nativo del dashboard.
- Do usar SVG para iconos funcionales y el logo oficial con su procedencia documentada.

### Don't:

- Don't reutilizar la paleta verde/marfil descartada.
- Don't inventar ocupación, métricas, disponibilidad, testimonios ni resultados IA.
- Don't afirmar fidelidad al kit Figma inaccesible ni cierre de gates comp-led sin evidencia histórica.
- Don't convertir las etiquetas auxiliares muy pequeñas observadas en una escala obligatoria para nuevas superficies.

No canonizado ni reparado en este registro: tamaños auxiliares de 9–10px, que requieren evaluación por contexto antes de reutilizarse; ausencia histórica de spec/gates comp-led, que es una limitación de evidencia y no un token. Los avisos de especificidad CSS son deuda existente, no una regla visual. El detector actual también informa valores de color y tipo fuera del frontmatter; se registran como advisories sin convertir cada excepción en token normativo. Este pase modifica documentación y no regenera el sidecar: sus muestras previas de tarjeta, profundidad y breakpoints requieren sincronización con este refinamiento.
