# CampusFlow — contexto compartido entre modelos

## Objetivo y fuente de verdad
Construir un producto real para la hackatón Campuslands: espacios/reservas, recursos/préstamos e incidencias/triaje IA. El usuario prioriza diseño profesional, responsive, documentación y concurrencia. Leer primero README.md, docs/architecture.md, docs/roadmap.md y docs/handoff.md. Este archivo sustituye decisiones anteriores de Vite/Bootstrap/MySQL. La guía oficial original aún debe incorporarse: no inventar requisitos ni inventarios.

## Equipo y propiedad
- Deimer (@DEIMER-PY): integrador, Auth/RBAC, IA, documentación y GitHub. Revisa cambios de contratos y dependencias raíz.
- Leonardo (@Leonardo4516): Prisma/PostgreSQL, migraciones, datos oficiales y pruebas de concurrencia.
- Samuel (@SamuelJoseMantilla): Next.js/React, Tailwind, sistema visual, responsive y accesibilidad.
- Tomas (@TEstebanGQ): Express, servicios de reservas/préstamos y contratos OpenAPI.
Cada integrante prueba y documenta su entrega. No delegar a otros agentes salvo autorización expresa del usuario.

## Stack y dependencias
Monorepo npm workspaces: apps/web (Next App Router/React/TypeScript/Tailwind), apps/api (Express/Prisma/PostgreSQL). Supabase para Auth y alojamiento de PostgreSQL; Prisma NO reemplaza Supabase ni aplica por sí solo RLS por usuario. Dependencias exactas en package.json y package-lock.json. Node 24 según .nvmrc; npm 11. npm ci para reproducir; no mezclar gestores. No actualizar majors ni usar canary/RC por estar etiquetados latest. Mantener prisma, client y adapter en la misma versión estable.

## Documentación vigente
Usar Context7 para resolver APIs de la versión instalada: `npm exec ctx7 -- library <nombre> <consulta>` y `npm exec ctx7 -- docs <libraryId> <consulta>`. Si no tiene acceso/cuota, consultar documentación oficial de esa versión y registrar la limitación; no afirmar que Context7 se ejecutó. Nunca pegar secretos en consultas. El ejemplo MCP vive en .mcp.json.example; no contiene claves ni instala configuración global. Ver docs/tooling.md.

## Comandos
`npm ci`; `npm run db:generate`; `npm run dev`; `npm run check`; `npm run db:validate`; `npm run test:e2e`. Generar Prisma antes de typecheck/build de API. Verificar scripts del package actual antes de ejecutarlos. Variables separadas por app en sus .env.example; nunca mostrar sus valores reales en logs.

## Seguridad y datos
- Solo datos oficiales y operaciones reales en demo. Vacíos y errores explícitos; cero métricas, respuestas IA o disponibilidad simuladas.
- Express valida token con Supabase Auth y consulta rol/propietario en BD para cada operación. No confiar en user_metadata ni roles enviados por cliente. Identidad de usuario deriva del token, nunca del body.
- app_private no se expone por Data API. No conceder acceso anon/authenticated a tablas de dominio. Usar rol DB de runtime restringido; migraciones con credencial separada. No confiar en RLS de Supabase al consultar con un rol Prisma privilegiado.
- Secretos solo servidor; NEXT_PUBLIC expone su valor. Publishable key es pública por diseño; service_role/secret y DATABASE_URL nunca son públicas.
- Autorización de lectura de auditoría y RAG por rol/propietario. El chatbot no ejecuta SQL libre ni altera estados.
- Reservas: transacción, bloqueo del espacio, validación de estado/aforo, exclusión GiST de intervalos activos. Préstamos: bloqueo del recurso e índice único parcial de préstamo activo. No mover validaciones al navegador. Probar concurrencia con BD real.
- Fechas UTC/timestamptz, interfaz America/Bogota; [inicio, fin), intervalos contiguos válidos. Auditoría en misma transacción que mutación. Nunca ejecutar cambios destructivos en BD compartida para pasar pruebas.

## Diseño y React
Paleta verde bosque, fondos marfil y acento lima; tipografía clara, espacio y jerarquía. Server Components por defecto; client solo para interacción. Cargas, vacíos, errores y teclado. Respetar prefers-reduced-motion. Lenis solo si aporta en landing y no interfiere foco/scroll; no obligatorio. Usar componentes accesibles de shadcn/Radix al necesitar diálogos/combobox; no añadir librerías completas sin uso. Imágenes oficiales con permiso o generadas como ilustración; nunca presentar una imagen generada como fotografía real del campus.

## Git
Default develop. Features: feature/<issue>-<tema>. PR hacia develop, revisión de otro integrante; releases hacia main al disponer de entrega estable. No push directo a develop después del bootstrap, no force push compartido. Commits: `feat(web): ✨ ...`, `fix(api): 🐛 ...`, `docs: 📝 ...`, `test: ✅ ...`, `chore: 🔧 ...`. Cada commit contiene un cambio coherente; no fabricar autoría ni historial. Actualizar docs/handoff.md con estado real, comandos probados y pendientes. Un único integrador cambia lockfile raíz; coordinarlo antes de instalar paquetes.

## Verificación y límites
Ejecutar lint, typecheck, tests y build. Playwright CLI para inspección/capturas y Playwright Test para regresión desktop/móvil. No versionar sesiones, cookies ni capturas con datos privados. No declarar Auth, concurrencia, IA, RAG o realtime funcionales si falta verificación real con los servicios. Consultar docs/handoff.md antes de decir qué está terminado.
