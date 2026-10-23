import { createHash } from "node:crypto";

export type AuditEventPayload = {
  id?: string;
  actorId: string;
  action: string;
  entityId: string;
  createdAt: string | Date;
  previousHash?: string | null;
  hash?: string | null;
};

export const GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

/**
 * Calcula el hash SHA-256 inmutable de un evento de auditoría enlazado al anterior.
 */
export function calculateAuditEventHash(
  event: Omit<AuditEventPayload, "hash">,
  previousHash: string = GENESIS_HASH
): string {
  const dateStr = event.createdAt instanceof Date ? event.createdAt.toISOString() : event.createdAt;
  const canonicalString = [
    previousHash,
    event.actorId,
    event.action,
    event.entityId,
    dateStr,
  ].join("|");

  return createHash("sha256").update(canonicalString).digest("hex");
}

/**
 * Valida la integridad forense de una secuencia de eventos de auditoría.
 * Devuelve { valid: true } o el índice del evento manipulado.
 */
export function verifyAuditChain(events: AuditEventPayload[]): {
  valid: boolean;
  tamperedIndex?: number;
  reason?: string;
} {
  let expectedPreviousHash = GENESIS_HASH;

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const prev = event.previousHash || GENESIS_HASH;

    if (prev !== expectedPreviousHash) {
      return {
        valid: false,
        tamperedIndex: i,
        reason: `Ruptura de cadena en evento ${i}: previousHash esperado ${expectedPreviousHash}, pero se encontró ${prev}`,
      };
    }

    const computedHash = calculateAuditEventHash(event, expectedPreviousHash);
    if (event.hash && event.hash !== computedHash) {
      return {
        valid: false,
        tamperedIndex: i,
        reason: `Hash manipulado en evento ${i}: calculado ${computedHash}, pero guardado ${event.hash}`,
      };
    }

    expectedPreviousHash = computedHash;
  }

  return { valid: true };
}
