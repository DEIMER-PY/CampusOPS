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
