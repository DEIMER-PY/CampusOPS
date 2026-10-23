"use client";
import { ArrowLeft, ArrowUpRight, Plus, Search } from "lucide-react";
import { useRef, useState } from "react";
import { IncidentComposer } from "./incident-composer";
import {
  IncidentDetail,
  type Mutation,
  type WorkspaceApi,
} from "./incident-detail";
import { Badge, date, Empty, type Incident } from "./workspace-shared";

export function IncidentsView({
  incidents,
  ready,
  loading,
  operator,
  disabled,
  busy,
  api,
  refresh,
  mutate,
  onReport,
}: {
  incidents: Incident[];
  ready: boolean;
  loading: boolean;
  operator: boolean;
  disabled: boolean;
  busy: string;
  api: WorkspaceApi;
  refresh: () => Promise<void>;
  mutate: Mutation;
  onReport: (form: HTMLFormElement) => Promise<string | undefined>;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const detail = useRef<HTMLElement>(null);
  const listHeading = useRef<HTMLHeadingElement>(null);
  const returnTarget = useRef<HTMLButtonElement | null>(null);
  const current = incidents.find((i) => i.id === selected);
  const visible = incidents.filter(
    (i) =>
      (filter === "ALL" || i.status === filter) &&
      `${i.description} ${i.id} ${i.triage?.summary ?? ""}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const focusDetail = () =>
    requestAnimationFrame(() => detail.current?.focus());
  function back() {
    setSelected(null);
    setComposing(false);
    requestAnimationFrame(() => {
      if (returnTarget.current?.isConnected) returnTarget.current.focus();
      else listHeading.current?.focus();
    });
  }
  return (
    <div
      className={`incidents-workbench${selected || composing ? " has-detail" : ""}`}
    >
      <div className="workbench-toolbar">
        <div>
          <h2 ref={listHeading} tabIndex={-1}>
            {operator ? "Cola de atención" : "Mis incidencias"}
          </h2>
          <p>Últimos 50 reportes visibles para tu perfil.</p>
        </div>
        <button
          type="button"
          className="button button-primary"
          disabled={disabled}
          onClick={(event) => {
            returnTarget.current = event.currentTarget;
            setSelected(null);
            setComposing(true);
            focusDetail();
          }}
        >
          <Plus size={18} /> Nueva incidencia
        </button>
      </div>
      <div className="incident-columns">
        <section className="incident-inbox" aria-label="Lista de incidencias">
          <div className="queue-overview">
            {[
              ["ALL", "Todas"],
              ["OPEN", "Abiertas"],
              ["IN_PROGRESS", "En atención"],
              ["RESOLVED", "Resueltas"],
            ].map(([value, label]) => (
              <button
                type="button"
                key={value}
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
              >
                <span>{label}</span>
                <strong>
                  {ready
                    ? value === "ALL"
                      ? incidents.length
                      : incidents.filter((i) => i.status === value).length
                    : "—"}
                </strong>
              </button>
            ))}
          </div>
          <label className="search-field">
            <Search size={18} />
            <input
              aria-label="Buscar incidencias"
              placeholder="Descripción o número de reporte"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          {!ready && (
            <Empty>
              {loading
                ? "Cargando reportes…"
                : "No se pudieron actualizar los reportes. Usa Actualizar datos para reintentar."}
            </Empty>
          )}
          {ready && !incidents.length && (
            <Empty>
              Todavía no hay reportes. Crea una incidencia para comenzar su
              seguimiento.
            </Empty>
          )}
          {ready && incidents.length > 0 && !visible.length && (
            <Empty>
              No hay reportes con estos filtros. Cambia la búsqueda o el estado.
            </Empty>
          )}
          <div className="incident-selections">
            {visible.map((i) => (
              <button
                type="button"
                key={i.id}
                aria-pressed={selected === i.id}
                className="incident-selection"
                onClick={(event) => {
                  returnTarget.current = event.currentTarget;
                  setSelected(i.id);
                  setComposing(false);
                  focusDetail();
                }}
              >
                <span className="selection-meta">
                  <span>#{i.id.slice(0, 8)}</span>
                  <Badge value={i.status} />
                </span>
                <strong>
                  {i.triage?.summary || i.description.slice(0, 120)}
                </strong>
                <span className="selection-bottom">
                  <time dateTime={i.createdAt}>{date(i.createdAt)}</time>
                  {i.triage ? (
                    <Badge value={i.triage.priority} />
                  ) : (
                    <Badge value={i.aiStatus} />
                  )}
                  <ArrowUpRight size={16} />
                </span>
              </button>
            ))}
          </div>
        </section>
        <section
          className="incident-detail-pane"
          ref={detail}
          tabIndex={-1}
          aria-label={
            composing ? "Crear incidencia" : "Seguimiento del reporte"
          }
        >
          {(current || composing) && (
            <button
              type="button"
              className="text-link detail-back"
              onClick={back}
            >
              <ArrowLeft size={17} /> Volver a la lista
            </button>
          )}
          {composing ? (
            <IncidentComposer
              disabled={disabled}
              busy={busy === "report"}
              onReport={async (form) => {
                const id = await onReport(form);
                if (id) {
                  setSelected(id);
                  setComposing(false);
                  focusDetail();
                }
              }}
            />
          ) : current ? (
            <IncidentDetail
              incident={current}
              operator={operator}
              api={api}
              refresh={refresh}
              mutate={mutate}
              disabled={disabled}
              busy={busy}
            />
          ) : (
            <div className="incident-no-selection">
              <span className="flow-symbol" aria-hidden="true">
                ↗
              </span>
              <h3>Del reporte a la solución.</h3>
              <p>
                Selecciona una incidencia para revisar el contexto, la propuesta
                de IA y su seguimiento.
              </p>
              <div className="incident-process">
                <span>Reporte guardado</span>
                <span>Análisis con contexto</span>
                <span>Revisión humana</span>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
