import assert from "node:assert/strict";
import test from "node:test";
import {
  agendaRequest,
  requestAgenda,
  WorkflowUnavailable,
} from "../src/integrations/n8n.js";

const catalog = [{ name: "Cosmos", capacity: 25, status: "AVAILABLE" }];
const response = (ejecucion?: string) => ({
  status: "success",
  ...(ejecucion ? { ejecucion } : {}),
  decisionIA: {
    titulo: "Reserva confirmada",
    explicacion: "Cosmos reservada.",
    tipoAlerta: "SUCCESS",
    accionEjecutada: "RESERVA_CREADA",
  },
  interpretacionIA: { intencion: "RESERVA", modelo: null },
  salas: [
    {
      nombre: "Cosmos",
      capacidad: 25,
      estado: "OCUPADO",
      ocupanteActual: "ana",
      horario: "10:00 - 11:00",
      nota: null,
    },
  ],
  incidenciaDetectada: {
    existe: false,
    descripcion: null,
    prioridad: "NONE",
    areaResponsable: null,
  },
});
const body = { reporte: "Reserva Cosmos mañana", rol: "DOCENTE" as const };

function setup(mode: string) {
  process.env.N8N_WEBHOOK_URL = "https://workflow.example.test/webhook/cf";
  process.env.N8N_MODE = mode;
}

test("el asistente acepta texto libre; hora fin debe ser posterior al inicio", () => {
  assert.equal(agendaRequest.safeParse(body).success, true);
  assert.equal(agendaRequest.parse(body).modo, "PROPUESTA");
  assert.equal(
    agendaRequest.safeParse({
      ...body,
      horaInicio: "11:00",
      horaFinSolicitada: "10:00",
    }).success,
    false,
  );
  assert.equal(
    agendaRequest.safeParse({ ...body, reporte: "hola" }).success,
    false,
  );
  assert.equal(
    agendaRequest.safeParse({ ...body, rol: "ADMIN" }).success,
    false,
  );
  assert.equal(
    agendaRequest.safeParse({ ...body, extra: "no permitido" }).success,
    false,
  );
});

test("EJECUCION exige N8N_MODE=execute; en proposal se rechaza sin llamar a n8n", async () => {
  setup("proposal");
  let called = false;
  const stub = (async () => {
    called = true;
    return new Response(JSON.stringify(response("APLICADA")));
  }) as typeof fetch;
  await assert.rejects(
    () =>
      requestAgenda(
        { ...body, modo: "EJECUCION" },
        { actorId: "uuid", requestId: "r", catalog, request: stub },
      ),
    (e: unknown) =>
      e instanceof WorkflowUnavailable && e.code === "N8N_EXECUTION_DISABLED",
  );
  assert.equal(called, false);
});

test("en execute el resultado solo es APPLIED si n8n lo informa; la identidad es el UUID del servidor", async () => {
  setup("execute");
  let payload: Record<string, unknown> = {};
  let headers: Record<string, string> = {};
  const stub = (ejecucion?: string) =>
    (async (_url, init) => {
      payload = JSON.parse(String(init?.body));
      headers = init?.headers as Record<string, string>;
      return new Response(JSON.stringify(response(ejecucion)));
    }) as typeof fetch;
  const call = (
    ejecucion?: string,
    modo: "PROPUESTA" | "EJECUCION" = "EJECUCION",
  ) =>
    requestAgenda(
      { ...body, modo },
      {
        actorId: "uuid-del-token",
        displayName: "tomas",
        requestId: "r",
        catalog,
        request: stub(ejecucion),
      },
    );
  assert.equal((await call("APLICADA")).execution, "APPLIED");
  assert.equal(payload.usuario, "uuid-del-token");
  assert.equal(payload.modo, "EJECUCION");
  assert.equal(headers["X-CampusFlow-Mode"], "execute");
  assert.equal((await call("SIN_CAMBIOS")).execution, "NO_CHANGES");
  assert.equal((await call(undefined)).execution, "NOT_REPORTED");
  // Una propuesta nunca se presenta como aplicada, aunque el proveedor lo afirme.
  assert.equal((await call("APLICADA", "PROPUESTA")).execution, "NOT_APPLIED");
});

test("respuesta de n8n con campos desconocidos o catálogo distinto se rechaza", async () => {
  setup("execute");
  const bad = (payload: unknown) =>
    (async () => new Response(JSON.stringify(payload))) as typeof fetch;
  for (const payload of [
    { ...response("APLICADA"), inyectado: true },
    {
      ...response("APLICADA"),
      salas: [{ ...response().salas[0], capacidad: 99 }],
    },
  ]) {
    await assert.rejects(
      () =>
        requestAgenda(
          { ...body, modo: "EJECUCION" },
          { actorId: "u", requestId: "r", catalog, request: bad(payload) },
        ),
      (e: unknown) =>
        e instanceof WorkflowUnavailable && e.code === "N8N_INVALID_RESPONSE",
    );
  }
});
