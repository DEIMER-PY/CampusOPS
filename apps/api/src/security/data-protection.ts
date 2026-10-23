import { z } from "zod";

export const consentInputSchema = z
  .strictObject({
    policyVersion: z.string().trim().min(3).max(50),
    acceptedPurposes: z
      .array(
        z.enum([
          "ACADEMIC_OPS",
          "EQUIPMENT_LOAN",
          "PARTNER_HIRING_MATCH",
          "TELEMETRY_IMPROVEMENT",
        ])
      )
      .min(1, "Debe aceptar al menos la finalidad operativa"),
    isMinor: z.boolean().default(false),
    guardianEmail: z.string().email().optional(),
    ipAddress: z.string().max(45).optional(),
    userAgent: z.string().max(300).optional(),
  })
  .refine(
    (data) => {
      if (data.isMinor && !data.guardianEmail) {
        return false;
      }
      return true;
    },
    {
      message:
        "Para campers menores de edad es obligatorio el correo del acudiente/tutor legal (Ley 1581 Art. 7).",
      path: ["guardianEmail"],
    }
  );

/**
 * Sanitiza texto eliminando Cédulas de Ciudadanía colombianas, números de teléfono
 * y correos electrónicos antes de enviar el reporte a proveedores de IA externos (Groq/OpenAI).
 */
export function sanitizePiiForAI(text: string): { sanitized: string; piiDetected: boolean } {
  let piiDetected = false;

  // Regex para Cédulas de Ciudadanía colombianas (ej: CC 1.098.765.432 o CC 1098765432 o C.C.)
  const ccRegex = /\b(?:C\.?C\.?|cédula|identificación)?\s*([1-9]\d{6,9})\b/gi;
  // Regex para teléfonos colombianos (+57 3xx xxx xxxx o 3xx xxx xxxx)
  const phoneRegex = /(?:\+?57\s*)?(?:3\d{2}[-.\s]?\d{3}[-.\s]?\d{4})\b/g;
  // Regex para correos electrónicos
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

  let sanitized = text;

  if (emailRegex.test(sanitized)) {
    piiDetected = true;
    sanitized = sanitized.replace(emailRegex, "[CORREO_PROTEGIDO]");
  }

  if (phoneRegex.test(sanitized)) {
    piiDetected = true;
    sanitized = sanitized.replace(phoneRegex, "[TELEFONO_PROTEGIDO]");
  }

  if (ccRegex.test(sanitized)) {
    piiDetected = true;
    sanitized = sanitized.replace(ccRegex, "[DOCUMENTO_PROTEGIDO]");
  }

  return { sanitized, piiDetected };
}
