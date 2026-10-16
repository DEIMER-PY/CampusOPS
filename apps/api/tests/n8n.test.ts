import assert from "node:assert/strict";
import test from "node:test";
import {
  calendarRequest,
  calendarResponse,
  requestCalendarProposal,
  WorkflowUnavailable,
} from "../src/integrations/n8n.js";

const input = {
  reporte: "Solicito evaluar una extensión de la clase actual",
  rol: "DOCENTE" as const,
  fecha: "2026-10-16",
  salaActual: "Cosmos",
  asistentes: 25,
  horaInicio: "10:00",
  horaFinSolicitada: "11:30",
};
const valid = {
  status: "success",
  decisionIA: {
    titulo: "Propuesta",
    explicacion: "Evaluar horario",
    tipoAlerta: "WARNING",
    accionEjecutada: "NINGUNA",
  },
  salas: [
    {
      nombre: "Cosmos",
      capacidad: 25,
      estado: "DISPONIBLE",
      ocupanteActual: null,
      horario: null,
      nota: null,
    },
  ],
  incidenciaDetectada: {
    existe: false,
    descripcion: null,
    prioridad: "NONE",
    areaResponsable: null,
  },
};
test("n8n no acepta horas inválidas, fin anterior, salas duplicadas o incidencia incompleta", () => {
  assert.equal(
    calendarRequest.safeParse({ ...input, horaInicio: "25:00" }).success,
    false,
  );
  assert.equal(
    calendarRequest.safeParse({ ...input, horaFinSolicitada: "09:00" }).success,
    false,
  );
  assert.equal(
    calendarResponse.safeParse({
      ...valid,
      salas: [...valid.salas, ...valid.salas],
    }).success,
    false,
  );
  assert.equal(
    calendarResponse.safeParse({
      ...valid,
      incidenciaDetectada: {
        existe: true,
        descripcion: null,
        prioridad: "NONE",
        areaResponsable: null,
      },
    }).success,
    false,
  );
});
test("adaptador mantiene identidad del servidor y nunca afirma ejecutar una propuesta", async () => {
  process.env.N8N_WEBHOOK_URL =
    "https://workflow.example.test/webhook/campusflow";
  process.env.N8N_MODE = "proposal";
  let payload: Record<string, unknown> = {};
  const stub = (async (_url, init) => {
    payload = JSON.parse(String(init?.body));
    return new Response(JSON.stringify(valid));
  }) as typeof fetch;
  const result = await requestCalendarProposal(
    input,
    "server-actor",
    "request-1",
    [{ name: "Cosmos", capacity: 25, status: "DISABLED" }],
    stub,
  );
  assert.equal(payload.usuario, "server-actor");
  assert.equal(payload.modo, "PROPUESTA");
  assert.equal(result.execution, "NOT_APPLIED");
  assert.equal(result.warnings.length, 1);
  await assert.rejects(
    () =>
      requestCalendarProposal(
        input,
        "actor",
        "id",
        [{ name: "Cosmos", capacity: 30, status: "AVAILABLE" }],
        stub,
      ),
    (e: unknown) =>
      e instanceof WorkflowUnavailable && e.code === "N8N_INVALID_RESPONSE",
  );
});

test("n8n: configuración ausente o inválida falla sin llamar al proveedor", async () => {
  const before = {
    url: process.env.N8N_WEBHOOK_URL,
    mode: process.env.N8N_MODE,
    node: process.env.NODE_ENV,
  };
  let calls = 0;
  const provider = (async () => {
    calls++;
    return new Response(JSON.stringify(valid));
  }) as typeof fetch;
  const catalog = [{ name: "Cosmos", capacity: 25, status: "AVAILABLE" }];
  const check = (code: string) =>
    assert.rejects(
      () => requestCalendarProposal(input, "actor", "id", catalog, provider),
      (error: unknown) =>
        error instanceof WorkflowUnavailable && error.code === code,
    );
  try {
    delete process.env.N8N_WEBHOOK_URL;
    process.env.N8N_MODE = "proposal";
    await check("N8N_NOT_CONFIGURED");
    process.env.N8N_WEBHOOK_URL = "https://workflow.example.test/webhook";
    process.env.N8N_MODE = "execute";
    await check("N8N_NOT_CONFIGURED");
    process.env.N8N_MODE = "proposal";
    process.env.N8N_WEBHOOK_URL = "invalid url";
    await check("N8N_INVALID_CONFIG");
    process.env.NODE_ENV = "production";
    process.env.N8N_WEBHOOK_URL = "http://127.0.0.1/webhook";
    await check("N8N_INVALID_CONFIG");
    assert.equal(calls, 0);
  } finally {
    for (const [name, value] of [
      ["N8N_WEBHOOK_URL", before.url],
      ["N8N_MODE", before.mode],
      ["NODE_ENV", before.node],
    ] as const) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});

test("n8n: errores de red, HTTP, JSON y catálogo nunca se presentan como ejecución", async () => {
  process.env.N8N_WEBHOOK_URL = "https://workflow.example.test/webhook";
  process.env.N8N_MODE = "proposal";
  const catalog = [{ name: "Cosmos", capacity: 25, status: "AVAILABLE" }];
  const cases: [typeof fetch, string][] = [
    [
      (async () => {
        throw new Error("timeout");
      }) as typeof fetch,
      "N8N_UNAVAILABLE",
    ],
    [
      (async () =>
        new Response("unavailable", { status: 503 })) as typeof fetch,
      "N8N_PROVIDER_ERROR",
    ],
    [
      (async () => new Response("<html>error</html>")) as typeof fetch,
      "N8N_INVALID_RESPONSE",
    ],
    [
      (async () =>
        new Response(
          JSON.stringify({
            ...valid,
            salas: [{ ...valid.salas[0], nombre: "Sala desconocida" }],
          }),
        )) as typeof fetch,
      "N8N_INVALID_RESPONSE",
    ],
    [
      (async () =>
        new Response(JSON.stringify({ ...valid, salas: [] }))) as typeof fetch,
      "N8N_INVALID_RESPONSE",
    ],
  ];
  for (const [provider, code] of cases)
    await assert.rejects(
      () => requestCalendarProposal(input, "actor", "id", catalog, provider),
      (error: unknown) =>
        error instanceof WorkflowUnavailable && error.code === code,
    );
  assert.equal(
    calendarRequest.safeParse({
      ...input,
      usuario: "forged",
      authorization: "ADMIN",
    }).success,
    false,
  );
  assert.equal(
    calendarRequest.safeParse({ ...input, fecha: "2026-02-30" }).success,
    false,
  );
});
