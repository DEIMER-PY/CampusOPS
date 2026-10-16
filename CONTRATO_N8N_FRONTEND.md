# Contrato de Integración Técnica: n8n ↔ Frontend Web (CampusFlow)

Este documento define la estructura de datos que intercambiaremos entre los flujos de **n8n (IA y Lógica de Calendarios)** y la **Aplicación Web (Dashboard)** para evitar desalineaciones durante la hackatón.

---

## 1. Flujo General de Comunicación

```
[ Frontend Web ]  ──(1. POST con Reporte / Solicitud)──>  [ n8n Webhook ]
                                                                 │
                                                          [ Nodo IA / Reglas ]
                                                          (Aforos, FIFO, No solapes)
                                                                 │
[ Frontend Web ]  <──(2. Respuesta JSON con Salas e IA)── [ n8n Respond to Webhook ]
```

---

## 2. Entrada: Lo que la Web envía a n8n

* **Método:** `POST`
* **Content-Type:** `application/json`
* **Destino:** URL del Webhook de n8n configurada en `.env` como `NEXT_PUBLIC_N8N_WEBHOOK_URL`.

### Payload de Entrada:
```json
{
  "reporte": "La clase de Algoritmos en Cosmos se extiende hasta las 11:30, pero Comercial necesita el aula a las 11:00",
  "usuario": "Prof. Leonardo",
  "rol": "DOCENTE",
  "salaActual": "Cosmos",
  "asistentes": 25,
  "horaInicio": "10:00",
  "horaFinSolicitada": "11:30"
}
```

### Especificación de Campos de Entrada:
| Campo | Tipo | Obligatorio | Descripción / Valores |
| :--- | :---: | :---: | :--- |
| `reporte` | `string` | Sí | Texto en lenguaje natural con la situación o eventualidad. |
| `usuario` | `string` | Sí | Nombre o identificador del solicitante (ej: `"Prof. Leonardo"`). |
| `rol` | `string` | Sí | `"DOCENTE"`, `"COMERCIAL"`, `"ADMINISTRATIVO"`. |
| `salaActual` | `string` | No | Nombre del aula donde ocurre la situación (si aplica). |
| `asistentes` | `number` | No | Cantidad de personas involucradas. |
| `horaInicio` | `string` | No | Formato `"HH:mm"` (ej: `"10:00"`). |
| `horaFinSolicitada` | `string` | No | Formato `"HH:mm"` (ej: `"11:30"`). |

---

## 3. Salida: Lo que n8n DEBE devolverle a la Web

El nodo final de n8n (**Respond to Webhook**) debe devolver código `200 OK` con el siguiente JSON estructurado:

### Payload de Respuesta:
```json
{
  "status": "success",
  "decisionIA": {
    "titulo": "Conflicto de Horario Resuelto",
    "explicacion": "Se aplicó prioridad al primer ocupante (Prof. Leonardo en Cosmos hasta las 11:30). La reunión comercial fue reubicada automáticamente a Spooki sin duplicidad ni solapamiento.",
    "tipoAlerta": "SUCCESS",
    "accionEjecutada": "REUBICACION_AUTOMATICA"
  },
  "salas": [
    {
      "nombre": "Auditorio",
      "capacidad": 100,
      "estado": "DISPONIBLE",
      "ocupanteActual": null,
      "horario": null,
      "nota": null
    },
    {
      "nombre": "Spooki",
      "capacidad": 38,
      "estado": "REUBICADO_IA",
      "ocupanteActual": "Reunión Comercial (Alianza Tech)",
      "horario": "11:00 - 12:30",
      "nota": "Reubicado por IA desde Cosmos"
    },
    {
      "nombre": "Cosmos",
      "capacidad": 25,
      "estado": "OCUPADO",
      "ocupanteActual": "Prof. Leonardo (Clase Algoritmos)",
      "horario": "10:00 - 11:30",
      "nota": "Horario extendido por orden de llegada"
    },
    {
      "nombre": "Apolo",
      "capacidad": 34,
      "estado": "DISPONIBLE",
      "ocupanteActual": null,
      "horario": null,
      "nota": null
    },
    {
      "nombre": "Artemis",
      "capacidad": 32,
      "estado": "DISPONIBLE",
      "ocupanteActual": null,
      "horario": null,
      "nota": null
    },
    {
      "nombre": "Skilab",
      "capacidad": 20,
      "estado": "DISPONIBLE",
      "ocupanteActual": null,
      "horario": null,
      "nota": null
    },
    {
      "nombre": "Blanca",
      "capacidad": 12,
      "estado": "DISPONIBLE",
      "ocupanteActual": null,
      "horario": null,
      "nota": null
    },
    {
      "nombre": "Azul",
      "capacidad": 10,
      "estado": "DISPONIBLE",
      "ocupanteActual": null,
      "horario": null,
      "nota": null
    },
    {
      "nombre": "Amarillas",
      "capacidad": 6,
      "estado": "DISPONIBLE",
      "ocupanteActual": null,
      "horario": null,
      "nota": null
    },
    {
      "nombre": "Azules",
      "capacidad": 6,
      "estado": "DISPONIBLE",
      "ocupanteActual": null,
      "horario": null,
      "nota": null
    },
    {
      "nombre": "Verdes",
      "capacidad": 6,
      "estado": "DISPONIBLE",
      "ocupanteActual": null,
      "horario": null,
      "nota": null
    }
  ],
  "incidenciaDetectada": {
    "existe": false,
    "descripcion": null,
    "prioridad": "NONE",
    "areaResponsable": null
  }
}
```

---

## 4. Diccionario de Valores y Convenciones

### A. Catálogo Oficial de Salas (11 Espacios)
> **Importante:** Usar exactamente estos nombres y aforos para que el frontend no rompa el mapeo:
1. `Auditorio` — Capacidad: 100
2. `Spooki` — Capacidad: 38 (100% Estudio)
3. `Apolo` — Capacidad: 34 (100% Estudio)
4. `Artemis` — Capacidad: 32 (100% Estudio)
5. `Cosmos` — Capacidad: 25 (Mixto)
6. `Skilab` — Capacidad: 20 (100% Estudio - Lab)
7. `Blanca` — Capacidad: 12 (Mixto)
8. `Azul` — Capacidad: 10 (Mixto)
9. `Amarillas` — Capacidad: 6 (Mixto - Cubículo)
10. `Azules` — Capacidad: 6 (Mixto - Cubículo)
11. `Verdes` — Capacidad: 6 (Mixto - Cubículo)

### B. Valores Permitidos para `estado`:
* `"DISPONIBLE"`: El aula está libre (se pinta de color verde esmeralda).
* `"OCUPADO"`: El aula está ocupada legítimamente (se pinta ámbar o rojo suave).
* `"REUBICADO_IA"`: El aula recibió a un grupo reubicado por la IA (se resalta con badge especial de IA).
* `"MANTENIMIENTO"`: El aula está inhabilitada por avería técnica.

### C. Valores Permitidos para `decisionIA.tipoAlerta`:
* `"SUCCESS"`: Conflicto resuelto exitosamente o reserva confirmada.
* `"WARNING"`: Aviso de solapamiento o advertencia de aforo.
* `"ERROR"`: Imposibilidad de atender la solicitud o fallo técnico.

### D. Valores para `incidenciaDetectada.prioridad`:
* `"NONE"`, `"LOW"`, `"MEDIUM"`, `"HIGH"`, `"CRITICAL"`.

---

## 5. Parámetro de Conexión Requerido

Favor compartir la URL del Webhook de producción o prueba de n8n para registrarla en el frontend:
```bash
NEXT_PUBLIC_N8N_WEBHOOK_URL="https://tu-instancia-n8n.com/webhook/campusflow"
```
