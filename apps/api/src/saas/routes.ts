import { Router } from "express";
import { z } from "zod";
import { database } from "../db.js";
import {
  createOrganizationSchema,
  createBranchSchema,
  hasMinimumRole,
} from "../domain/tenancy.js";
import { consentInputSchema } from "../security/data-protection.js";
import {
  digitalActaInputSchema,
  generateLegalActaManifest,
} from "../security/digital-acta.js";
import {
  validateSpaceForLearningPath,
  LearningPathEnum,
} from "../domain/academic-matching.js";
import { evaluateBatchHealth } from "../domain/cmms.js";
import { checkOrganizationQuota } from "../domain/chargeback.js";

export const saasRoutes = Router();

const forbidden = {
  error: {
    code: "FORBIDDEN",
    message: "Permisos insuficientes para esta operación SaaS.",
  },
};

// 1. Listar organizaciones y sedes (Empresas aliadas y Sedes Campuslands)
saasRoutes.get("/organizations", async (_req, res) => {
  const db = database();
  const orgs = await db.organization.findMany({
    include: {
      branches: true,
      _count: { select: { spaces: true, resources: true, reservations: true } },
    },
    orderBy: { name: "asc" },
  });
  res.json({ data: orgs });
});

// 2. Crear una nueva organización o empresa aliada (SUPER_ADMIN o ADMIN)
saasRoutes.post("/organizations", async (req, res) => {
  const actor = res.locals.actor;
  if (!hasMinimumRole(actor.role, "ADMIN")) {
    res.status(403).json(forbidden);
    return;
  }
  const input = createOrganizationSchema.parse(req.body);
  const db = database();

  const org = await db.$transaction(async (tx) => {
    const created = await tx.organization.create({ data: input });
    await tx.auditEvent.create({
      data: {
        actorId: actor.id,
        action: "organization.created",
        entityId: created.id,
      },
    });
    return created;
  });

  res.status(201).json({ data: org });
});

// 3. Crear sede para una organización
saasRoutes.post("/branches", async (req, res) => {
  const actor = res.locals.actor;
  if (!hasMinimumRole(actor.role, "ADMIN")) {
    res.status(403).json(forbidden);
    return;
  }
  const input = createBranchSchema.parse(req.body);
  const db = database();

  const branch = await db.campusBranch.create({ data: input });
  res.status(201).json({ data: branch });
});

// 4. Registrar consentimiento de datos personales (Ley 1581 / Habeas Data)
saasRoutes.post("/consent", async (req, res) => {
  const actor = res.locals.actor;
  const input = consentInputSchema.parse({
    ...req.body,
    ipAddress: req.ip || undefined,
    userAgent: req.headers["user-agent"] || undefined,
  });

  const db = database();
  const consent = await db.consentLog.create({
    data: {
      userId: actor.id,
      policyVersion: input.policyVersion,
      acceptedPurposes: input.acceptedPurposes,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      isMinor: input.isMinor,
      guardianEmail: input.guardianEmail,
      guardianConsentAt: input.isMinor ? new Date() : null,
    },
  });

  res.status(201).json({ data: consent });
});

// 5. Emitir Acta Digital de Entrega / Devolución de Activo (Ley 527)
saasRoutes.post("/actas", async (req, res) => {
  const actor = res.locals.actor;
  if (!hasMinimumRole(actor.role, "OPERATOR")) {
    res.status(403).json(forbidden);
    return;
  }

  const input = digitalActaInputSchema.parse(req.body);
  const now = new Date();
  const { sha256Hash, canonicalContent } = generateLegalActaManifest(input, now);

  const db = database();
  const acta = await db.$transaction(async (tx) => {
    const record = await tx.digitalActa.create({
      data: {
        organizationId: input.organizationId,
        loanId: input.loanId,
        actaType: input.actaType,
        assetSerial: input.assetSerial,
        conditionNotes: input.conditionNotes,
        sha256Hash,
        signatureData: `OTP_VERIFIED_${input.signatureOtp}`,
        signedAt: now,
      },
    });

    await tx.auditEvent.create({
      data: {
        actorId: actor.id,
        action: `digital_acta.${input.actaType.toLowerCase()}`,
        entityId: record.id,
      },
    });

    return record;
  });

  res.status(201).json({ data: { ...acta, canonicalLegalProof: canonicalContent } });
});

// 6. Validar idoneidad de aula según ruta formativa (Academic Schedule Matching)
saasRoutes.post("/academic/validate-schedule", async (req, res) => {
  const schema = z.strictObject({
    spaceId: z.uuid(),
    learningPath: LearningPathEnum,
    attendees: z.number().int().positive(),
  });
  const input = schema.parse(req.body);

  const space = await database().space.findUnique({
    where: { id: input.spaceId },
  });

  if (!space) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Espacio no encontrado." } });
    return;
  }

  const result = validateSpaceForLearningPath(
    {
      name: space.name,
      capacity: space.capacity,
      status: space.status,
      hardwareSpecs: (space.hardwareSpecs as any) || null,
    },
    input.learningPath,
    input.attendees
  );

  res.json({ data: result });
});

// 7. Evaluar salud y riesgo predictivo de lote de hardware (CMMS)
saasRoutes.post("/cmms/evaluate-batch", (req, res) => {
  const schema = z.strictObject({
    batchCode: z.string().trim().min(2),
    hardwareModel: z.string().trim().min(2),
    totalDeployed: z.number().int().nonnegative(),
    reportedIncidents: z.number().int().nonnegative(),
    criticalFailures: z.number().int().nonnegative(),
  });
  const input = schema.parse(req.body);
  const evaluation = evaluateBatchHealth(input);
  res.json({ data: evaluation });
});

// 8. Control de cuotas de reserva para empresas aliadas (Internal Chargeback)
saasRoutes.post("/partners/check-quota", (req, res) => {
  const schema = z.strictObject({
    organizationCode: z.string().trim().min(2),
    monthlyQuotaHours: z.number().nonnegative(),
    consumedHours: z.number().nonnegative(),
    requestedStartAt: z.iso.datetime({ offset: true }),
    requestedEndAt: z.iso.datetime({ offset: true }),
    isPremiumSpace: z.boolean().default(false),
  });
  const input = schema.parse(req.body);
  const decision = checkOrganizationQuota({
    organizationCode: input.organizationCode,
    monthlyQuotaHours: input.monthlyQuotaHours,
    consumedHours: input.consumedHours,
    requestedStartAt: new Date(input.requestedStartAt),
    requestedEndAt: new Date(input.requestedEndAt),
    isPremiumSpace: input.isPremiumSpace,
  });
  res.json({ data: decision });
});
