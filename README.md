# CampusFlow

**Espacios, recursos e incidencias. Un campus mejor conectado.**

Base de producto para Campuslands con Next.js + React + Tailwind, API Express y PostgreSQL con Prisma, preparada para Supabase Auth. Diseño responsive, permisos en servidor y consistencia bajo concurrencia.

## Estado real

Este primer incremento contiene portada, acceso, estructura de portal/administración, integración de autenticación condicionada a configuración, API de salud/perfil/espacios/reservas/auditoría, modelo Prisma y migración inicial. **No es todavía el producto terminado.** No hay conexión a un proyecto Supabase, datos oficiales importados, triaje IA, préstamos, RAG ni chat funcionando. Esos incrementos están en [roadmap](docs/roadmap.md). Evidencia actual en [handoff](docs/handoff.md).

## Inicio

Requisitos: Node según `.nvmrc` (24.22.0), npm 11 y PostgreSQL 17+ o Supabase. Un solo gestor y lockfile.

```bash
npm ci
npm run db:generate
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
npm run dev
```

Web: http://127.0.0.1:3000 · API: http://127.0.0.1:4000/health. La portada funciona sin credenciales; el acceso queda deshabilitado hasta configurar Supabase. `/ready` devuelve 503 mientras no existe conexión de BD. No introducir claves reales en el repositorio.

Completar variables de cada app y aplicar migraciones sobre una BD de desarrollo vacía/autorizada:

```bash
npm run db:validate
npm run db:deploy
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
