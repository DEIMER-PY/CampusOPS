export type BatchMetrics = {
  batchCode: string;
  hardwareModel: string;
  totalDeployed: number;
  reportedIncidents: number;
  criticalFailures: number;
  lastIncidentDate?: Date;
};

export type BatchHealthStatus = "HEALTHY" | "WATCHLIST" | "QUARANTINE_REQUIRED";

export type BatchEvaluationResult = {
  status: BatchHealthStatus;
  failureRatePercentage: number;
  actionRequired: string;
  supplierRmaRecommended: boolean;
};

/**
 * Motor CMMS de Mantenimiento Predictivo:
 * Evalúa si un lote de equipos tecnológicos presenta un patrón anómalo de fallas
 * que justifique cuarentena preventiva o reclamo de garantía al proveedor mayorista.
 */
export function evaluateBatchHealth(metrics: BatchMetrics): BatchEvaluationResult {
  if (metrics.totalDeployed <= 0) {
    return {
      status: "HEALTHY",
      failureRatePercentage: 0,
      actionRequired: "Sin equipos desplegados en este lote.",
      supplierRmaRecommended: false,
    };
  }

  const failureRatePercentage = Number(
    ((metrics.reportedIncidents / metrics.totalDeployed) * 100).toFixed(1)
  );

  if (failureRatePercentage >= 15 || metrics.criticalFailures >= 2) {
    return {
      status: "QUARANTINE_REQUIRED",
      failureRatePercentage,
      actionRequired:
        "Cuarentena inmediata del lote: inhabilitar préstamos nuevos y coordinar revisión técnica completa.",
      supplierRmaRecommended: true,
    };
  }

  if (failureRatePercentage >= 8 || metrics.criticalFailures === 1) {
    return {
      status: "WATCHLIST",
      failureRatePercentage,
      actionRequired:
        "Lote en observación preventiva: priorizar inspección visual y mantenimiento antes de nuevos préstamos.",
      supplierRmaRecommended: false,
    };
  }

  return {
    status: "HEALTHY",
    failureRatePercentage,
    actionRequired: "Operación normal del lote.",
    supplierRmaRecommended: false,
  };
}
