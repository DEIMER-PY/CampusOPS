import { ClipboardList } from "lucide-react";

export type Tab =
  | "agenda"
  | "schedule"
  | "plans"
  | "summary"
  | "spaces"
  | "reservations"
  | "resources"
  | "incidents"
  | "audit"
  | "comms";
export type Space = {
  id: string;
  name: string;
  capacity: number;
  status: string;
};
export type Reservation = {
  participants?: string[] | null;
  id: string;
  space: Space;
  startAt: string;
  endAt: string;
  purpose: string;
  cancelledAt: string | null;
};
export type Resource = {
  id: string;
  name: string;
  code: string;
  status: string;
  loans: { id: string }[];
};
export type Loan = {
  id: string;
  resource: { name: string; code: string };
  createdAt: string;
  returnedAt: string | null;
};
export type Triage = {
  category: string;
  priority: string;
  area: string;
  summary: string;
  explanation: string;
  suggestedAction: string;
  model: string;
  generatedAt: string;
  latencyMs: number;
  contextObservedAt?: string | null;
};
export type Incident = {
  notification?: {
    status: string;
    reason?: string;
    providerId?: string;
  } | null;
  assetCode?: string | null;
  visionStatus?: string;
  visual?: {
    observation: string;
    findings: string;
    limitations: string;
    recommendation: string;
    visibleAssetCode: string | null;
    codeMatches: boolean | null;
    priority: string;
    model: string;
    generatedAt: string;
  } | null;
  communications?:
    | { message: string; role: string; createdAt: string }[]
    | null;
  id: string;
  description: string;
  aiStatus: string;
  aiError: string | null;
  status: string;
  triage: Triage | null;
  createdAt: string;
};
export type Audit = {
  id: string;
  action: string;
  entityId: string;
  createdAt: string;
};
export const labels: Record<string, string> = {
  AVAILABLE: "Habilitado",
  DISABLED: "Sin habilitar",
  MAINTENANCE: "Mantenimiento",
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  CRITICAL: "Crítica",
  OPEN: "Abierta",
  IN_PROGRESS: "En atención",
  RESOLVED: "Resuelta",
  PENDING: "Pendiente de análisis",
  PROCESSING: "Analizando",
  FAILED: "Análisis no completado",
  COMPLETE: "Analizada",
  TECHNICAL: "Técnica",
  FACILITIES: "Instalaciones",
  ACADEMIC: "Académica",
  OTHER: "Otra",
  SOPORTE_TECNICO: "Soporte técnico",
  MANTENIMIENTO: "Mantenimiento",
  COORDINACION: "Coordinación",
  REVISION_ADMINISTRATIVA: "Revisión administrativa",
};
export const date = (v: string) =>
  new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(v));
export function auditAction(action: string) {
  const known: Record<string, string> = {
    "loan.created": "Préstamo registrado",
    "schedule.entry_updated": "Bloque de horario actualizado",
    "loan.returned": "Recurso devuelto",
    "incident.created": "Incidencia reportada",
    "incident.evidence_uploaded": "Fotografía vinculada al equipo",
    "incident.visual_analyzed": "Observación visual de IA completada",
    "incident.message_added": "Mensaje añadido al reporte",
    "incident.email_accepted": "Reporte aceptado por el proveedor de correo",
    "incident.email_pending": "Envío de correo pendiente de completar",
    "incident.visual_failed": "Observación visual no completada",
    "incident.triaged": "Clasificación de IA completada",
    "incident.resolved": "Incidencia resuelta",
    "incident.in_progress": "Incidencia en atención",
    "incident.open": "Incidencia abierta",
    "incident.triage_failed": "Análisis de IA no completado",
    "reservation.created": "Reserva confirmada",
    "reservation.cancelled": "Reserva cancelada",
    "space.available": "Espacio habilitado",
    "space.disabled": "Espacio deshabilitado",
    "space.maintenance": "Espacio en mantenimiento",
    "resource.created": "Recurso registrado",
    "resource.available": "Recurso habilitado",
    "resource.disabled": "Recurso deshabilitado",
    "resource.maintenance": "Recurso en mantenimiento",
  };
  return known[action] ?? `Operación registrada: ${action}`;
}
export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="empty-state">
      <ClipboardList size={26} />
      <p>{children}</p>
    </div>
  );
}
export function Badge({ value }: { value: string }) {
  return (
    <span className={`status-badge status-${value.toLowerCase()}`}>
      {labels[value] || value}
    </span>
  );
}
