import { z } from "zod";

export const LearningPathEnum = z.enum([
  "AI_DATA",
  "CLOUD_DEVOPS",
  "FULLSTACK_DEVELOPMENT",
  "SOFT_SKILLS",
  "CYBERSECURITY",
]);

export type LearningPath = z.infer<typeof LearningPathEnum>;

export type SpaceHardwareSpecs = {
  gpuWorkstationsCount?: number;
  dualMonitorsCount?: number;
  hasModularTables?: boolean;
  hasAudioVideoConference?: boolean;
  hasIsolatedSubnet?: boolean;
  bandwidthMbps?: number;
};

export type MatchResult = {
  compatible: boolean;
  reasons: string[];
};

/**
 * Valida si un espacio cumple con los requerimientos técnicos y de hardware
 * exigidos por la ruta formativa de una cohorte en Campuslands.
 */
export function validateSpaceForLearningPath(
  space: {
    name: string;
    capacity: number;
    status: string;
    hardwareSpecs?: SpaceHardwareSpecs | null;
  },
  learningPath: LearningPath,
  attendees: number
): MatchResult {
  const reasons: string[] = [];

  if (space.status !== "AVAILABLE") {
    reasons.push(`El espacio ${space.name} está en estado ${space.status} (no disponible).`);
  }

  if (space.capacity < attendees) {
    reasons.push(
      `Capacidad insuficiente: el aula ${space.name} soporta ${space.capacity} personas y la cohorte requiere ${attendees}.`
    );
  }

  const specs = space.hardwareSpecs || {};

  switch (learningPath) {
    case "AI_DATA":
      if (!specs.gpuWorkstationsCount || specs.gpuWorkstationsCount < Math.ceil(attendees * 0.8)) {
        reasons.push(
          `La ruta AI & Data requiere al menos el 80% de estaciones con aceleración GPU (disponibles: ${
            specs.gpuWorkstationsCount || 0
          }).`
        );
      }
      break;

    case "CLOUD_DEVOPS":
      if (!specs.dualMonitorsCount || specs.dualMonitorsCount < Math.ceil(attendees * 0.5)) {
        reasons.push(
          `La ruta Cloud & DevOps requiere al menos el 50% de estaciones con doble monitor.`
        );
      }
      break;

    case "CYBERSECURITY":
      if (!specs.hasIsolatedSubnet) {
        reasons.push(
          `La ruta de Ciberseguridad requiere subred física aislada para prácticas de redes y pentesting.`
        );
      }
      break;

    case "SOFT_SKILLS":
      if (!specs.hasModularTables) {
        reasons.push(
          `Los talleres de Soft Skills requieren mesas modulares para dinámicas grupales.`
        );
      }
      break;

    case "FULLSTACK_DEVELOPMENT":
      // Requerimientos base satisfechos por capacidad estándar
      break;
  }

  return {
    compatible: reasons.length === 0,
    reasons,
  };
}
