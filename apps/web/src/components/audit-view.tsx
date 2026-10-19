"use client";
import {
  ArrowUpRight,
  CalendarDays,
  ClipboardList,
  Filter,
  Search,
  X,
} from "lucide-react";
import { useState } from "react";
import { type Audit, auditAction, date } from "./workspace-shared";

const domains: Record<string, string> = {
  reservation: "Reservas",
  incident: "Incidencias",
  loan: "Préstamos",
  resource: "Recursos",
  space: "Espacios",
  schedule: "Horarios",
};
const day = (value: string) =>
  new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    dateStyle: "long",
  }).format(new Date(value));
export function AuditView({
  events,
  ready,
  loading,
}: {
  events: Audit[];
  ready: boolean;
  loading: boolean;
}) {
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState("ALL");
  const [selected, setSelected] = useState<string | null>(null);
  const filtered = events.filter(
    (event) =>
      (domain === "ALL" || event.action.split(".")[0] === domain) &&
      `${auditAction(event.action)} ${event.action} ${event.entityId}`
        .toLocaleLowerCase("es")
        .includes(query.toLocaleLowerCase("es")),
  );
  const active = events.find((event) => event.id === selected);
  const groups = Map.groupBy(filtered, (event) => day(event.createdAt));
  return (
    <div className="event-journal">
      <div className="journal-toolbar">
        <label className="search-field">
          <Search size={17} />
          <input
            aria-label="Buscar en el historial"
            placeholder="Evento o referencia…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label className="journal-filter">
          <Filter size={16} />
          <select
            aria-label="Filtrar eventos por módulo"
            value={domain}
            onChange={(event) => setDomain(event.target.value)}
          >
            <option value="ALL">Todos los módulos</option>
            {Object.entries(domains).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="field-help">
        {ready
          ? `${filtered.length} de ${events.length} eventos cargados · solo lectura · hora de Colombia`
          : loading
            ? "Cargando historial…"
            : "No se pudo actualizar el historial. Reintenta con Actualizar datos."}
      </p>
      <div className="journal-layout">
        <section aria-label="Eventos del campus">
          {ready && !filtered.length && (
            <div className="journal-empty">
              <ClipboardList size={28} />
              <h2>
                {events.length ? "Sin coincidencias" : "Todavía no hay eventos"}
              </h2>
              <p>
                {events.length
                  ? "Prueba otro módulo o una búsqueda más corta."
                  : "Aquí aparecerán los cambios guardados en el sistema."}
              </p>
            </div>
          )}
          {[...groups].map(([label, items]) => (
            <section className="journal-day" key={label}>
              <h2>
                <CalendarDays size={16} />
                {label}
                <span>{items.length}</span>
              </h2>
              <ol>
                {items.map((event) => (
                  <li key={event.id}>
                    <button
                      type="button"
                      aria-pressed={selected === event.id}
                      onClick={() => setSelected(event.id)}
                    >
                      <time dateTime={event.createdAt}>
                        {new Intl.DateTimeFormat("es-CO", {
                          timeZone: "America/Bogota",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(event.createdAt))}
                      </time>
                      <span
                        className={`journal-node ${/failed|pending|cancelled|maintenance/.test(event.action) ? "needs-review" : ""}`}
                      />
                      <span>
                        <strong>{auditAction(event.action)}</strong>
                        <small>
                          {domains[event.action.split(".")[0]] || "Sistema"} ·
                          Referencia #{event.entityId.slice(0, 8)}
                        </small>
                      </span>
                      <ArrowUpRight size={16} />
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </section>
        <aside className="journal-detail" aria-label="Detalle del evento">
          {active ? (
            <>
              <div className="section-title">
                <span>Ficha del evento</span>
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Cerrar detalle del evento"
                  onClick={() => setSelected(null)}
                >
                  <X size={17} />
                </button>
              </div>
              <ClipboardList size={26} />
              <h2>{auditAction(active.action)}</h2>
              <p>{date(active.createdAt)}</p>
              <dl>
                <div>
                  <dt>Módulo</dt>
                  <dd>{domains[active.action.split(".")[0]] || "Sistema"}</dd>
                </div>
                <div>
                  <dt>Referencia del registro</dt>
                  <dd>{active.entityId}</dd>
                </div>
                <div>
                  <dt>Identificador del evento</dt>
                  <dd>{active.id}</dd>
                </div>
              </dl>
              <details>
                <summary>Ver identificador técnico</summary>
                <code>{active.action}</code>
              </details>
              <p className="field-help">
                Este historial conserva el evento registrado. No permite
                editarlo ni reconstruir datos que el servidor no haya incluido.
              </p>
            </>
          ) : (
            <>
              <ClipboardList size={30} />
              <h2>Cada cambio, con su contexto.</h2>
              <p>
                Selecciona un evento para consultar su módulo, fecha y
                referencia completa.
              </p>
              <span className="status-badge">Registro de solo lectura</span>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
