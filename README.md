# CampusFlow

**Espacios, recursos e incidencias. Un campus mejor conectado.**

Base de producto para Campuslands con Next.js + React + Tailwind, API Express y PostgreSQL con Prisma, preparada para Supabase Auth. Diseño responsive, permisos en servidor y consistencia bajo concurrencia.

## Estado real

Este incremento implementa portada/dashboards, recursos y préstamos con concurrencia, incidencias con triaje Groq estructurado, auditoría y API protegida por Supabase Auth. Supabase CampusFlow ya está configurado en el entorno local. El registro y promoción de la primera cuenta administradora aún requieren completar la verificación del propietario. RAG y realtime no están implementados. Detalles y evidencia en [handoff](docs/handoff.md) y [módulos 2–3](docs/implementation-modules-2-3.md).

## Inicio

Requisitos: Node según `.nvmrc` (24.22.0), npm 11 y PostgreSQL 17+ o Supabase. Un solo gestor y lockfile.

```bash
npm ci
npm run db:generate
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
npm run dev
```

Web: http://127.0.0.1:3000 · API: http://127.0.0.1:4000/health. La portada funciona sin credenciales; el acceso requiere configurar Supabase y un perfil. `/ready` devuelve 503 mientras no existe conexión de BD. No introducir claves reales en el repositorio.

Completar variables de cada app y aplicar migraciones sobre una BD de desarrollo vacía/autorizada:

```bash
npm run db:validate
npm run db:deploy
npm run db:import-spaces -w @campusflow/api
```

Runtime usa DATABASE_URL y migraciones DIRECT_URL. Nunca aplicar migraciones por defecto a una base compartida. El esquema `app_private` debe permanecer fuera de los esquemas expuestos por Supabase. Un administrador crea perfiles ligados a UUID de Auth; no existe promoción pública de rol.

## Calidad

```bash
npm run check
npm exec playwright install chromium
npm run test:e2e
```

Playwright levanta los servicios de prueba. Autenticación y concurrencia reales necesitan un entorno de integración separado; los smoke tests sin servicios externos no los certifican. Para inspección manual: `npm exec playwright-cli -- open http://127.0.0.1:3000`.

## Estructura

```text
apps/web/        Next App Router, UI y sesión SSR
apps/api/        Express, dominio, Auth y Prisma
  prisma/       esquema y migraciones versionadas
packages/       contratos compartidos cuando exista uso real
tests/e2e/      regresiones de interfaz y estados sin configuración
docs/           arquitectura, decisiones, equipo, herramientas y entrega
.github/        CI y plantillas de colaboración
AGENTS.md       contexto obligatorio para asistentes
```

## Documentación del equipo

- [Arquitectura y decisión de base de datos](docs/architecture.md)
- [Diseño y fases de producto](docs/roadmap.md)
- [Roles, ramas y entregables](docs/team.md)
- [Dependencias, Context7 y Playwright CLI](docs/tooling.md)
- [Contrato OpenAPI](docs/openapi.yaml)
- [Seguridad](SECURITY.md)
- [Estado para continuar entre modelos](docs/handoff.md)

Repositorio público solicitado por el equipo. No contiene información privada ni atribuye una afiliación oficial al producto. La guía original de la hackatón debe verificarse antes de cerrar la entrega.

Para PostgreSQL alojado configurar DATABASE_SSL_CA_FILE con la CA pública incluida, sin desactivar validación TLS. El SQL administrativo de runtime está en docs/sql/runtime-and-auth.sql; establecer su contraseña mediante un canal seguro, nunca en Git. Configurar GROQ_API_KEY solo en apps/api/.env. No ejecutar SQL de aprovisionamiento repetidamente sobre una BD ya configurada.

## Equipo y aceptación

Leonardo continúa frontend/integraciones, Samuel diseño/UX, Tomas n8n y espacios, Deimer API/Auth/IA. [Equipo y Git](docs/team.md). [Matriz oficial de aceptación](docs/rubric-audit.md), [contrato n8n y pendientes](docs/n8n-integration.md), [pitch de ensayo](docs/pitch-rehearsal.md), [RAG PDF/Excel previsto](docs/rag-ingestion-plan.md). El webhook de n8n no se ha recibido; el adaptador está preparado sin simular una ejecución.

Relevo para Leonardo: [inicio y pendientes](docs/LEONARDO_HANDOFF.md). La explicación visual del RAG vive en /#rag; su ingesta y chat aún están pendientes. El usuario decidió continuar con la web y guion hablado en lugar de diapositivas.
