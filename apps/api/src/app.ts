import { randomUUID } from "node:crypto";
import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { z } from "zod";
import { authenticate } from "./auth.js";
import { database } from "./db.js";
import { hasCapacity } from "./domain/rules.js";
import { Prisma } from "./generated/prisma/client.js";
import { createLoan, returnLoan } from "./services/loans.js";

export const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: process.env.WEB_ORIGIN || "http://127.0.0.1:3000" }));
app.use(express.json({ limit: "32kb" }));
app.use((_req, res, next) => {
  res.locals.requestId = randomUUID();
  res.setHeader("X-Request-Id", res.locals.requestId);
  next();
});
app.use(
  rateLimit({
    windowMs: 60_000,
    limit: 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
);
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "campusflow-api" });
});
app.get("/ready", async (_req, res) => {
  if (!process.env.DATABASE_URL) {
    res.status(503).json({ status: "not_configured" });
    return;
  }
  try {
    await database().$queryRaw`SELECT 1`;
    res.json({ status: "ready" });
  } catch {
    res.status(503).json({ status: "unavailable" });
  }
});
app.use("/api", authenticate);
app.get("/api/me", (_req, res) => {
  res.json({ data: res.locals.actor });
});
app.get("/api/spaces", async (_req, res) => {
  res.json({
    data: await database().space.findMany({ orderBy: { name: "asc" } }),
  });
});
app.get("/api/reservations", async (_req, res) => {
  const actor = res.locals.actor;
  res.json({
    data: await database().reservation.findMany({
      where: actor.role === "CLIENT" ? { userId: actor.id } : {},
      take: 50,
      orderBy: { createdAt: "desc" },
      include: { space: true },
    }),
  });
});
const reservationInput = z
  .object({
    spaceId: z.uuid(),
    startAt: z.iso.datetime({ offset: true }),
    endAt: z.iso.datetime({ offset: true }),
    attendees: z.number().int().positive(),
    purpose: z.string().trim().min(3).max(300),
  })
  .strict()
  .refine((v) => new Date(v.endAt) > new Date(v.startAt), {
    message: "El fin debe ser posterior al inicio.",
  });
app.post("/api/reservations", async (req, res) => {
  const input = reservationInput.parse(req.body);
  const actor = res.locals.actor;
  const result = await database().$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT id FROM app_private."Space" WHERE id = ${input.spaceId}::uuid FOR UPDATE`;
      const space = await tx.space.findUnique({ where: { id: input.spaceId } });
      if (
        space?.status !== "AVAILABLE" ||
        !hasCapacity(space.capacity, input.attendees)
      )
        return null;
      const startAt = new Date(input.startAt);
      const endAt = new Date(input.endAt);
      const conflict = await tx.reservation.findFirst({
        where: {
          spaceId: space.id,
          cancelledAt: null,
          startAt: { lt: endAt },
          endAt: { gt: startAt },
        },
      });
      if (conflict) return null;
      const reservation = await tx.reservation.create({
        data: { ...input, startAt, endAt, userId: actor.id },
      });
      await tx.auditEvent.create({
        data: {
          actorId: actor.id,
          action: "reservation.created",
          entityId: reservation.id,
        },
      });
      return reservation;
    },
    { isolationLevel: "ReadCommitted" },
  );
  if (!result) {
    res.status(409).json({
      error: {
        code: "RESERVATION_CONFLICT",
        message: "Revisa aforo, estado y disponibilidad del espacio.",
      },
    });
    return;
  }
  res.status(201).json({ data: result });
});
app.get("/api/resources", async (_req, res) => {
  res.json({
    data: await database().resource.findMany({ orderBy: { name: "asc" } }),
  });
});
app.get("/api/loans", async (_req, res) => {
  const actor = res.locals.actor;
  res.json({
    data: await database().loan.findMany({
      where: actor.role === "CLIENT" ? { userId: actor.id } : {},
      take: 50,
      orderBy: { createdAt: "desc" },
      include: { resource: true },
    }),
  });
});
const loanInput = z
  .object({
    resourceId: z.uuid(),
  })
  .strict();
app.post("/api/loans", async (req, res) => {
  const input = loanInput.parse(req.body);
  const outcome = await createLoan(
    database(),
    res.locals.actor,
    input.resourceId,
  );
  if (!outcome.ok) {
    res.status(409).json({
      error: {
        code: "LOAN_CONFLICT",
        message: "Revisa el estado y la disponibilidad del recurso.",
        reason: outcome.reason,
      },
    });
    return;
  }
  res.status(201).json({ data: outcome.data });
});
const loanParams = z.object({
  id: z.uuid(),
});
const handleLoanReturn: express.RequestHandler = async (req, res) => {
  const params = loanParams.parse(req.params);
  const outcome = await returnLoan(database(), res.locals.actor, params.id);
  if (!outcome.ok) {
    if (outcome.reason === "LOAN_NOT_FOUND") {
      res.status(404).json({
        error: {
          code: "LOAN_NOT_FOUND",
          message: "Préstamo no encontrado.",
        },
      });
      return;
    }
    if (outcome.reason === "FORBIDDEN") {
      res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "No tienes permiso para devolver este préstamo.",
        },
      });
      return;
    }
    res.status(409).json({
      error: {
        code: "LOAN_ALREADY_RETURNED",
        message: "El préstamo ya fue devuelto previamente.",
      },
    });
    return;
  }
  res.json({ data: outcome.data });
};
app.post("/api/loans/:id/return", handleLoanReturn);
app.patch("/api/loans/:id/return", handleLoanReturn);
app.get("/api/admin/audit", async (_req, res) => {
  if (res.locals.actor.role !== "ADMIN") {
    res.status(403).json({
      error: {
        code: "FORBIDDEN",
        message: "Acceso administrativo requerido.",
      },
    });
    return;
  }
  res.json({
    data: await database().auditEvent.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
    }),
  });
});
app.use((_req, res) => {
  res
    .status(404)
    .json({ error: { code: "NOT_FOUND", message: "Ruta no disponible." } });
});
const errors: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof z.ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Revisa los campos enviados.",
        fields: error.issues,
      },
    });
    return;
  }
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    ["P2002", "P2004", "P2010"].includes(error.code)
  ) {
    res.status(409).json({
      error: {
        code: "DATA_CONFLICT",
        message: "La operación entra en conflicto con los datos actuales.",
      },
    });
    return;
  }
  if (error instanceof SyntaxError) {
    res
      .status(400)
      .json({ error: { code: "INVALID_JSON", message: "JSON inválido." } });
    return;
  }
  console.error(
    JSON.stringify({
      level: "error",
      requestId: res.locals.requestId,
      code: "REQUEST_FAILED",
    }),
  );
  res.status(503).json({
    error: {
      code: "SERVICE_UNAVAILABLE",
      message: "No fue posible completar la operación.",
      requestId: res.locals.requestId,
    },
  });
};
app.use(errors);
