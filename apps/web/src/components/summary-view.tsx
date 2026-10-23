"use client";
import {
  ArrowUpRight,
  Box,
  CalendarDays,
  CircleAlert,
  Grid2X2,
  List,
  Search,
} from "lucide-react";
import { useState } from "react";
import {
  Badge,
  date,
  type Incident,
  type Loan,
  type Reservation,
  type Resource,
  type Space,
  type Tab,
} from "./workspace-shared";

export function SummaryView({
  incidents,
  loans,
  resources,
  spaces,
  reservations,
  ready,
  loading,
  updatedAt,
  onNavigate,
}: {
  incidents: Incident[];
  loans: Loan[];
  resources: Resource[];
  spaces: Space[];
  reservations: Reservation[];
  ready: Record<string, boolean>;
  loading: boolean;
  updatedAt: string | null;
  onNavigate: (tab: Tab) => void;
}) {
  const [view, setView] = useState<"list" | "grid">("list");
  const [query, setQuery] = useState("");
  const pending = incidents.filter((item) => item.status !== "RESOLVED");
  const activeLoans = loans.filter((item) => !item.returnedAt);
  const catalog = resources.filter((item) =>
    `${item.name} ${item.code}`
      .toLocaleLowerCase("es")
      .includes(query.toLocaleLowerCase("es")),
  );
  const unavailable = (module: string) =>
    loading
      ? `Cargando ${module}…`
      : `${module} sin actualizar. Usa Actualizar datos para reintentar.`;
  return (
    <div className="operations-summary console-overview">
      <p className="summary-freshness">
        {loading
          ? "Actualizando registros…"
          : updatedAt
            ? `Última actualización completa: ${date(updatedAt)}. Refresco manual.`
            : "Aún no hay una actualización completa."}
      </p>
      <dl className="summary-workload console-stats">
        {[
          {
            label: "Incidencias por atender",
            value: pending.length,
            key: "incidents",
            icon: CircleAlert,
          },
          {
            label: "Préstamos por devolver",
            value: activeLoans.length,
            key: "loans",
            icon: Box,
          },
          {
            label: "Espacios habilitados",
            value: spaces.filter((item) => item.status === "AVAILABLE").length,
            key: "spaces",
            icon: Grid2X2,
          },
        ].map(({ label, value, key, icon: Icon }) => (
          <div key={key}>
            <dt>
              <Icon size={16} />
              {label}
            </dt>
            <dd>{ready[key] ? value : "—"}</dd>
            <span>En los registros cargados</span>
          </div>
        ))}
      </dl>
      <div className="console-columns">
        <div className="console-primary">
          <section className="console-panel">
            <header>
              <div>
                <span className="console-section-code">OPERACIÓN / 01</span>
                <h2>Cola de atención</h2>
              </div>
              <button
                type="button"
                className="text-link"
                onClick={() => onNavigate("incidents")}
              >
                Ver reportes <ArrowUpRight size={16} />
              </button>
            </header>
            {ready.incidents ? (
              pending.length ? (
                <div className="console-queue">
                  {pending.slice(0, 4).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onNavigate("incidents")}
                    >
                      <span className="console-queue-icon">
                        <CircleAlert size={18} />
                      </span>
                      <span>
                        <strong>
                          {item.triage?.summary ||
                            item.description.slice(0, 100)}
                        </strong>
                        <small>
                          #{item.id.slice(0, 8)} · {date(item.createdAt)}
                        </small>
                      </span>
                      <Badge value={item.status} />
                      <ArrowUpRight size={16} />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="console-empty">
                  Sin incidencias pendientes en los registros cargados.
                </p>
              )
            ) : (
              <p className="console-empty">{unavailable("Incidencias")}</p>
            )}
          </section>
          <section className="console-panel">
            <header>
              <div>
                <span className="console-section-code">INVENTARIO / 02</span>
                <h2>Recursos del campus</h2>
              </div>
              <button
                type="button"
                className="text-link"
                onClick={() => onNavigate("resources")}
              >
                Gestionar <ArrowUpRight size={16} />
              </button>
            </header>
            <div className="console-catalog-toolbar">
              <label className="console-search">
                <Search size={17} />
                <input
                  aria-label="Buscar en el resumen de recursos"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Nombre o código de equipo"
                  type="search"
                />
              </label>
              <fieldset
                className="console-view-switch"
                aria-label="Presentación de recursos"
              >
                <button
                  type="button"
                  aria-label="Ver recursos como lista"
                  aria-pressed={view === "list"}
                  onClick={() => setView("list")}
                >
                  <List size={18} />
                </button>
                <button
                  type="button"
                  aria-label="Ver recursos como tarjetas"
                  aria-pressed={view === "grid"}
                  onClick={() => setView("grid")}
                >
                  <Grid2X2 size={18} />
                </button>
              </fieldset>
            </div>
            <p className="console-scope">
              {ready.resources
                ? `${catalog.length} de ${resources.length} recursos cargados`
                : unavailable("Recursos")}
            </p>
            {ready.resources &&
              (catalog.length ? (
                <div className={`console-catalog is-${view}`}>
                  {catalog.slice(0, 6).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="console-resource"
                      onClick={() => onNavigate("resources")}
                    >
                      <span className="resource-monogram">
                        <Box size={22} strokeWidth={1.5} />
                      </span>
                      <span>
                        <strong>{item.name}</strong>
                        <small>{item.code}</small>
                      </span>
                      <div>
                        <Badge value={item.status} />
                        <small>
                          {item.loans.length
                            ? "Préstamo activo"
                            : "Sin préstamo activo"}
                        </small>
                      </div>
                      <ArrowUpRight size={16} />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="console-empty">
                  {query
                    ? "No hay recursos con esta búsqueda."
                    : "Todavía no hay recursos cargados."}
                </p>
              ))}
            {catalog.length > 6 && (
              <p className="console-scope">
                Vista previa de 6 resultados. Abre Recursos y préstamos para
                consultar el resto.
              </p>
            )}
          </section>
        </div>
        <aside
          className="console-context"
          aria-label="Contexto de la operación"
        >
          <section className="console-panel">
            <header>
              <h2>Préstamos activos</h2>
              <Box size={17} />
            </header>
            {ready.loans ? (
              activeLoans.length ? (
                activeLoans.slice(0, 4).map((item) => (
                  <div className="console-loan" key={item.id}>
                    <span>
                      <strong>{item.resource.name}</strong>
                      <small>{item.resource.code}</small>
                    </span>
                    <span className="loan-marker">Por devolver</span>
                  </div>
                ))
              ) : (
                <p className="console-empty">
                  Sin préstamos activos en los registros cargados.
                </p>
              )
            ) : (
              <p className="console-empty">{unavailable("Préstamos")}</p>
            )}
            <button
              className="console-panel-action"
              type="button"
              onClick={() => onNavigate("resources")}
            >
              Consultar préstamos <ArrowUpRight size={16} />
            </button>
          </section>
          <section className="console-panel">
            <header>
              <h2>Seguimiento</h2>
              <CircleAlert size={17} />
            </header>
            <section
              className="console-distribution"
              aria-label="Distribución de incidencias cargadas"
            >
              {[
                ["OPEN", "Abiertas"],
                ["IN_PROGRESS", "En atención"],
                ["RESOLVED", "Resueltas"],
              ].map(([status, label]) => (
                <div key={status}>
                  <span>{label}</span>
                  <strong>
                    {ready.incidents
                      ? incidents.filter((item) => item.status === status)
                          .length
                      : "—"}
                  </strong>
                  {ready.incidents && (
                    <meter
                      aria-label={label}
                      min={0}
                      max={Math.max(incidents.length, 1)}
                      value={
                        incidents.filter((item) => item.status === status)
                          .length
                      }
                    />
                  )}
                </div>
              ))}
            </section>
            <p className="console-scope">
              {ready.incidents
                ? `${incidents.length} ${incidents.length === 1 ? "reporte cargado" : "reportes cargados"} · hasta 50 visibles.`
                : unavailable("Incidencias")}
            </p>
          </section>
          <section className="console-panel">
            <header>
              <h2>Reservas recientes</h2>
              <CalendarDays size={17} />
            </header>
            {ready.reservations ? (
              reservations.length ? (
                reservations.slice(0, 2).map((item) => (
                  <div className="console-loan" key={item.id}>
                    <span>
                      <strong>{item.space.name}</strong>
                      <small>{date(item.startAt)}</small>
                    </span>
                    <span>{item.cancelledAt ? "Cancelada" : "Registrada"}</span>
                  </div>
                ))
              ) : (
                <p className="console-empty">
                  Sin reservas en los registros cargados.
                </p>
              )
            ) : (
              <p className="console-empty">{unavailable("Reservas")}</p>
            )}
            <button
              className="console-panel-action"
              type="button"
              onClick={() => onNavigate("reservations")}
            >
              Consultar reservas <ArrowUpRight size={16} />
            </button>
          </section>
        </aside>
      </div>
      <p className="field-help">
        Recuentos de los últimos registros cargados, hasta 50 operaciones por
        módulo. No representan el total histórico del campus. Los espacios
        habilitados requieren validar el horario al reservar.
      </p>
    </div>
  );
}
