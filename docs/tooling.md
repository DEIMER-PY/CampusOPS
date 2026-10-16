# Herramientas, dependencias y APIs

## Versiones

Resolución inicial consultó npm el 16 octubre 2026. Ver manifests y lockfile como fuente ejecutable. Next 16.4.2, React/DOM 19.3.1, Tailwind/PostCSS 4.3.3, Express 5.3.0, Prisma/client/adapter 7.10.1, Supabase JS 2.118.0 y SSR 0.12.7. Node 24.22.0 y npm 11.19.1. La consulta bruta `dependency-versions.json` conserva evidencia del tag de Prisma RC descartado; no confundirlo con versión instalada.

Actualizar con issue/PR y pruebas, no `npm update` sin revisión. `npm audit` y compatibilidad de peers después de cada actualización. No copiar configuración Prisma 6 ni Tailwind 3; Prisma 7 usa prisma.config.ts y driver adapter; Next 16 no ejecuta lint como parte de build. `npm run check` ejecuta ambas tareas.

## Context7

CLI fijado en devDependencies. Consultas sobre librerías, nunca datos privados:

```bash
npm exec ctx7 -- library nextjs "Next 16 App Router server components"
npm exec ctx7 -- docs /vercel/next.js "Next 16 proxy cookies SSR"
```

Opcional MCP manual: usar .mcp.json.example según el cliente y su soporte de env; introducir clave mediante almacén de secretos local si se requiere. No se modifica configuración global del usuario en este proyecto. Si el servicio exige login/cuota, usar documentación oficial y registrar el fallo. Un paquete instalado no significa MCP conectado.

## Playwright

Test runner para regresiones reproducibles; CLI para inspección visual y capturas. Ambos tienen versión fijada.

```bash
npm exec playwright install chromium
npm run dev
# En otra terminal:
npm exec playwright-cli -- open http://127.0.0.1:3000
npm exec playwright-cli -- snapshot
npm exec playwright-cli -- resize 390 844
npm exec playwright-cli -- screenshot --filename=artifacts/mobile.png
npm exec playwright-cli -- close
npm run test:e2e
```

No publicar estados de sesión/cookies. Capturas en artifacts/ ignorado por Git. Revisar desktop/móvil, teclado, sin scroll horizontal y sin errores de consola. Con servicios reales, probar cliente A/cliente B/admin, expiración, validación y operaciones concurrentes. No considerar un smoke test visual como prueba de base de datos.

Context7 CLI fue consultado: la búsqueda inicial «nextjs» devolvió proyectos secundarios; la consulta directa a /vercel/next.js devolvió ejemplos de cookies/proxy. Sus fuentes apuntaron a canary, por lo que se contrastaron con documentación oficial y la compilación de Next 16.4.2 instalado.

## APIs externas

Supabase URL/publishable key pública; contraseña BD y claves de modelos solo backend. Validar entrada/salida con Zod. IA debe tener timeout, presupuesto, límites de entrada, reintento acotado y estado pendiente persistido. No retries ciegos de mutaciones. No datos personales en prompts si no son necesarios. Peticiones administrativas autenticadas y con rol consultado en servidor.

Dependencias adicionales se introducen al usar la funcionalidad: shadcn/Radix para primitivas complejas, Recharts si hay métricas reales, TanStack Query si la interacción requiere caché/invalidation. No hace falta instalar todo desde el primer commit.
