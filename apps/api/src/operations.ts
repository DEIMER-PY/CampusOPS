import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { campusContext } from "./ai/context.js";
import { AIUnavailable, classifyIncident } from "./ai/triage.js";
import {
  canManageOperations,
  canViewAllIncidents,
  canViewAllLoans,
  canViewAllReservations,
} from "./auth.js";
import { database } from "./db.js";
import {
  agendaRequest,
  calendarRequest,
  requestAgenda,
  requestCalendarProposal,
  WorkflowUnavailable,
} from "./integrations/n8n.js";

export const operations = Router();
const id = (value: unknown) => z.uuid().parse(value);
const incidentInput = z.strictObject({
  description: z.string().trim().min(15).max(4000),
});
const statusInput = z.strictObject({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]),
});
const assetInput = z.strictObject({
  status: z.enum(["AVAILABLE", "DISABLED", "MAINTENANCE"]),
});
const privileged = (role: string) => canManageOperations(role);
const incidentScope = (actor: { id: string; role: string }) =>
  canViewAllIncidents(actor.role) ? {} : { userId: actor.id };
const loanScope = (actor: { id: string; role: string }) =>
  canViewAllLoans(actor.role) ? {} : { userId: actor.id };
const reservationScope = (actor: { id: string; role: string }) =>
  canViewAllReservations(actor.role) ? {} : { userId: actor.id };
const missing = {
  error: {
    code: "NOT_FOUND",
    message: "No se encontró la solicitud o no tienes acceso.",
  },
};
const forbidden = {
  error: {
    code: "FORBIDDEN",
    message: "Necesitas un perfil de administración u operación.",
  },
};
const aiLimit = rateLimit({
  windowMs: 60_000,
  limit: 8,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (_req, res) => res.locals.actor.id,
  message: {
    error: {
      code: "AI_RATE_LIMIT",
      message: "Espera un minuto antes de solicitar más análisis.",
    },
  },
});

operations.get("/incidents", async (_req, res) => {
  res.json({
    data: await database().incident.findMany({
      omit: { evidence: true },
      where: incidentScope(res.locals.actor),
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  });
});
operations.post("/incidents", async (req, res) => {
  const input = incidentInput.parse(req.body);
  const actor = res.locals.actor;
  const record = await database().$transaction(async (tx) => {
    const incident = await tx.incident.create({
      data: { ...input, userId: actor.id },
    });
    await tx.auditEvent.create({
      data: {
        actorId: actor.id,
        entityId: incident.id,
        action: "incident.created",
      },
    });
    return incident;
  });
  // Persistence comes first. A failed provider request never loses the report.
  res.status(201).json({ data: record });
});
operations.post("/incidents/:id/triage", aiLimit, async (req, res) => {
  const incidentId = id(req.params.id);
  const actor = res.locals.actor;
  const db = database();
  const incident = await db.incident.findFirst({
    where: { id: incidentId, ...incidentScope(actor) },
  });
  if (!incident) {
    res.status(404).json(missing);
    return;
  }
  if (incident.aiStatus === "COMPLETE") {
    res.json({ data: incident });
    return;
  }
  const started = new Date();
  const claim = await db.incident.updateMany({
    where: {
      id: incidentId,
      OR: [
        { aiStatus: { in: ["PENDING", "FAILED"] } },
        {
          aiStatus: "PROCESSING",
          aiStartedAt: { lt: new Date(Date.now() - 60_000) },
        },
      ],
    },
    data: { aiStatus: "PROCESSING", aiStartedAt: started, aiError: null },
  });
  if (!claim.count) {
    res.status(409).json({
      error: {
        code: "AI_PROCESSING",
        message: "El análisis ya está en curso. Actualiza en unos segundos.",
      },
    });
    return;
  }
  try {
    const context = await campusContext();
    const triage = await classifyIncident(incident.description, fetch, context);
    await db.$transaction(async (tx) => {
      const saved = await tx.incident.updateMany({
        where: { id: incidentId, aiStatus: "PROCESSING", aiStartedAt: started },
        data: { aiStatus: "COMPLETE", triage },
      });
      if (saved.count)
        await tx.auditEvent.create({
          data: {
            actorId: actor.id,
            entityId: incidentId,
            action: "incident.triaged",
          },
        });
    });
    res.json({
      data: await db.incident.findUnique({ where: { id: incidentId } }),
    });
  } catch (error) {
    const code =
      error instanceof AIUnavailable ? error.code : "AI_PROVIDER_ERROR";
    await db.$transaction(async (tx) => {
      const saved = await tx.incident.updateMany({
        where: { id: incidentId, aiStatus: "PROCESSING", aiStartedAt: started },
        data: { aiStatus: "FAILED", aiError: code },
      });
      if (saved.count)
        await tx.auditEvent.create({
          data: {
            actorId: actor.id,
            entityId: incidentId,
            action: "incident.triage_failed",
          },
        });
    });
    res.status(503).json({
      error: {
        code,
        message:
          "El reporte está guardado. El análisis no se completó; puedes reintentarlo.",
      },
    });
  }
});
operations.patch("/incidents/:id", async (req, res) => {
  if (!privileged(res.locals.actor.role)) {
    res.status(403).json(forbidden);
    return;
  }
  const incidentId = id(req.params.id);
  const input = statusInput.parse(req.body);
  const result = await database().$transaction(async (tx) => {
    const updated = await tx.incident.updateMany({
      where: { id: incidentId },
      data: input,
    });
    if (updated.count)
      await tx.auditEvent.create({
        data: {
          actorId: res.locals.actor.id,
          entityId: incidentId,
          action: `incident.${input.status.toLowerCase()}`,
        },
      });
    return updated.count;
  });
  res
    .status(result ? 200 : 404)
    .json(result ? { data: { id: incidentId, ...input } } : missing);
});
operations.get("/resources", async (_req, res) => {
  res.json({
    data: await database().resource.findMany({
      orderBy: { name: "asc" },
      include: {
        loans: { where: { returnedAt: null }, select: { id: true }, take: 1 },
      },
    }),
  });
});
operations.post("/resources", async (req, res) => {
  if (!privileged(res.locals.actor.role)) {
    res.status(403).json(forbidden);
    return;
  }
  const input = z
    .strictObject({
      code: z.string().trim().min(2).max(50),
      name: z.string().trim().min(2).max(150),
      source: z.string().trim().min(3).max(300),
      status: z.enum(["AVAILABLE", "DISABLED", "MAINTENANCE"]),
    })
    .parse(req.body);
  const resource = await database().$transaction(async (tx) => {
    const record = await tx.resource.create({ data: input });
    await tx.auditEvent.create({
      data: {
        actorId: res.locals.actor.id,
        entityId: record.id,
        action: "resource.created",
      },
    });
    return record;
  });
  res.status(201).json({ data: resource });
});
operations.patch("/resources/:id", async (req, res) => {
  if (!privileged(res.locals.actor.role)) {
    res.status(403).json(forbidden);
    return;
  }
  const resourceId = id(req.params.id);
  const input = assetInput.parse(req.body);
  const result = await database().$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM app_private."Resource" WHERE id = ${resourceId}::uuid FOR UPDATE`;
    const updated = await tx.resource.updateMany({
      where: { id: resourceId },
      data: input,
    });
    if (updated.count)
      await tx.auditEvent.create({
        data: {
          actorId: res.locals.actor.id,
          entityId: resourceId,
          action: `resource.${input.status.toLowerCase()}`,
        },
      });
    return updated.count;
  });
  res
    .status(result ? 200 : 404)
    .json(result ? { data: { id: resourceId, ...input } } : missing);
});
operations.patch("/spaces/:id", async (req, res) => {
  if (!privileged(res.locals.actor.role)) {
    res.status(403).json(forbidden);
    return;
  }
  const spaceId = id(req.params.id);
  const input = assetInput.parse(req.body);
  const result = await database().$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM app_private."Space" WHERE id = ${spaceId}::uuid FOR UPDATE`;
    const updated = await tx.space.updateMany({
      where: { id: spaceId },
      data: input,
    });
    if (updated.count)
      await tx.auditEvent.create({
        data: {
          actorId: res.locals.actor.id,
          entityId: spaceId,
          action: `space.${input.status.toLowerCase()}`,
        },
      });
    return updated.count;
  });
  res
    .status(result ? 200 : 404)
    .json(result ? { data: { id: spaceId, ...input } } : missing);
});
operations.get("/loans", async (_req, res) => {
  res.json({
    data: await database().loan.findMany({
      where: loanScope(res.locals.actor),
      include: { resource: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  });
});
operations.post("/loans", async (req, res) => {
  const { resourceId } = z
    .strictObject({ resourceId: z.uuid() })
    .parse(req.body);
  const actor = res.locals.actor;
  const result = await database().$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM app_private."Resource" WHERE id = ${resourceId}::uuid FOR UPDATE`;
    const resource = await tx.resource.findUnique({
      where: { id: resourceId },
    });
    if (
      resource?.status !== "AVAILABLE" ||
      (await tx.loan.findFirst({ where: { resourceId, returnedAt: null } }))
    )
      return null;
    const loan = await tx.loan.create({
      data: { resourceId, userId: actor.id },
    });
    await tx.auditEvent.create({
      data: { actorId: actor.id, entityId: loan.id, action: "loan.created" },
    });
    return loan;
  });
  if (!result) {
    res.status(409).json({
      error: {
        code: "RESOURCE_UNAVAILABLE",
        message: "El recurso ya no está disponible. Actualiza la lista.",
      },
    });
    return;
  }
  res.status(201).json({ data: result });
});
operations.post("/loans/:id/return", async (req, res) => {
  if (!privileged(res.locals.actor.role)) {
    res.status(403).json(forbidden);
    return;
  }
  const loanId = id(req.params.id);
  const result = await database().$transaction(async (tx) => {
    const record = await tx.loan.findUnique({ where: { id: loanId } });
    if (!record) return null;
    await tx.$queryRaw`SELECT id FROM app_private."Resource" WHERE id = ${record.resourceId}::uuid FOR UPDATE`;
    const changed = await tx.loan.updateMany({
      where: { id: loanId, returnedAt: null },
      data: { returnedAt: new Date() },
    });
    if (changed.count)
      await tx.auditEvent.create({
        data: {
          actorId: res.locals.actor.id,
          entityId: loanId,
          action: "loan.returned",
        },
      });
    return tx.loan.findUnique({ where: { id: loanId } });
  });
  res.status(result ? 200 : 404).json(result ? { data: result } : missing);
});
operations.post("/reservations/:id/cancel", async (req, res) => {
  const reservationId = id(req.params.id);
  const actor = res.locals.actor;
  const result = await database().$transaction(async (tx) => {
    const record = await tx.reservation.findFirst({
      where: { id: reservationId, ...reservationScope(actor) },
    });
    if (!record) return null;
    await tx.$queryRaw`SELECT id FROM app_private."Space" WHERE id = ${record.spaceId}::uuid FOR UPDATE`;
    const changed = await tx.reservation.updateMany({
      where: { id: reservationId, cancelledAt: null },
      data: { cancelledAt: new Date() },
    });
    if (changed.count)
      await tx.auditEvent.create({
        data: {
          actorId: actor.id,
          entityId: reservationId,
          action: "reservation.cancelled",
        },
      });
    return tx.reservation.findUnique({ where: { id: reservationId } });
  });
  res.status(result ? 200 : 404).json(result ? { data: result } : missing);
});

operations.post("/calendar/proposals", aiLimit, async (req, res) => {
  if (!privileged(res.locals.actor.role)) {
    res.status(403).json(forbidden);
    return;
  }
  const input = calendarRequest.parse(req.body);
  const catalog = await database().space.findMany({
    select: { name: true, capacity: true, status: true },
  });
  if (
    !catalog.some(
      (s) =>
        s.name === input.salaActual &&
        s.capacity >= input.asistentes &&
        s.status === "AVAILABLE",
    )
  ) {
    res.status(409).json({
      error: {
        code: "SPACE_UNAVAILABLE",
        message:
          "Revisa el aforo y la habilitación del espacio antes de solicitar una propuesta.",
      },
    });
    return;
  }
  try {
    const result = await requestCalendarProposal(
      input,
      res.locals.actor.id,
      res.locals.requestId,
      catalog,
    );
    res.json({ data: result });
  } catch (error) {
    if (!(error instanceof WorkflowUnavailable)) throw error;
    res.status(error.code === "N8N_INVALID_RESPONSE" ? 502 : 503).json({
      error: {
        code: error.code,
        message:
          "No se obtuvo una propuesta válida de n8n. No se aplicaron cambios en CampusFlow.",
      },
    });
  }
});

// Asistente de agenda: n8n interpreta el texto (IA) y las reglas deterministas deciden. PROPUESTA no escribe;
// EJECUCION aplica por las funciones auditadas de la base y exige N8N_MODE=execute. Solo ADMIN/OPERATOR.
operations.get("/agenda/status", (_req, res) => {
  if (!privileged(res.locals.actor.role)) {
    res.status(403).json(forbidden);
    return;
  }
  const mode = process.env.N8N_MODE;
  let validUrl = false;
  try {
    const url = new URL(process.env.N8N_WEBHOOK_URL || "");
    validUrl =
      url.protocol === "https:" ||
      (process.env.NODE_ENV !== "production" &&
        ["localhost", "127.0.0.1"].includes(url.hostname));
  } catch {
    /* No secrets or URLs are returned to the browser. */
  }
  const configured = validUrl && ["proposal", "execute"].includes(mode || "");
  res.json({
    data: { configured, executionEnabled: configured && mode === "execute" },
  });
});
operations.post("/agenda/assistant", aiLimit, async (req, res) => {
  if (!privileged(res.locals.actor.role)) {
    res.status(403).json(forbidden);
    return;
  }
  const input = agendaRequest.parse(req.body);
  const catalog = await database().space.findMany({
    select: { name: true, capacity: true, status: true },
  });
  try {
    const result = await requestAgenda(input, {
      actorId: res.locals.actor.id,
      requestId: res.locals.requestId,
      catalog,
    });
    res.json({ data: result });
  } catch (error) {
    if (!(error instanceof WorkflowUnavailable)) throw error;
    const disabled = error.code === "N8N_EXECUTION_DISABLED";
    res
      .status(
        disabled ? 409 : error.code === "N8N_INVALID_RESPONSE" ? 502 : 503,
      )
      .json({
        error: {
          code: error.code,
          message: disabled
            ? "La aplicación directa está desactivada. Solicita una propuesta; un administrador debe configurar la ejecución."
            : input.modo === "EJECUCION"
              ? "No se pudo confirmar el resultado de n8n. Revisa reservas, incidencias y auditoría antes de repetir: el cambio podría haberse guardado."
              : "No se obtuvo una propuesta válida de n8n. Revisa la configuración e inténtalo de nuevo.",
        },
      });
  }
});
