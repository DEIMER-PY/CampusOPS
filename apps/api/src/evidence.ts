import { createHash } from "node:crypto";
import { json, Router } from "express";
import { rateLimit } from "express-rate-limit";
import sharp from "sharp";
import { z } from "zod";
import { inspectEquipment } from "./ai/vision.js";
import { database } from "./db.js";
import { notifyIncident } from "./integrations/email.js";

export const evidenceRoutes = Router();
const limiter = rateLimit({
  windowMs: 60000,
  limit: 5,
  keyGenerator: (_req, res) => res.locals.actor.id,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});
const scope = (actor: { id: string; role: string }) =>
  actor.role === "CLIENT" ? { userId: actor.id } : {};
const missing = {
  error: {
    code: "NOT_FOUND",
    message: "No se encontró el reporte o no tienes acceso.",
  },
};
const uuid = (v: unknown) => z.uuid().parse(v);
const upload = z.strictObject({
  assetCode: z.string().trim().min(1).max(80),
  image: z
    .string()
    .max(1500000)
    .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/),
});
evidenceRoutes.post(
  "/incidents/:id/evidence",
  limiter,
  json({ limit: "1600kb" }),
  async (req, res) => {
    const incidentId = uuid(req.params.id),
      actor = res.locals.actor;
    const db = database();
    const incident = await db.incident.findFirst({
      where: { id: incidentId, ...scope(actor) },
    });
    if (!incident) {
      res.status(404).json(missing);
      return;
    }
    const input = upload.parse(req.body);
    const resource = await db.resource.findFirst({
      where: { code: { equals: input.assetCode, mode: "insensitive" } },
    });
    if (!resource) {
      res.status(409).json({
        error: {
          code: "ASSET_NOT_FOUND",
          message:
            "Registra primero el código del equipo en Recursos para vincular su evidencia.",
        },
      });
      return;
    }
    const bytes = Buffer.from(input.image.split(",")[1], "base64");
    if (bytes.length > 1000000) {
      res
        .status(413)
        .json({ error: { message: "La imagen debe pesar como máximo 1 MB." } });
      return;
    }
    let normalized: Buffer;
    try {
      const metadata = await sharp(bytes, {
        limitInputPixels: 12000000,
      }).metadata();
      if (
        !["jpeg", "png", "webp"].includes(metadata.format ?? "") ||
        (metadata.pages ?? 1) > 1
      )
        throw new Error();
      normalized = await sharp(bytes, { limitInputPixels: 12000000 })
        .rotate()
        .resize({
          width: 1200,
          height: 1200,
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80 })
        .toBuffer();
    } catch {
      res.status(400).json({
        error: {
          message:
            "Usa una foto JPEG, PNG o WebP válida de hasta 12 megapíxeles.",
        },
      });
      return;
    }
    const evidence = {
      image: `data:image/jpeg;base64,${normalized.toString("base64")}`,
      sha256: createHash("sha256").update(normalized).digest("hex"),
      uploadedAt: new Date().toISOString(),
    };
    const saved = await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM app_private."Incident" WHERE id=${incidentId}::uuid FOR UPDATE`;
      const current = await tx.incident.findUnique({
        where: { id: incidentId },
      });
      if (current?.evidence) return false;
      await tx.incident.update({
        where: { id: incidentId },
        data: { assetCode: resource.code, evidence, visionStatus: "PENDING" },
      });
      await tx.auditEvent.create({
        data: {
          actorId: actor.id,
          entityId: incidentId,
          action: "incident.evidence_uploaded",
        },
      });
      return true;
    });
    if (!saved) {
      res.status(409).json({
        error: {
          message:
            "Este reporte ya tiene evidencia. Crea otro reporte para una nueva fotografía.",
        },
      });
      return;
    }
    res.status(201).json({
      data: {
        assetCode: resource.code,
        visionStatus: "PENDING",
        sha256: evidence.sha256,
      },
    });
  },
);
evidenceRoutes.get("/incidents/:id/evidence", async (req, res) => {
  const record = await database().incident.findFirst({
    where: { id: uuid(req.params.id), ...scope(res.locals.actor) },
    select: { evidence: true, assetCode: true },
  });
  res.status(record ? 200 : 404).json(record ? { data: record } : missing);
});
evidenceRoutes.post("/incidents/:id/vision", limiter, async (req, res) => {
  const incidentId = uuid(req.params.id),
    actor = res.locals.actor,
    db = database();
  const record = await db.incident.findFirst({
    where: { id: incidentId, ...scope(actor) },
  });
  if (!record) {
    res.status(404).json(missing);
    return;
  }
  if (record.visionStatus === "COMPLETE") {
    res.json({ data: record.visual });
    return;
  }
  const image = z.object({ image: z.string() }).safeParse(record.evidence);
  if (!image.success || !record.assetCode) {
    res.status(409).json({
      error: {
        message:
          "Adjunta una foto y vincula el código del equipo antes de analizar.",
      },
    });
    return;
  }
  const started = new Date();
  const claim = await db.incident.updateMany({
    where: {
      id: incidentId,
      OR: [
        { visionStatus: { in: ["PENDING", "FAILED"] } },
        {
          visionStatus: "PROCESSING",
          visionStartedAt: { lt: new Date(Date.now() - 60000) },
        },
      ],
    },
    data: { visionStatus: "PROCESSING", visionStartedAt: started },
  });
  if (!claim.count) {
    res
      .status(409)
      .json({ error: { message: "El análisis visual ya está en curso." } });
    return;
  }
  try {
    const visual = await inspectEquipment(
      record.assetCode,
      record.description,
      image.data.image,
    );
    await db.$transaction(async (tx) => {
      const saved = await tx.incident.updateMany({
        where: {
          id: incidentId,
          visionStatus: "PROCESSING",
          visionStartedAt: started,
        },
        data: { visual, visionStatus: "COMPLETE" },
      });
      if (saved.count)
        await tx.auditEvent.create({
          data: {
            actorId: actor.id,
            entityId: incidentId,
            action: "incident.visual_analyzed",
          },
        });
    });
    if (
      visual.observation === "VISIBLE_DAMAGE" &&
      ["HIGH", "CRITICAL"].includes(visual.priority)
    )
      await notifyIncident(incidentId, actor.id).catch(() => undefined);
    res.json({ data: visual });
  } catch {
    await db.$transaction(async (tx) => {
      const failed = await tx.incident.updateMany({
        where: {
          id: incidentId,
          visionStatus: "PROCESSING",
          visionStartedAt: started,
        },
        data: { visionStatus: "FAILED" },
      });
      if (failed.count)
        await tx.auditEvent.create({
          data: {
            actorId: actor.id,
            entityId: incidentId,
            action: "incident.visual_failed",
          },
        });
    });
    res.status(503).json({
      error: {
        message:
          "La evidencia está guardada. No se pudo completar el análisis visual; puedes reintentarlo.",
      },
    });
  }
});
const messageSchema = z.strictObject({
  message: z.string().trim().min(2).max(1500),
});
evidenceRoutes.post("/incidents/:id/messages", async (req, res) => {
  const incidentId = uuid(req.params.id),
    actor = res.locals.actor,
    input = messageSchema.parse(req.body),
    db = database();
  const result = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM app_private."Incident" WHERE id=${incidentId}::uuid FOR UPDATE`;
    const record = await tx.incident.findFirst({
      where: { id: incidentId, ...scope(actor) },
    });
    if (!record) return null;
    const messages = z
      .array(
        z.object({
          message: z.string(),
          role: z.string(),
          createdAt: z.string(),
        }),
      )
      .catch([])
      .parse(record.communications);
    if (messages.length >= 100) return false;
    messages.push({
      message: input.message,
      role: actor.role,
      createdAt: new Date().toISOString(),
    });
    await tx.incident.update({
      where: { id: incidentId },
      data: { communications: messages },
    });
    await tx.auditEvent.create({
      data: {
        actorId: actor.id,
        entityId: incidentId,
        action: "incident.message_added",
      },
    });
    return messages;
  });
  res.status(result === null ? 404 : result === false ? 409 : 201).json(
    result === null
      ? missing
      : result === false
        ? {
            error: {
              message: "Este reporte alcanzó el límite de 100 mensajes.",
            },
          }
        : { data: result },
  );
});

evidenceRoutes.post("/incidents/:id/notify", limiter, async (req, res) => {
  const actor = res.locals.actor;
  if (!["ADMIN", "OPERATOR"].includes(actor.role)) {
    res.status(403).json({
      error: { message: "El envío manual requiere un perfil de operación." },
    });
    return;
  }
  const incidentId = uuid(req.params.id);
  const record = await database().incident.findFirst({
    where: { id: incidentId, ...scope(actor) },
    select: { id: true },
  });
  if (!record) {
    res.status(404).json(missing);
    return;
  }
  const notification = await notifyIncident(incidentId, actor.id);
  res.status(202).json({ data: notification });
});
