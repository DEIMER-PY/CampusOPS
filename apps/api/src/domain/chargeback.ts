export type QuotaCheckInput = {
  organizationCode: string;
  monthlyQuotaHours: number;
  consumedHours: number;
  requestedStartAt: Date;
  requestedEndAt: Date;
  isPremiumSpace: boolean; // Ej: Auditorio principal, Sala VIP
};

export type QuotaDecision = {
  approved: boolean;
  requiresDirectorApproval: boolean;
  requestedDurationHours: number;
  remainingHoursAfter: number;
  message: string;
};

/**
 * Valida si una organización o empresa aliada tiene cuota disponible para reservar
 * espacios de alta demanda o si requiere aprobación expresa de la Dirección (HITL).
 */
export function checkOrganizationQuota(input: QuotaCheckInput): QuotaDecision {
  const durationMs = input.requestedEndAt.getTime() - input.requestedStartAt.getTime();
  const requestedDurationHours = Number((durationMs / (1000 * 60 * 60)).toFixed(2));

  if (requestedDurationHours <= 0) {
    throw new Error("DURACION_INVALIDA: La fecha fin debe ser posterior al inicio.");
  }

  const projectedTotal = input.consumedHours + requestedDurationHours;
  const remainingHours = Number((input.monthlyQuotaHours - projectedTotal).toFixed(2));

  // Espacios premium siempre requieren al menos 5 horas de saldo restante
  if (input.isPremiumSpace && projectedTotal > input.monthlyQuotaHours) {
    return {
      approved: false,
      requiresDirectorApproval: true,
      requestedDurationHours,
      remainingHoursAfter: remainingHours,
      message: `La solicitud de ${requestedDurationHours}h en espacio premium excede la cuota mensual de ${input.monthlyQuotaHours}h asignada a ${input.organizationCode}. Requiere aprobación de Dirección.`,
    };
  }

  if (projectedTotal > input.monthlyQuotaHours) {
    return {
      approved: false,
      requiresDirectorApproval: true,
      requestedDurationHours,
      remainingHoursAfter: remainingHours,
      message: `Cuota mensual superada por ${Math.abs(remainingHours)} horas. Requiere autorización administrativa.`,
    };
  }

  return {
    approved: true,
    requiresDirectorApproval: false,
    requestedDurationHours,
    remainingHoursAfter: remainingHours,
    message: `Reserva autorizada dentro del plan de cuota. Saldo restante: ${remainingHours}h.`,
  };
}
