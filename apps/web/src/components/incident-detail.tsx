"use client";
import { RefreshCw, Sparkles } from "lucide-react";
import { IncidentFollowUp } from "./incident-follow-up";
import { Badge, date, type Incident, labels } from "./workspace-shared";
export type WorkspaceApi = <T>(
  path: string,
  method?: string,
  body?: unknown,
) => Promise<T>;
export type Mutation = (
  key: string,
  path: string,
  method?: string,
  body?: unknown,
) => Promise<boolean>;
export function IncidentDetail({
  incident: i,
  operator,
  api,
  refresh,
  mutate,
  disabled,
  busy,
}: {
  incident: Incident;
  operator: boolean;
  api: WorkspaceApi;
  refresh: () => Promise<void>;
  mutate: Mutation;
  disabled: boolean;
  busy: string;
}) {
  return (
    <article className="incident-item" aria-label="Detalle de incidencia">
      <header>
        <span className="record-id">#{i.id.slice(0, 8)}</span>
        <span>{date(i.createdAt)}</span>
        <Badge value={i.status} />
      </header>
      <h3>{i.triage?.summary || i.description.slice(0, 120)}</h3>
      <details className="original-report">
        <summary>Descripción original del reporte</summary>
        <p className="incident-description">{i.description}</p>
      </details>
      {i.triage && (
        <div className="triage-result">
          <div className="triage-title">
            <Sparkles size={16} />
            <strong>Propuesta de IA</strong>
            <Badge value={i.triage.priority} />
          </div>
          <dl>
            <div>
              <dt>Categoría</dt>
              <dd>{labels[i.triage.category]}</dd>
            </div>
            <div>
              <dt>Área sugerida</dt>
              <dd>{labels[i.triage.area]}</dd>
            </div>
          </dl>
          <p>{i.triage.explanation}</p>
          <p>
            <strong>Siguiente paso: </strong>
            {i.triage.suggestedAction}
          </p>
          <details>
            <summary>Ver trazabilidad del análisis</summary>
            <p>
              Groq · {i.triage.model}
              <br />
              {date(i.triage.generatedAt)} · {i.triage.latencyMs} ms
              {i.triage.contextObservedAt && (
                <>
                  <br />
                  Contexto operativo consultado:{" "}
                  {date(i.triage.contextObservedAt)}. Horarios sujetos a
                  validación.
                </>
              )}
            </p>
          </details>
        </div>
      )}
      <div className="incident-actions">
        <Badge value={i.aiStatus} />
        {i.aiStatus !== "COMPLETE" && (
          <button
            type="button"
            className="button button-outline button-small"
            disabled={disabled}
            onClick={() => void mutate(i.id, `/incidents/${i.id}/triage`)}
          >
            <RefreshCw size={14} />
            {busy === i.id ? "Analizando…" : "Analizar con IA"}
          </button>
        )}
        {operator && (
          <label className="inline-label">
            Estado
            <select
              aria-label={`Estado de incidencia ${i.id.slice(0, 8)}`}
              value={i.status}
              disabled={disabled}
              onChange={(e) =>
                void mutate(i.id, `/incidents/${i.id}`, "PATCH", {
                  status: e.target.value,
                })
              }
            >
              <option value="OPEN">Abierta</option>
              <option value="IN_PROGRESS">En atención</option>
              <option value="RESOLVED">Resuelta</option>
            </select>
          </label>
        )}
      </div>
      <IncidentFollowUp
        incident={i}
        operator={operator}
        api={api}
        onUpdated={refresh}
        disabled={disabled}
      />
      {i.aiError && (
        <p className="field-help">
          El reporte está guardado. El proveedor no completó el análisis (
          {i.aiError}). Reintenta.
        </p>
      )}
    </article>
  );
}
