# Usar el asistente de agenda en otro equipo

Guía para que cualquier integrante ponga a funcionar el asistente (n8n + IA) en su computador. Cada persona trabaja con **sus propias** credenciales: no se comparten claves, usuarios de n8n ni contraseñas de bases de datos.

Piezas necesarias: el código, una base Supabase, un n8n corriendo y claves propias de Groq (intérprete principal) y Gemini (respaldo). WhatsApp es opcional.

## 1. El código

Requisitos: Git, Node 24.22.0 y npm 11 (ver `.nvmrc`). En Windows, PowerShell.

```bash
git clone https://github.com/DEIMER-PY/campusflow.git
cd campusflow
git switch develop
npm ci
```

No copiar `node_modules`, `.next` ni archivos `.env` de otro sistema operativo. Ver también [GETTING_STARTED.md](../GETTING_STARTED.md).

## 2. Claves de IA (Groq principal, Gemini respaldo)

Groq: crear una clave personal en <https://console.groq.com/keys>. Puede ser la misma `GROQ_API_KEY` que ya usa la API para incidencias.


Crear una clave personal gratuita en <https://aistudio.google.com/apikey>. No compartirla ni subirla a Git.

## 3. Un n8n local

Con Docker, fijando la versión con la que se probó el flujo:

```bash
docker run -d --name n8n -p 5678:5678 -v n8n_data:/home/node/.n8n docker.n8n.io/n8nio/n8n:2.42.5
```

Abrir <http://localhost:5678> y crear el usuario propietario.

## 4. Importar el flujo y crear las credenciales

1. En n8n: **Workflows → Import from file** y elegir `docs/n8n/campusflow-orquestador.json`.
2. Crear cuatro credenciales y asignarlas a los nodos indicados:

| Credencial | Contenido | Nodos |
|---|---|---|
| Groq | Header Auth, nombre `Authorization`, valor `Bearer <clave de Groq>` | `Groq Interprete` |
| Gemini | Header Auth, nombre `x-goog-api-key`, valor: su clave del paso 2 | `Gemini Interprete`, `Gemini Respaldo` |
| Webhook | Header Auth, nombre `Authorization`, valor `Bearer <secreto que inventa>` | `Webhook Frontend` |
| Postgres | Usuario `n8n_runtime.<project-ref>` de **su** Supabase, SSL requerido | `Leer Estado`, `Aplicar Plan`, `Leer Estado Final` |

3. Activar el flujo.

El secreto del webhook se genera con una cadena aleatoria larga, por ejemplo en PowerShell:

```powershell
-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 40 | % {[char]$_})
```

## 5. Su base de datos

Aplicar las migraciones y el script de roles en su propio Supabase: ver «Puesta en marcha» en [README.md](README.md) y `docs/sql/bootstrap-roles.sql`. No aplicar la migración `n8n_agenda` en la base compartida sin hablar con quien administra las migraciones.

## 6. Conectar la API al n8n

En `apps/api/.env` (archivo ignorado por Git):

```text
N8N_WEBHOOK_URL=http://localhost:5678/webhook/campusflow
N8N_WEBHOOK_SECRET=<el secreto del paso 4, sin la palabra Bearer>
N8N_MODE=proposal
```

## 7. Arrancar y probar

```bash
npm run dev
```

Entrar a <http://127.0.0.1:3000>, iniciar sesión (usuario con rol ADMIN u OPERATOR) y abrir **Asistente de agenda**.

## Cómo comprobar que la IA trabaja

- Escribir algo en lenguaje libre, por ejemplo «necesito la sala azul mañana de 3 a 5 con dos personas».
- La tarjeta de resultado debe mostrar **«La IA entendió: Reserva · gemini-…»** con el nombre del modelo.
- En n8n, **Executions** → abrir la ejecución → nodo `Groq Interprete`: la salida debe tener `choices` con el JSON de la interpretación. Si Groq falla (error HTTP o tiempo agotado), la ejecución pasa a `Gemini Interprete` y luego a `Gemini Respaldo`.

## Si algo falla

| Síntoma | Qué hacer |
|---|---|
| «La IA no respondió (… quota …)» | La clave agotó su cuota: esperar o usar otra |
| «La IA no respondió (… high demand …)» | Saturación temporal del modelo: reintentar en unos minutos |
| Error 403 al llamar al webhook | El secreto de `N8N_WEBHOOK_SECRET` no coincide con el de n8n |
| Error de Postgres en n8n | Usuario o contraseña de `n8n_runtime` incorrectos |
| La app dice que la aplicación directa está desactivada | `N8N_MODE` no es `execute` |

Si un modelo falla durante mucho tiempo, cambiar el modelo en la URL de los nodos Gemini. Los configurados son `gemini-flash-lite-latest` (principal) y `gemini-flash-latest` (respaldo).

## Qué no se comparte nunca

Contraseña de n8n, clave de Gemini, contraseña de `postgres` o de los roles de runtime, clave de Groq o de Evolution, ni los valores de los archivos `.env`. Para un n8n compartido entre varias personas hace falta alojarlo en un servidor con HTTPS (decisión de infraestructura del equipo) y un secreto de webhook propio para esa instancia, entregado por mensaje privado y rotado al terminar.


## Estado de esta máquina

El 16/10/2026, healthz de localhost:5678 responde 200; localhost:5679 no responde. POST /webhook/campusflow devuelve 404 (workflow no registrado) y la interfaz abre /setup. Falta completar la cuenta propietaria, importar el workflow, asignar credenciales y activarlo. La API local queda apuntando al puerto 5678 en modo propuesta. No afirmar IA n8n ni persistencia remota verificadas. No usar localhost desde Vercel: hace falta un endpoint HTTPS accesible desde el despliegue.
