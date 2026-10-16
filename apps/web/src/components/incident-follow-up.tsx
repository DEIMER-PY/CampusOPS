"use client";
import {
  ImagePlus,
  LoaderCircle,
  Mail,
  MessageSquare,
  ScanEye,
  Send,
} from "lucide-react";
import { useState } from "react";

type Visual = {
  observation: string;
  findings: string;
  limitations: string;
  recommendation: string;
  visibleAssetCode: string | null;
  codeMatches: boolean | null;
  priority: string;
  model: string;
  generatedAt: string;
};
type Message = { message: string; role: string; createdAt: string };
type Record = {
  notification?: {
    status: string;
    reason?: string;
    providerId?: string;
  } | null;
  id: string;
  assetCode?: string | null;
  visual?: Visual | null;
  visionStatus?: string;
  communications?: Message[] | null;
};
type Api = <T>(path: string, method?: string, body?: unknown) => Promise<T>;
export function IncidentFollowUp({
  incident,
  api,
  onUpdated,
  disabled,
  operator,
}: {
  incident: Record;
  api: Api;
  onUpdated: () => Promise<void>;
  disabled: boolean;
  operator: boolean;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [preview, setPreview] = useState("");
  const run = async (work: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await work();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se completó la acción.");
    } finally {
      await onUpdated();
      setBusy(false);
    }
  };
  return (
    <div className="incident-follow-up">
      <details>
        <summary>
          <ImagePlus size={15} />
          Equipo y evidencia{" "}
          {incident.assetCode && <strong>{incident.assetCode}</strong>}
        </summary>
        {!incident.assetCode ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const data = new FormData(form);
              void run(async () => {
                const file = data.get("photo");
                if (!(file instanceof File) || !file.size)
                  throw new Error("Selecciona una foto.");
                if (file.size > 1000000)
                  throw new Error("La foto debe pesar como máximo 1 MB.");
                const image = await new Promise<string>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(String(reader.result));
                  reader.onerror = () =>
                    reject(new Error("No se pudo leer la foto."));
                  reader.readAsDataURL(file);
                });
                await api(`/incidents/${incident.id}/evidence`, "POST", {
                  assetCode: String(data.get("assetCode")),
                  image,
                });
                await api(`/incidents/${incident.id}/vision`, "POST");
                form.reset();
              });
            }}
          >
            <label>
              Código del equipo
              <input
                name="assetCode"
                required
                maxLength={80}
                placeholder="Código registrado en Recursos"
                disabled={disabled || busy}
              />
            </label>
            <label className="photo-field">
              Fotografía del equipo
              <input
                name="photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required
                disabled={disabled || busy}
              />
            </label>
            <p className="field-help">
              Una foto de hasta 1 MB y 12 megapíxeles. Se guarda vinculada al
              reporte; la versión sin metadatos se envía a Groq para observación
              visual. Evita personas y datos privados.
            </p>
            <button
              className="button button-outline button-small"
              disabled={disabled || busy}
              type="submit"
            >
              {busy ? (
                <LoaderCircle size={15} className="spin" />
              ) : (
                <ScanEye size={15} />
              )}
              Guardar y analizar fotografía
            </button>
          </form>
        ) : (
          <div className="visual-observation">
            <p>
              <strong>Equipo: {incident.assetCode}</strong> ·{" "}
              {(
                {
                  PENDING: "Pendiente de análisis",
                  PROCESSING: "Análisis en curso",
                  FAILED: "Análisis no completado",
                  COMPLETE: "Análisis completado",
                } as { [key: string]: string }
              )[incident.visionStatus ?? ""] ?? "Evidencia guardada"}
            </p>
            <button
              type="button"
              className="text-link"
              disabled={busy || disabled}
              onClick={() =>
                void run(async () => {
                  const result = await api<{ evidence: { image: string } }>(
                    `/incidents/${incident.id}/evidence`,
                  );
                  setPreview(result.evidence.image);
                })
              }
            >
              Ver fotografía adjunta
            </button>
            {preview && (
              <img
                src={preview}
                alt={`Evidencia adjunta del equipo ${incident.assetCode}`}
                className="evidence-preview"
              />
            )}
            {["PENDING", "FAILED"].includes(incident.visionStatus ?? "") && (
              <button
                type="button"
                className="button button-outline button-small"
                disabled={busy || disabled}
                onClick={() =>
                  void run(async () => {
                    await api(`/incidents/${incident.id}/vision`, "POST");
                  })
                }
              >
                Reintentar análisis visual
              </button>
            )}
            {incident.visual && (
              <>
                <h4>
                  {
                    (
                      {
                        VISIBLE_DAMAGE: "Daño visible observado",
                        NO_VISIBLE_DAMAGE: "Sin daño visible en la fotografía",
                        NOT_ASSESSABLE:
                          "La fotografía no permite valorar el equipo",
                      } as { [key: string]: string }
                    )[incident.visual.observation]
                  }
                </h4>
                <p>{incident.visual.findings}</p>
                <p>
                  <strong>Límite de la evaluación: </strong>
                  {incident.visual.limitations}
                </p>
                {incident.visual.codeMatches === false && (
                  <p className="error-message">
                    El código visible ({incident.visual.visibleAssetCode})
                    difiere del declarado. Requiere revisión humana.
                  </p>
                )}
                <p>
                  <strong>Recomendación: </strong>
                  {incident.visual.recommendation}
                </p>
                <small>
                  {incident.visual.model} ·{" "}
                  {new Date(incident.visual.generatedAt).toLocaleString(
                    "es-CO",
                    { timeZone: "America/Bogota" },
                  )}
                </small>
              </>
            )}
            <p className="field-help">
              Una fotografía no confirma el funcionamiento. La IA no modifica la
              disponibilidad del recurso.
            </p>
          </div>
        )}
      </details>
      <details>
        <summary>
          <MessageSquare size={15} />
          Conversación del reporte{" "}
          <span>{incident.communications?.length ?? 0} mensajes</span>
        </summary>
        <div className="report-conversation">
          {incident.communications?.length ? (
            incident.communications.map((message) => (
              <article key={`${message.createdAt}-${message.message}`}>
                <header>
                  <strong>
                    {message.role === "CLIENT"
                      ? "Comunidad"
                      : "Equipo de operación"}
                  </strong>
                  <time dateTime={message.createdAt}>
                    {new Date(message.createdAt).toLocaleString("es-CO", {
                      timeZone: "America/Bogota",
                    })}
                  </time>
                </header>
                <p>{message.message}</p>
              </article>
            ))
          ) : (
            <p className="field-help">
              Agrega contexto o deja una respuesta para el equipo. Pulsa
              Actualizar datos para consultar nuevos mensajes.
            </p>
          )}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const message = String(new FormData(form).get("message"));
            void run(async () => {
              await api(`/incidents/${incident.id}/messages`, "POST", {
                message,
              });
              form.reset();
            });
          }}
        >
          <label>
            Mensaje
            <textarea
              name="message"
              required
              minLength={2}
              maxLength={1500}
              rows={2}
              placeholder="¿Qué necesita saber el equipo?"
              disabled={busy || disabled}
            />
          </label>
          <button
            type="submit"
            disabled={busy || disabled}
            className="button button-outline button-small"
          >
            <Send size={14} />
            Guardar mensaje
          </button>
        </form>
      </details>
      <details>
        <summary>
          <Mail size={15} />
          Reporte por correo
        </summary>
        <p className="field-help">
          {incident.notification?.status === "ACCEPTED"
            ? "Resend aceptó el envío. La entrega al buzón todavía no está confirmada."
            : incident.notification?.reason ||
              "El correo se dirige al buzón operativo configurado en el servidor. Los daños visibles de prioridad alta o crítica activan el envío automático."}
        </p>
        {incident.notification && (
          <span className="status-badge">
            {(
              {
                ACCEPTED: "Aceptado por Resend",
                SENDING: "Enviando",
                FAILED: "Envío no confirmado",
                PENDING_CONFIGURATION: "Pendiente de configuración",
                PENDING_DOMAIN_VERIFICATION: "Pendiente de verificar dominio",
              } as { [key: string]: string }
            )[incident.notification.status] ?? "Pendiente"}
          </span>
        )}
        {operator && (
          <button
            type="button"
            className="button button-outline button-small"
            disabled={busy || disabled}
            onClick={() =>
              void run(async () => {
                await api(`/incidents/${incident.id}/notify`, "POST");
              })
            }
          >
            <Mail size={14} />
            Enviar reporte a operación
          </button>
        )}
      </details>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
