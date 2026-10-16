# Campuslands como referencia de identidad

Fuente observada: https://campuslands.com/ . Consulta: 16 octubre 2026. Valores extraídos de la hoja pública /_next/static/chunks/1jgdip2zij10d.css y contrastados con la página renderizada. Son estilos de la web actual, **no un manual de marca entregado por Campuslands**.

## Paleta observada y roles propuestos para CampusFlow

| Rol | Valor observado | Uso propuesto |
|---|---|---|
| Fondo profundo | #111111 | Portada oscura y shell |
| Superficie panel | #1A1A1A | Áreas de trabajo elevadas |
| Neutral gris oscuro | #222222 | Separadores y controles |
| Texto principal | #E9E9E9 | Títulos y lectura sobre oscuro |
| Texto secundario | #CFCFCF | Explicaciones y labels |
| Azul de acción | #0076B7 | CTA principal y selección |
| Azul hover | #006BA7 | Hover del CTA |
| Azul pressed | #005482 | Estado activo del CTA |
| Azul luminoso | #56B4FF | Foco y énfasis sobre oscuro |
| Teal de marca | #54C6AA | Acento secundario, usado con moderación |
| Púrpura de marca | #5E39DA | Acento secundario para distinguir funciones |

Poppins es la familia dominante observada. Los botones principales declaran radio de 4px. Portada oscura, títulos claros con énfasis azul, imaginario espacial y navegación compacta forman su lenguaje público. No asumir que cada token declarado tenga el mismo peso visual: el azul domina la portada inspeccionada; teal y púrpura son secundarios.

## Decisión de adaptación

- Campuslands guía color y tipografía; Cal.com guía claridad, densidad y organización de la interfaz operativa.
- Las tres propuestas comparten familia de marca y se comparan por composición, no por paletas incompatibles. La versión clara invierte los neutrales conservando azul/teal.
- No trasladar la escena espacial, partículas o animaciones de marketing a tablas/formularios. El panel debe preservar lectura, foco y desplazamiento nativo.
- Estados operativos tienen nombre e icono además de color. No usar teal para afirmar disponibilidad que la BD no ha confirmado.
- Separar tokens primitivos de roles semánticos de tema. Reutilizar Button, Field, Navigation y Status; no replicar valores hex en cada pantalla. Componentes adaptan responsive sin duplicar lógica de dominio.
- Lenis se limita a portada, respeta reducción de movimiento y se destruye al desmontar. No añadir varias bibliotecas para el mismo efecto.
- Fotografías y logotipo oficial no se asumen libres para redistribuir por ser visibles en la web. Las imágenes generadas de exploración se identifican como conceptuales.

## Estructura de la portada a desarrollar tras la selección

Navegación breve con acceso → mensaje específico de CampusFlow → consulta o vista del producto claramente identificada → recorrido reservas/recursos/incidencias → acceso al sistema y cierre. Mostrar estado real de conexión; no copiar métricas corporativas ni testimonios a CampusFlow.

La composición definitiva sigue pendiente de selección. No se ha aprobado convertir la web institucional en una copia ni declarar CampusFlow un servicio oficial publicado.

Logo incorporado desde https://campuslands.com/Logo-texto-campus.svg, enlazado por la página /camper aportada por el usuario. Copia en apps/web/public/brand/campuslands.svg, con title accesible añadido sin alterar su dibujo.
