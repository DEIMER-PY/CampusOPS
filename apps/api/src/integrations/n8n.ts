import { z } from "zod";
export const calendarRequest = z
  .strictObject({
    reporte: z.string().trim().min(15).max(4000),
    rol: z.enum(["DOCENTE", "COMERCIAL", "ADMINISTRATIVO"]),
    fecha: z.iso.date(),
    salaActual: z.string().trim().min(1).max(80),
    asistentes: z.number().int().positive().max(100),
    horaInicio: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    horaFinSolicitada: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  })
  .refine((v) => v.horaFinSolicitada > v.horaInicio, {
    message: "El fin debe ser posterior al inicio dentro de la misma fecha.",
  });
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const agendaRequest = z
  .strictObject({
    reporte: z.string().trim().min(5).max(4000),
    rol: z.enum(["DOCENTE", "COMERCIAL", "ADMINISTRATIVO"]),
    modo: z.enum(["PROPUESTA", "EJECUCION"]).default("PROPUESTA"),
    fecha: z.iso.date().optional(),
    salaActual: z.string().trim().min(1).max(80).optional(),
    asistentes: z.number().int().positive().max(100).optional(),
    horaInicio: hhmm.optional(),
    horaFinSolicitada: hhmm.optional(),
  })
  .refine(
    (v) =>
      !v.horaInicio ||
      !v.horaFinSolicitada ||
      v.horaFinSolicitada > v.horaInicio,
    {
      message: "El fin debe ser posterior al inicio dentro de la misma fecha.",
    },
  );
const room = z.strictObject({
  nombre: z.string().min(1).max(80),
  capacidad: z.number().int().positive().max(10000),
  estado: z.enum(["DISPONIBLE", "OCUPADO", "REUBICADO_IA", "MANTENIMIENTO"]),
  ocupanteActual: z.string().max(300).nullable(),
  horario: z.string().max(100).nullable(),
  nota: z.string().max(500).nullable(),
});
export const calendarResponse = z
  .strictObject({
    status: z.literal("success"),
    decisionIA: z.strictObject({
      titulo: z.string().min(1).max(200),
      explicacion: z.string().min(1).max(3000),
      tipoAlerta: z.enum(["SUCCESS", "WARNING", "ERROR"]),
      accionEjecutada: z.string().min(1).max(100),
    }),
    ejecucion: z.enum(["APLICADA", "NO_APLICADA", "SIN_CAMBIOS"]).optional(),
    interpretacionIA: z
      .strictObject({
        intencion: z.string().max(40),
        modelo: z.string().max(100).nullable(),
      })
      .nullable()
      .optional(),
    salas: z.array(room).min(1).max(50),
    incidenciaDetectada: z.strictObject({
      existe: z.boolean(),
      descripcion: z.string().max(2000).nullable(),
      prioridad: z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"]),
      areaResponsable: z.string().max(150).nullable(),
    }),
  })
  .superRefine((v, ctx) => {
    if (new Set(v.salas.map((r) => r.nombre)).size !== v.salas.length)
      ctx.addIssue({ code: "custom", message: "Salas duplicadas." });
    if (
      v.incidenciaDetectada.existe &&
      (v.incidenciaDetectada.prioridad === "NONE" ||
        !v.incidenciaDetectada.descripcion ||
        !v.incidenciaDetectada.areaResponsable)
    )
      ctx.addIssue({ code: "custom", message: "Incidencia incompleta." });
  });
export class WorkflowUnavailable extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}
type AgendaContext = {
  actorId: string;
  displayName?: string;
  requestId: string;
  catalog: { name: string; capacity: number; status: string }[];
  request?: typeof fetch;
};
export type AgendaExecution =
  | "APPLIED"
  | "NOT_APPLIED"
  | "NO_CHANGES"
  | "NOT_REPORTED";
// N8N_MODE=proposal: n8n solo propone. N8N_MODE=execute: además puede aplicar (EJECUCION) mediante
// las funciones auditadas de la base; el cambio solo se confirma si n8n informa ejecucion=APLICADA.
export async function requestAgenda(
  input: z.infer<typeof agendaRequest>,
  { actorId, displayName, requestId, catalog, request = fetch }: AgendaContext,
) {
  const webhook = process.env.N8N_WEBHOOK_URL;
  const configured = process.env.N8N_MODE;
  if (!webhook || !["proposal", "execute"].includes(configured ?? ""))
    throw new WorkflowUnavailable("N8N_NOT_CONFIGURED");
  if (input.modo === "EJECUCION" && configured !== "execute")
    throw new WorkflowUnavailable("N8N_EXECUTION_DISABLED");
  let url: URL;
  try {
    url = new URL(webhook);
  } catch {
    throw new WorkflowUnavailable("N8N_INVALID_CONFIG");
  }
  if (
    url.protocol !== "https:" &&
    !(
      process.env.NODE_ENV !== "production" &&
      ["localhost", "127.0.0.1"].includes(url.hostname)
    )
  )
    throw new WorkflowUnavailable("N8N_INVALID_CONFIG");
  let response: Response;
  try {
    response = await request(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Request-Id": requestId,
        "X-CampusFlow-Mode":
          input.modo === "EJECUCION" ? "execute" : "proposal",
        ...(process.env.N8N_WEBHOOK_SECRET
          ? { Authorization: `Bearer ${process.env.N8N_WEBHOOK_SECRET}` }
          : {}),
      },
      signal: AbortSignal.timeout(30_000),
      redirect: "error",
      body: JSON.stringify({
        ...input,
        usuario: displayName || actorId,
        zonaHoraria: "America/Bogota",
      }),
    });
  } catch {
    throw new WorkflowUnavailable("N8N_UNAVAILABLE");
  }
  if (!response.ok) throw new WorkflowUnavailable("N8N_PROVIDER_ERROR");
  try {
    const text = await response.text();
    if (text.length > 128_000) throw new Error("Oversize");
    const proposal = calendarResponse.parse(JSON.parse(text));
    const known = new Map(catalog.map((s) => [s.name, s]));
    if (
      proposal.salas.some(
        (s) =>
          !known.has(s.nombre) || known.get(s.nombre)?.capacity !== s.capacidad,
      )
    )
      throw new Error("Invalid catalog");
    if (proposal.salas.length !== catalog.length)
      throw new Error("Incomplete catalog");
    const reported = proposal.ejecucion;
    const execution: AgendaExecution =
      input.modo === "PROPUESTA" || reported === "NO_APLICADA"
        ? "NOT_APPLIED"
        : reported === "APLICADA"
          ? "APPLIED"
          : reported === "SIN_CAMBIOS"
            ? "NO_CHANGES"
            : "NOT_REPORTED";
    return {
      proposal,
      execution,
      requestId,
      receivedAt: new Date().toISOString(),
      warnings:
        input.modo === "PROPUESTA"
          ? proposal.salas
              .filter(
                (s) =>
                  ["DISPONIBLE", "REUBICADO_IA"].includes(s.estado) &&
                  known.get(s.nombre)?.status !== "AVAILABLE",
              )
              .map(
                (s) =>
                  `${s.nombre}: requiere habilitación y validación de conflictos antes de asignar.`,
              )
          : [],
    };
  } catch {
    throw new WorkflowUnavailable("N8N_INVALID_RESPONSE");
  }
}
export async function requestCalendarProposal(
  input: z.infer<typeof calendarRequest>,
  actorId: string,
  requestId: string,
  catalog: { name: string; capacity: number; status: string }[],
  request: typeof fetch = fetch,
) {
  // /api/calendar/proposals sigue siendo solo-propuesta: exige N8N_MODE=proposal exacto (contrato de Deimer).
  if (process.env.N8N_MODE !== "proposal")
    throw new WorkflowUnavailable("N8N_NOT_CONFIGURED");
  return requestAgenda(
    { ...input, modo: "PROPUESTA" },
    { actorId, requestId, catalog, request },
  );
}
