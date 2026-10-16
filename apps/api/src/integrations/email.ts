import { createHash } from "node:crypto";
import { z } from "zod";
import { database } from "../db.js";

const notificationSchema = z.object({
  status: z.string(),
  version: z.string().optional(),
  startedAt: z.string().optional(),
  providerId: z.string().optional(),
});
export async function notifyIncident(incidentId: string, actorId: string) {
  const db = database();
  const record = await db.incident.findUnique({
    where: { id: incidentId },
    omit: { evidence: true, communications: true },
  });
  if (!record) return { status: "NOT_FOUND" };
  const visual = z
    .object({
      findings: z.string(),
      limitations: z.string(),
      recommendation: z.string(),
    })
    .safeParse(record.visual);
  const triage = z
    .object({ summary: z.string(), suggestedAction: z.string() })
    .safeParse(record.triage);
  const text = [
    "CampusFlow · Reporte operativo",
    `Referencia: ${record.id}`,
    `Equipo declarado: ${record.assetCode || "No vinculado"}`,
    `Estado del reporte: ${record.status}`,
    `Descripción: ${record.description}`,
    triage.success
      ? `Triaje IA: ${triage.data.summary}\nSiguiente paso: ${triage.data.suggestedAction}`
      : "Triaje IA pendiente.",
    visual.success
      ? `Observación visual: ${visual.data.findings}\nLímites: ${visual.data.limitations}\nRecomendación: ${visual.data.recommendation}`
      : "Sin evaluación visual completada.",
    "La IA propone; el equipo valida. Una fotografía no confirma funcionamiento.",
  ].join("\n\n");
  const version = createHash("sha256").update(text).digest("hex");
  const key = process.env.RESEND_API_KEY,
    recipient = process.env.NOTIFICATION_RECIPIENT;
  if (!key || !recipient) {
    const pending = {
      status: "PENDING_CONFIGURATION",
      version,
      updatedAt: new Date().toISOString(),
    };
    await db.incident.update({
      where: { id: incidentId },
      data: { notification: pending },
    });
    return pending;
  }
  const startedAt = new Date().toISOString();
  const claimed = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM app_private."Incident" WHERE id=${incidentId}::uuid FOR UPDATE`;
    const current = await tx.incident.findUnique({
      where: { id: incidentId },
      select: { notification: true },
    });
    const previous = notificationSchema.safeParse(current?.notification);
    if (
      previous.success &&
      previous.data.version === version &&
      (previous.data.status === "ACCEPTED" ||
        (previous.data.status === "SENDING" &&
          Date.now() - Date.parse(previous.data.startedAt ?? "") < 60000))
    )
      return previous.data;
    await tx.incident.update({
      where: { id: incidentId },
      data: { notification: { status: "SENDING", version, startedAt } },
    });
    return null;
  });
  if (claimed) return claimed;
  let result: {
    status: string;
    version: string;
    updatedAt: string;
    providerId?: string;
    reason?: string;
  };
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(15000),
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `campusflow-${incidentId}-${version}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "CampusFlow <onboarding@resend.dev>",
        to: [z.email().parse(recipient)],
        subject: `CampusFlow · Reporte #${incidentId.slice(0, 8)}`,
        text,
      }),
    });
    if (!response.ok) {
      result = {
        status:
          response.status === 403 ? "PENDING_DOMAIN_VERIFICATION" : "FAILED",
        version,
        updatedAt: new Date().toISOString(),
        reason:
          response.status === 403
            ? "Verifica el dominio remitente y la autorización del destinatario en Resend."
            : "El proveedor no aceptó el correo. Reintenta desde el reporte.",
      };
    } else {
      const payload = z
        .object({ id: z.string().min(1) })
        .parse(await response.json());
      result = {
        status: "ACCEPTED",
        version,
        providerId: payload.id,
        updatedAt: new Date().toISOString(),
      };
    }
  } catch {
    result = {
      status: "FAILED",
      version,
      updatedAt: new Date().toISOString(),
      reason:
        "No se pudo confirmar la aceptación del correo. Reintenta con la misma referencia.",
    };
  }
  await db.$transaction(async (tx) => {
    await tx.incident.update({
      where: { id: incidentId },
      data: { notification: result },
    });
    await tx.auditEvent.create({
      data: {
        actorId,
        entityId: incidentId,
        action:
          result.status === "ACCEPTED"
            ? "incident.email_accepted"
            : "incident.email_pending",
      },
    });
  });
  return result;
}
