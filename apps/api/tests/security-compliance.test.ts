import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  consentInputSchema,
  sanitizePiiForAI,
} from "../src/security/data-protection.js";
import {
  calculateAuditEventHash,
  verifyAuditChain,
  GENESIS_HASH,
} from "../src/security/audit-chain.js";
import {
  generateLegalActaManifest,
  digitalActaInputSchema,
} from "../src/security/digital-acta.js";

describe("Ciberseguridad y Cumplimiento Normativo (Ley 1581 & Ley 527)", () => {
  it("sanitiza PII colombiana antes de enviar a IA", () => {
    const rawReport =
      "El camper Juan Pérez con CC 1098765432 reporta que su laptop echó humo. Contactar al 3158901234 o a juan@gmail.com";
    const { sanitized, piiDetected } = sanitizePiiForAI(rawReport);

    assert.equal(piiDetected, true);
    assert.doesNotMatch(sanitized, /1098765432/);
    assert.doesNotMatch(sanitized, /3158901234/);
    assert.doesNotMatch(sanitized, /juan@gmail\.com/);
    assert.match(sanitized, /\[DOCUMENTO_PROTEGIDO\]/);
    assert.match(sanitized, /\[TELEFONO_PROTEGIDO\]/);
    assert.match(sanitized, /\[CORREO_PROTEGIDO\]/);
  });

  it("exige correo del acudiente para campers menores de edad (Ley 1581)", () => {
    const adultConsent = consentInputSchema.parse({
      policyVersion: "LEY1581-V2.1-2026",
      acceptedPurposes: ["ACADEMIC_OPS", "EQUIPMENT_LOAN"],
      isMinor: false,
    });
    assert.equal(adultConsent.isMinor, false);

    assert.throws(
      () =>
        consentInputSchema.parse({
          policyVersion: "LEY1581-V2.1-2026",
          acceptedPurposes: ["ACADEMIC_OPS"],
          isMinor: true, // Menor de edad sin guardianEmail
        }),
      /menores de edad es obligatorio el correo del acudiente/
    );

    const minorWithGuardian = consentInputSchema.parse({
      policyVersion: "LEY1581-V2.1-2026",
      acceptedPurposes: ["ACADEMIC_OPS"],
      isMinor: true,
      guardianEmail: "padre@ejemplo.com",
    });
    assert.equal(minorWithGuardian.guardianEmail, "padre@ejemplo.com");
  });

  it("detecta manipulación o ruptura en la cadena criptográfica de auditoría", () => {
    const now = new Date("2026-10-23T10:00:00Z");
    const e1 = {
      actorId: randomUUID(),
      action: "space.created",
      entityId: randomUUID(),
      createdAt: now,
      previousHash: GENESIS_HASH,
    };
    const h1 = calculateAuditEventHash(e1, GENESIS_HASH);

    const e2 = {
      actorId: randomUUID(),
      action: "reservation.created",
      entityId: randomUUID(),
      createdAt: new Date("2026-10-23T10:05:00Z"),
      previousHash: h1,
    };
    const h2 = calculateAuditEventHash(e2, h1);

    const chain = [
      { ...e1, hash: h1 },
      { ...e2, hash: h2 },
    ];

    const validCheck = verifyAuditChain(chain);
    assert.equal(validCheck.valid, true);

    // Simular manipulación de datos en base de datos
    const tamperedChain = [
      { ...e1, hash: h1 },
      { ...e2, action: "reservation.cancelled_ILLEGALLY", hash: h2 },
    ];
    const tamperedCheck = verifyAuditChain(tamperedChain);
    assert.equal(tamperedCheck.valid, false);
    assert.equal(tamperedCheck.tamperedIndex, 1);
  });

  it("genera acta digital legal con huella SHA-256 verificable (Ley 527)", () => {
    const input = digitalActaInputSchema.parse({
      organizationId: randomUUID(),
      loanId: randomUUID(),
      actaType: "DELIVERY",
      assetSerial: "CAMPUS-LENOVO-T14-042",
      conditionNotes: "Equipo óptimo con cargador original de 65W y mouse USB",
      recipientName: "Camper Andrés Gómez",
      recipientDoc: "1098123456",
      signatureOtp: "492810",
    });

    const fixedDate = new Date("2026-10-23T12:00:00.000Z");
    const { manifest, sha256Hash, canonicalContent } = generateLegalActaManifest(input, fixedDate);

    assert.equal(manifest.assetSerial, "CAMPUS-LENOVO-T14-042");
    assert.equal(typeof sha256Hash, "string");
    assert.equal(sha256Hash.length, 64); // SHA-256 hex string
    assert.match(canonicalContent, /ACTA DE CUSTODIA/);
    assert.match(canonicalContent, /CAMPUS-LENOVO-T14-042/);
  });
});
