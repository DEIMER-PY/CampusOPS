# Activos de documentación

- `screenshots/landing-desktop.webp`: compilación local, Playwright CLI, 1440×960.
- `screenshots/login-desktop.webp`: compilación local, Playwright CLI, 1440×960.
- `screenshots/login-mobile.webp`: compilación local, Playwright CLI, 390×844.
- `screenshots/*-review.webp`: revisión autenticada previa del prototipo, navegador integrado. Muestran resumen, reservas/calendario, incidencias, historial y plano; la navegación de horarios se añadió después. Conversión PNG → WebP con Sharp, sin alterar contenido.
- `technologies/stack.svg`: composición de tecnologías/versiones con SVG de Simple Icons para las marcas disponibles. Paths, revisión de origen y licencia se documentan en technologies/logos/provenance.json. Groq, Lenis y Playwright permanecen tipográficos.

Capturas tomadas el 16 de octubre de 2026. Datos observados de prueba; no representan métricas institucionales. No contienen contraseñas, tokens ni cookies. Los comandos públicos reproducibles están en README.md; las pantallas privadas requieren iniciar sesión legítimamente y revisar que no haya información sensible antes de versionar una captura.

- `neural-routing.webp`: imagen de presentación del grupo aportada por el usuario el 16/10/2026, convertida PNG → WebP con Sharp. Contiene lemas conceptuales; no usarla como evidencia de entrenamiento ML ni como diagrama técnico.

Actualización login: las capturas login-desktop/login-mobile ahora muestran el robot editado con transparencia (1440×960 y 390×844). Original conservado en public/brand/campus-robot.webp; derivado y prompt documentados en docs/robot-image-provenance.json.

- `apps/web/public/images/dashboard-overview.webp`: captura completa del resumen autenticado del entorno de pruebas, 16/10/2026. La portada la presenta como imagen estática de demostración, sin afirmar disponibilidad actual ni publicar sesión o credenciales.

## Rediseño del 19 octubre 2026

- `screenshots/landing-redesign-{desktop,mobile}.webp` y `login-redesign-{desktop,mobile}.webp`: capturas de la web local mediante Playwright CLI, 1440×960 y 390×844, sesión aislada sin credenciales. Portada incorpora fotografías aportadas retocadas con IA; no son fotos documentales sin editar.
- `screenshots/redesign-fixture-{desktop,mobile}-{summary,incident}.webp`: capturas de revisión de componentes reales con identidad y datos **PRUEBA**, generadas por `FRONTEND_SCREENSHOTS=1` en `tests/frontend/workspace.spec.ts`. No son operaciones reales ni evidencia de Groq/Supabase. No contienen sesiones ni datos privados.
- Fotos originales revisadas: 12 del ZIP aportado. Tres versiones editadas en `apps/web/public/campus/*-editada.webp`, prompts/hashes en `docs/campus-photographs.json` y `docs/media/campusflow-photo-edit-prompts.md`.

CLI empleado, con Brave/Chromium ya instalado y configuración temporal fuera del repositorio: `npm exec playwright-cli -- -s=campusflow-redesign open http://127.0.0.1:3000/ --config=/tmp/campusflow-playwright-cli.json`, `resize`, `goto`, `screenshot --filename=...`, `close`. Las capturas de interfaz se toman desde navegador; no se generan con IA.

Segunda iteración del 19/10: las capturas `landing-redesign-*` y `login-redesign-*` se actualizaron desde la compilación de producción local, con movimiento reducido para capturar estados estables. Se añaden `carousel-redesign-{desktop,mobile}.webp` y `rag-interactive-{desktop,mobile}.webp`. RAG ahora es una composición nativa seleccionable, no una imagen de interfaz generada. La mascota ilustrada completa está en `public/brand/campus-robot-full.webp`, con procedencia en `docs/robot-full-image-provenance.json`. Las capturas `redesign-fixture-*` también se actualizaron con la consola final; siguen siendo PRUEBA y no operaciones de usuarios reales.
