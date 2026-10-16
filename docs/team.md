# Equipo y flujo Git

| Integrante | GitHub | Responsabilidad | Primer incremento |
|---|---|---|---|
| Deimer Jose Caro Silvera | DEIMER-PY | Integración, Auth, IA y documentación | Conectar Auth y perfiles, verificar roles; probar proveedor IA |
| Leonardo | Leonardo4516 | Datos, Prisma, SQL y concurrencia | Configurar BD, verificar migración e importar fuente oficial |
| Samuel Pallares | SamuelJoseMantilla | Diseño, React/Next y Tailwind | Formularios de reserva y vistas responsive con estados reales |
| Tomas Gonzalez | TEstebanGQ | Módulo 1, espacios/reservas e integración | Conectar su módulo con contratos compartidos |

## Ramas

`develop` predeterminada e integración. `main` para releases al estabilizar entrega. Feature corta desde develop: `feature/12-reservation-form`. Correcciones `fix/18-reservation-conflict`. PR a develop, revisión de otra persona, checks verdes. El bootstrap es la excepción inicial a PR. Nunca force push a ramas compartidas.

```bash
git switch develop
git pull --ff-only
git switch -c feature/12-reservation-form
# cambios y verificación
git add apps/web
git commit -m "feat(web): ✨ add reservation form"
git push -u origin feature/12-reservation-form
gh pr create --base develop --fill
```

Commits convencionales con emoji después del prefijo: `feat(api): ✨ ...`, `fix(db): 🐛 ...`, `docs: 📝 ...`, `test(api): ✅ ...`, `chore(deps): 🔧 ...`. No commits masivos sin explicar ni atribución inventada. Deimer coordina package.json/lockfile, Leonardo migraciones; revisar conflictos juntos.

PR describe problema/resultado, cómo verificar, cambios de contrato/migración y limitaciones reales. Una issue tiene un responsable y criterio observable. Trabajo en bloques de 30–40 minutos; no esperar a terminar el módulo entero para integrar. Columnas: Pendiente, En curso, Revisión, Terminado.

## Tiempo restante

La planificación de las 7:22 ya es referencia histórica: confirmar el cierre oficial y usar tiempo restante real. Reparto: 10% contratos/accesos, 50% construcción e integración, 20% pruebas/diseño, 20% defensa y margen. Antes de cerrar construcción debe existir IA real y un flujo persistido completo. Congelar alcance 45 minutos antes de entrega.

Todos deben localizar y cambiar una regla en menos de tres minutos. Tomas explica servicios, Leonardo integridad, Samuel experiencia, Deimer arquitectura/IA. Ensayar demo válida, rechazo y fallo recuperable.

## Ajuste de alcance confirmado por el usuario

Nuestro incremento prioriza módulo 2 (recursos tecnológicos, préstamos, estados, devoluciones) y módulo 3 (incidencias y triaje IA). Tomas desarrolla lo demás, especialmente espacios y reservas; conservar el contrato y restricciones compartidas. La UI de espacios existente es integración, no un segundo módulo divergente.

Actualización posterior del usuario: Leonardo continúa iteración de frontend e integraciones/planos. Tomas usa n8n para módulo 1. Samuel apoya diseño/UX y validación; Deimer mantiene API, IA y Auth. No interpretar las ramas iniciales como asignación inmutable.
