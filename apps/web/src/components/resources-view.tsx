"use client";
import { Box, Check, Search } from "lucide-react";
import { useState } from "react";
import type { Mutation } from "./incident-detail";
import {
  Badge,
  date,
  Empty,
  type Loan,
  type Resource,
} from "./workspace-shared";
export function ResourcesView({
  resources,
  loans,
  ready,
  loansReady,
  loading,
  operator,
  disabled,
  mutate,
}: {
  resources: Resource[];
  loans: Loan[];
  ready: boolean;
  loansReady: boolean;
  loading: boolean;
  operator: boolean;
  disabled: boolean;
  mutate: Mutation;
}) {
  const [view, setView] = useState("inventory");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const visibleResources = resources.filter(
    (r) =>
      `${r.name} ${r.code}`.toLowerCase().includes(query.toLowerCase()) &&
      (filter === "ALL" ||
        (filter === "LOANED"
          ? r.loans.length > 0
          : r.status === filter &&
            (filter !== "AVAILABLE" || !r.loans.length))),
  );
  const visibleLoans = loans.filter(
    (l) =>
      `${l.resource.name} ${l.resource.code}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (filter === "ALL" ||
        (filter === "ACTIVE" ? !l.returnedAt : Boolean(l.returnedAt))),
  );
  return (
    <div className="resources-view">
      <fieldset className="view-switch" aria-label="Vista de recursos">
        <button
          type="button"
          aria-pressed={view === "inventory"}
          onClick={() => {
            setView("inventory");
            setFilter("ALL");
          }}
        >
          Inventario
        </button>
        <button
          type="button"
          aria-pressed={view === "loans"}
          onClick={() => {
            setView("loans");
            setFilter("ALL");
          }}
        >
          Préstamos
        </button>
      </fieldset>
      <div className="resource-tools">
        <label className="search-field">
          <Search size={18} />
          <input
            aria-label="Buscar recursos o préstamos"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nombre o código de equipo"
          />
        </label>
        <select
          aria-label="Filtrar recursos o préstamos"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {(view === "inventory"
            ? [
                ["ALL", "Todos los recursos"],
                ["AVAILABLE", "Disponibles para préstamo"],
                ["LOANED", "En préstamo"],
                ["MAINTENANCE", "Mantenimiento"],
                ["DISABLED", "Sin habilitar"],
              ]
            : [
                ["ALL", "Todos los préstamos"],
                ["ACTIVE", "Pendientes de devolución"],
                ["RETURNED", "Devueltos"],
              ]
          ).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <p className="field-help">
        Filtros sobre los registros cargados · hasta 50 préstamos visibles.
      </p>
      {view === "inventory" ? (
        <section aria-label="Inventario">
          <div className="section-title">
            <h2>Inventario</h2>
            <span className="subtle">
              Solo recursos registrados por el equipo.
            </span>
          </div>
          {!ready && (
            <Empty>
              {loading
                ? "Cargando inventario…"
                : "No se pudo actualizar el inventario. Usa Actualizar datos para reintentar."}
            </Empty>
          )}
          {ready && !resources.length && (
            <Empty>
              El inventario está vacío. Un operador puede registrar el primer
              recurso.
            </Empty>
          )}
          {visibleResources.map((r) => (
            <article className="record-row" key={r.id}>
              <Box size={23} />
              <div>
                <h3>{r.name}</h3>
                <p>
                  {r.code} ·{" "}
                  {r.loans.length ? "En préstamo" : "Sin préstamo activo"}
                </p>
                {(r.loans.length > 0 || r.status !== "AVAILABLE") && (
                  <p className="field-help">
                    {r.loans.length
                      ? "Debe devolverse antes de solicitar otro préstamo."
                      : r.status === "MAINTENANCE"
                        ? "En mantenimiento: no se puede prestar."
                        : "Un operador debe habilitar este recurso antes de prestarlo."}
                  </p>
                )}
              </div>
              <Badge value={r.status} />
              {operator && (
                <select
                  className="resource-state"
                  aria-label={`Estado de recurso ${r.name}`}
                  value={r.status}
                  disabled={disabled}
                  onChange={(e) =>
                    void mutate(r.id, `/resources/${r.id}`, "PATCH", {
                      status: e.target.value,
                    })
                  }
                >
                  <option value="DISABLED">Sin habilitar</option>
                  <option value="AVAILABLE">Habilitado</option>
                  <option value="MAINTENANCE">Mantenimiento</option>
                </select>
              )}
              <button
                type="button"
                className="button button-outline button-small"
                disabled={
                  disabled ||
                  r.status !== "AVAILABLE" ||
                  Boolean(r.loans.length)
                }
                onClick={() =>
                  void mutate(r.id, "/loans", "POST", { resourceId: r.id })
                }
              >
                {r.loans.length ? "En préstamo" : "Solicitar préstamo"}
              </button>
            </article>
          ))}
          {operator && (
            <details className="resource-create">
              <summary>Registrar un recurso</summary>
              <form
                className="resource-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const f = e.currentTarget;
                  const d = new FormData(f);
                  if (
                    await mutate("resource", "/resources", "POST", {
                      code: d.get("code"),
                      name: d.get("name"),
                      source: d.get("source"),
                      status: d.get("status"),
                    })
                  )
                    f.reset();
                }}
              >
                <label>
                  Código
                  <input
                    name="code"
                    minLength={2}
                    maxLength={50}
                    required
                    disabled={disabled}
                  />
                </label>
                <label>
                  Nombre
                  <input
                    name="name"
                    minLength={2}
                    maxLength={150}
                    required
                    disabled={disabled}
                  />
                </label>
                <label>
                  Procedencia del inventario
                  <input
                    name="source"
                    minLength={3}
                    maxLength={300}
                    required
                    disabled={disabled}
                  />
                </label>
                <label>
                  Estado
                  <select name="status" disabled={disabled}>
                    <option value="DISABLED">Sin habilitar</option>
                    <option value="AVAILABLE">Habilitado</option>
                    <option value="MAINTENANCE">Mantenimiento</option>
                  </select>
                </label>
                <button
                  type="submit"
                  disabled={disabled}
                  className="button button-primary"
                >
                  Registrar recurso
                </button>
              </form>
            </details>
          )}
          {ready && resources.length > 0 && !visibleResources.length && (
            <Empty>No hay recursos con estos filtros.</Empty>
          )}
        </section>
      ) : (
        <section aria-label="Préstamos">
          {" "}
          <h2 className="list-heading">Préstamos</h2>
          {loansReady && !loans.length && (
            <Empty>No hay préstamos registrados.</Empty>
          )}
          {visibleLoans.map((l) => (
            <article className="record-row" key={l.id}>
              <div>
                <h3>{l.resource.name}</h3>
                <small>{date(l.createdAt)}</small>
              </div>
              {l.returnedAt ? (
                <span className="status-badge">
                  <Check size={13} /> Devuelto
                </span>
              ) : operator ? (
                <button
                  type="button"
                  disabled={disabled}
                  className="button button-outline button-small"
                  onClick={() => void mutate(l.id, `/loans/${l.id}/return`)}
                >
                  Registrar devolución
                </button>
              ) : (
                <span className="status-badge">Pendiente de devolución</span>
              )}
            </article>
          ))}
          {!loansReady && (
            <Empty>
              {loading
                ? "Cargando préstamos…"
                : "No se pudieron actualizar los préstamos."}
            </Empty>
          )}
          {loansReady && loans.length > 0 && !visibleLoans.length && (
            <Empty>No hay préstamos con estos filtros.</Empty>
          )}
        </section>
      )}
    </div>
  );
}
