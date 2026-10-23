import { createHash } from "node:crypto";
import { z } from "zod";

export const digitalActaInputSchema = z.strictObject({
  organizationId: z.uuid(),
  loanId: z.uuid(),
  actaType: z.enum(["DELIVERY", "RETURN"]),
  assetSerial: z.string().trim().min(3).max(80),
  conditionNotes: z.string().trim().min(5).max(1000),
  recipientName: z.string().trim().min(3).max(120),
  recipientDoc: z.string().trim().min(5).max(30),
  signatureOtp: z.string().trim().regex(/^\d{6}$/, "El código de firma debe ser de 6 dígitos"),
});

export type LegalActaManifest = {
  loanId: string;
  actaType: "DELIVERY" | "RETURN";
  assetSerial: string;
  conditionNotes: string;
  recipientName: string;
  recipientDoc: string;
  timestamp: string;
  legalTermsSummary: string;
};

export const LEY_527_LEGAL_HEADER =
  "ACTA DE CUSTODIA Y RESPONSABILIDAD DE EQUIPO TECNOLÓGICO — LEY 527 DE 1999 (COLOMBIA)";

export function generateLegalActaManifest(
  input: z.infer<typeof digitalActaInputSchema>,
  timestamp: Date = new Date()
): { manifest: LegalActaManifest; sha256Hash: string; canonicalContent: string } {
  const manifest: LegalActaManifest = {
    loanId: input.loanId,
    actaType: input.actaType,
    assetSerial: input.assetSerial,
    conditionNotes: input.conditionNotes,
    recipientName: input.recipientName,
    recipientDoc: input.recipientDoc,
    timestamp: timestamp.toISOString(),
    legalTermsSummary:
      "El custodio recibe el activo en las condiciones descritas y se compromete a su preservación, destinación exclusiva a fines formativos y devolución en la fecha estipulada.",
  };

  const canonicalContent = [
    LEY_527_LEGAL_HEADER,
    `TIPO: ${manifest.actaType}`,
    `PRESTAMO_ID: ${manifest.loanId}`,
    `SERIAL: ${manifest.assetSerial}`,
    `CUSTODIO: ${manifest.recipientName} (DOC: ${manifest.recipientDoc})`,
    `ESTADO: ${manifest.conditionNotes}`,
    `FECHA_UTC: ${manifest.timestamp}`,
    `CLAUSULA: ${manifest.legalTermsSummary}`,
  ].join("\n");

  const sha256Hash = createHash("sha256").update(canonicalContent).digest("hex");

  return { manifest, sha256Hash, canonicalContent };
}
