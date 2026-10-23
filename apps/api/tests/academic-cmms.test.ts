import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateSpaceForLearningPath } from "../src/domain/academic-matching.js";
import { evaluateBatchHealth } from "../src/domain/cmms.js";
import { checkOrganizationQuota } from "../src/domain/chargeback.js";

describe("Reglas de Negocio Académicas, CMMS y Control de Cuotas", () => {
  it("valida requerimientos técnicos de aula según ruta formativa", () => {
    const spaceStandard = {
      name: "Blanca",
      capacity: 25,
      status: "AVAILABLE",
      hardwareSpecs: {
        gpuWorkstationsCount: 0,
        hasModularTables: false,
      },
    };

    // Cohorte de IA en aula estándar debe fallar por falta de GPU
    const aiCheck = validateSpaceForLearningPath(spaceStandard, "AI_DATA", 20);
    assert.equal(aiCheck.compatible, false);
    assert.match(aiCheck.reasons[0], /aceleración GPU/);

    // Aula especializada con GPUs
    const spaceApoloGpu = {
      name: "Apolo",
      capacity: 34,
      status: "AVAILABLE",
      hardwareSpecs: {
        gpuWorkstationsCount: 28,
        hasModularTables: false,
      },
    };
    const aiCheckPass = validateSpaceForLearningPath(spaceApoloGpu, "AI_DATA", 25);
    assert.equal(aiCheckPass.compatible, true);
    assert.equal(aiCheckPass.reasons.length, 0);

    // Taller de Soft Skills en aula sin mesas modulares
    const softSkillsCheck = validateSpaceForLearningPath(spaceApoloGpu, "SOFT_SKILLS", 15);
    assert.equal(softSkillsCheck.compatible, false);
    assert.match(softSkillsCheck.reasons[0], /mesas modulares/);
  });

  it("motor CMMS detecta fallas críticas y recomienda cuarentena preventiva", () => {
    // Lote con 2 fallas críticas (ej. corto o sobrecalentamiento de batería)
    const criticalBatch = evaluateBatchHealth({
      batchCode: "BATCH-LENOVO-2026-Q1",
      hardwareModel: "ThinkPad T14 Gen 4",
      totalDeployed: 50,
      reportedIncidents: 4,
      criticalFailures: 2,
    });

    assert.equal(criticalBatch.status, "QUARANTINE_REQUIRED");
    assert.equal(criticalBatch.supplierRmaRecommended, true);
    assert.match(criticalBatch.actionRequired, /Cuarentena inmediata/);

    // Lote saludable
    const healthyBatch = evaluateBatchHealth({
      batchCode: "BATCH-DELL-2026-Q2",
      hardwareModel: "Dell Latitude 5440",
      totalDeployed: 100,
      reportedIncidents: 2,
      criticalFailures: 0,
    });
    assert.equal(healthyBatch.status, "HEALTHY");
    assert.equal(healthyBatch.supplierRmaRecommended, false);
  });

  it("control de cuotas B2B exige aprobación de Dirección al superar límite mensual", () => {
    const start = new Date("2026-10-24T14:00:00Z");
    const end = new Date("2026-10-24T18:00:00Z"); // 4 horas

    // Organización con 40h asignadas y 30h consumidas (pasa normalmente)
    const normalDecision = checkOrganizationQuota({
      organizationCode: "PARTNER-TECHCORP",
      monthlyQuotaHours: 40,
      consumedHours: 30,
      requestedStartAt: start,
      requestedEndAt: end,
      isPremiumSpace: false,
    });
    assert.equal(normalDecision.approved, true);
    assert.equal(normalDecision.requiresDirectorApproval, false);
    assert.equal(normalDecision.remainingHoursAfter, 6);

    // Organización con 38h consumidas solicita 4h (supera 40h) -> Requiere aprobación
    const overquotaDecision = checkOrganizationQuota({
      organizationCode: "PARTNER-TECHCORP",
      monthlyQuotaHours: 40,
      consumedHours: 38,
      requestedStartAt: start,
      requestedEndAt: end,
      isPremiumSpace: true,
    });
    assert.equal(overquotaDecision.approved, false);
    assert.equal(overquotaDecision.requiresDirectorApproval, true);
    assert.match(overquotaDecision.message, /Requiere aprobación de Dirección/);
  });
});
