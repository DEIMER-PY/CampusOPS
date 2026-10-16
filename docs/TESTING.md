# Plan de pruebas y compatibilidad

[← Documentación](README.md) · [Instalación](GETTING_STARTED.md) · [Evidencia ejecutada](verification.md)

## Qué se ha comprobado

En Linux, el 16/10/2026: typecheck, seis archivos unitarios y dos pruebas de integración con PostgreSQL aislado pasaron. Playwright sobre el prototipo compilado: **10 pasaron, 2 omitidas**. Las omitidas comprueban ausencia de configuración y están reservadas al entorno CI sin secretos; no se contabilizan como aprobadas localmente.

El acceso legítimo ADMIN permitió enviar desde la web un reporte marcado como ficticio. Groq devolvió categoría TECHNICAL/prioridad LOW, estado de IA COMPLETE, y PostgreSQL conservó el resultado. No equivale a probar alta/confirmación de todos los roles ni visión, correo o n8n reales.

Windows y macOS **no se han ejecutado localmente**. La matriz GitHub Actions añade jobs de compatibilidad para esos sistemas. Hasta que terminen correctamente, su estado es pendiente. PostgreSQL concurrente se ejecuta en Linux; los jobs Windows/macOS cubren instalación, Prisma, lint, tipos, unitarios, build y navegador sin servicios externos configurados.

## Comprobación común, desde la raíz

```bash
npm ci
npm run db:generate
npm run db:validate
npm run check
npm exec playwright install chromium
npm run test:e2e
```

`check` incluye lint, typecheck, unitarios y compilación. Los avisos de lint no equivalen a cero deuda técnica. No ejecutar build y next dev simultáneamente sobre el mismo `.next`.

Playwright inicia servidores 3000/4000 salvo `E2E_EXTERNAL_SERVERS=1`. Si ya hay procesos en esos puertos, comprobar qué versión sirven: `reuseExistingServer` puede reutilizarlos. Para una ejecución totalmente aislada, detener solo los servidores propios antes de iniciar la suite.

### Linux

Si faltan bibliotecas del navegador, ejecutar `npm exec playwright install --with-deps chromium` con los permisos administrativos necesarios. No desactivar sandbox/TLS para ocultar fallos.

### macOS

Instalar Node para la arquitectura del equipo (Apple Silicon o Intel). Ejecutar npm ci y la instalación de Chromium en ese mismo sistema. Revisar rutas con espacios y permisos de la CA. No reutilizar binarios de Linux ni de otra arquitectura.

### Windows PowerShell

Usar Node/npm nativos y ejecutar los comandos comunes desde PowerShell. Si la política del equipo bloquea `npm.ps1`, usar `npm.cmd` respetando su política; no desactivar globalmente la protección. Las rutas del entorno deben corresponder al host Windows. WSL se prueba por separado como Linux.

## Integración con PostgreSQL aislado

Requiere una base descartable llamada exactamente `campusflow_test`, con las migraciones aplicadas. Nunca usar Supabase compartido ni datos reales. Los fixtures crean y eliminan registros de ensayo. El nombre de base es una protección adicional, no sustituye verificar host/puerto/credenciales.

Crear el usuario/base de pruebas en el PostgreSQL local conforme a la administración de cada OS. Definir las URLs mediante el editor o gestor de secretos local; no pegar contraseñas reales en archivos versionados.

**Linux/macOS**, ejemplo de base local aislada sin contraseña en la URL:

```bash
DIRECT_URL=postgresql://campusflow_test@127.0.0.1:5432/campusflow_test npm run db:deploy
TEST_DATABASE_URL=postgresql://campusflow_test@127.0.0.1:5432/campusflow_test npm run test:integration
```

**PowerShell**, equivalente para una base de pruebas ya provisionada:

```powershell
$env:DIRECT_URL = 'postgresql://campusflow_test@127.0.0.1:5432/campusflow_test'
npm run db:deploy
$env:TEST_DATABASE_URL = $env:DIRECT_URL
npm run test:integration
Remove-Item Env:DIRECT_URL
Remove-Item Env:TEST_DATABASE_URL
```

Adaptar autenticación a la configuración local. Esos ejemplos no crean ni autorizan un usuario PostgreSQL por sí mismos. No sobreescribir variables de una consola que esté usando la aplicación compartida: abrir otra terminal.

Las integraciones usan Express/Prisma/PostgreSQL reales y dobles explícitos de Auth/Groq/Resend. Verifican permisos, propiedad, concurrencia, evidencia, mensajes, correo idempotente y horarios; no acreditan proveedores reales.

## Probar una instancia ya iniciada en otros puertos

**Linux/macOS:**

```bash
E2E_EXTERNAL_SERVERS=1 E2E_BASE_URL=http://127.0.0.1:3100 E2E_API_URL=http://127.0.0.1:4100 npm run test:e2e
```

**PowerShell:**

```powershell
$env:E2E_EXTERNAL_SERVERS = '1'
$env:E2E_BASE_URL = 'http://127.0.0.1:3100'
$env:E2E_API_URL = 'http://127.0.0.1:4100'
npm run test:e2e
Remove-Item Env:E2E_EXTERNAL_SERVERS
Remove-Item Env:E2E_BASE_URL
Remove-Item Env:E2E_API_URL
```

Estas variables controlan el runner; no reconfiguran puertos ni proxy de una web que ya está ejecutándose.

## Lista manual por rol y módulo

| Recorrido | Resultado requerido |
|---|---|
| Login | Campos etiquetados, robot cargado, error comprensible, sesión legítima y redirección al portal |
| Registro | Confirmación si corresponde y perfil CLIENT, sin elegir privilegios |
| Cliente A/B | B no lee ni modifica reportes/evidencias de A |
| Recursos | Préstamo válido; segundo préstamo activo rechazado; mantenimiento rechazado; devolución solo operador |
| Reservas | Aforo exacto válido; exceso rechazado; cruce rechazado; intervalos contiguos permitidos |
| Fechas/participantes | Calendario por teclado, foco al cerrar, formulario limpio tras guardar, nombres sin corrupción |
| Incidencias | Guardar antes de IA, clasificación real, explicación, fallo recuperable y seguimiento persistido |
| Foto | MIME real, 1 MB/12 MP, código existente, privacidad, limitaciones y resultado visual real |
| Comunicación | Mensaje guardado con rol del servidor; actualizar manualmente |
| Horarios | 24 bloques fuente; advertencias; revisión obsoleta 409; solapes de sala/docente rechazados |
| Plano | PDF fiel, zoom/giro y límites de desplazamiento; sin ubicaciones supuestas |
| Correo | Pendiente/error visibles; destinatario fijo; aceptación distinta de entrega; no duplicar envío |
| n8n | Casos y evidencia de docs/n8n-integration.md con webhook real |
| Responsive | 390×844 y desktop, teclado, foco, sin desbordamiento horizontal de página |

No enviar reportes ficticios como incidentes reales ni modificar reservas/equipos de terceros para hacer una demo. Identificar fixtures y registrar qué se dejó guardado.

## CI y evidencia de fallos

Workflow `.github/workflows/ci.yml`: Linux con PostgreSQL; Windows/macOS para compatibilidad. Se dispara en features, develop/main y PR hacia develop/main. No necesita credenciales de producción. CI no sustituye la demo real con servicios autorizados.

Ante un fallo guardar comando, commit, OS/arquitectura, versiones y mensaje redactado sin secretos. Trazas y capturas pueden contener datos: revisar antes de compartir. No publicar storage state, cookies, enlaces de confirmación ni tokens.
