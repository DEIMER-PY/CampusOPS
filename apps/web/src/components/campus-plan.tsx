"use client";
import {
  Download,
  Focus,
  MapPin,
  Maximize2,
  Minus,
  Plus,
  Search,
  Workflow,
} from "lucide-react";
import { useRef, useState } from "react";

type Space = { id: string; name: string; capacity: number; status: string };
export function CampusPlan({
  spaces,
  ready,
  onReserve,
}: {
  spaces: Space[];
  ready: boolean;
  onReserve: (id: string) => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [original, setOriginal] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("");
  const viewport = useRef<HTMLDivElement>(null);
  const active = spaces.find((space) => space.id === selected);
  const reset = () => {
    setZoom(1);
    viewport.current?.scrollTo({ top: 0, left: 0 });
  };
  return (
    <section className="campus-plan">
      <div className="plan-shell">
        <header className="plan-header">
          <div className="plan-identity">
            <span className="composer-symbol">
              <MapPin size={21} />
            </span>
            <div>
              <h2>Torre Zenith</h2>
              <p>Nivel 6 · Planta arquitectónica · 2.560 m²</p>
            </div>
          </div>
          <a
            className="text-link"
            href="/plans/torre-zenith-nivel-6.pdf"
            download
          >
            <Download size={15} /> PDF original
          </a>
        </header>
        <div className="plan-toolbar">
          <fieldset
            className="plan-view-switch"
            aria-label="Presentación del plano"
          >
            <button
              type="button"
              aria-pressed={!original}
              onClick={() => setOriginal(false)}
            >
              Integrado
            </button>
            <button
              type="button"
              aria-pressed={original}
              onClick={() => setOriginal(true)}
            >
              Original
            </button>
          </fieldset>
          <div className="plan-zoom">
            <button
              type="button"
              aria-label="Reducir plano"
              disabled={zoom <= 1}
              onClick={() => setZoom(Math.max(1, zoom - 0.25))}
            >
              <Minus size={16} />
            </button>
            <output aria-live="polite">{Math.round(zoom * 100)} %</output>
            <button
              type="button"
              aria-label="Ampliar plano"
              disabled={zoom >= 3}
              onClick={() => setZoom(Math.min(3, zoom + 0.25))}
            >
              <Plus size={16} />
            </button>
            <button
              type="button"
              aria-label="Ajustar plano a la vista"
              onClick={reset}
            >
              <Focus size={17} />
            </button>
            <button
              type="button"
              aria-label={
                expanded
                  ? "Reducir vista del plano"
                  : "Expandir vista del plano"
              }
              aria-expanded={expanded}
              onClick={() => setExpanded(!expanded)}
            >
              <Maximize2 size={16} />
            </button>
          </div>
        </div>
        <div className="plan-layout">
          <div className="plan-map-area">
            <section
              className={`plan-viewport${original ? " plan-original" : ""}${expanded ? " plan-expanded" : ""}`}
              ref={viewport}
              // biome-ignore lint/a11y/noNoninteractiveTabindex: Scroll regions require keyboard access.
              tabIndex={0}
              aria-label="Plano del campus ampliable; usa las flechas para recorrerlo"
            >
              <div
                className="plan-drawing"
                style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }}
              >
                <svg
                  viewBox="80 310 2070 1000"
                  className="plan-blueprint"
                  role="img"
                  aria-labelledby="campus-plan-title"
                >
                  <title id="campus-plan-title">
                    Planta arquitectónica del nivel 6 de Torre Zenith, orientada
                    horizontalmente. Sin ubicaciones de salas vinculadas.
                  </title>
                  <image
                    href="/plans/torre-zenith-nivel-6.webp"
                    width={1700}
                    height={2200}
                    transform="translate(2200 0) rotate(90)"
                  />
                </svg>
              </div>
            </section>
            <div className="plan-caption">
              <span>
                <MapPin size={14} /> Vista centrada del plano aportado
              </span>
              <span>Posiciones de salas pendientes de vincular</span>
            </div>
          </div>
          <aside className="plan-directory" aria-label="Catálogo de espacios">
            <h3>
              Espacios del catálogo <span>{ready ? spaces.length : "—"}</span>
            </h3>
            <label className="search-field">
              <Search size={15} />
              <input
                aria-label="Buscar espacio en el catálogo del plano"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar espacio"
              />
            </label>
            <p>
              Selecciona para consultar su aforo y estado. Aún no hay
              coordenadas verificadas.
            </p>
            <div className="plan-room-list">
              {!ready ? (
                <p>Cargando catálogo…</p>
              ) : (
                spaces
                  .filter((space) =>
                    space.name.toLowerCase().includes(query.toLowerCase()),
                  )
                  .map((space) => (
                    <button
                      type="button"
                      key={space.id}
                      aria-pressed={selected === space.id}
                      onClick={() => setSelected(space.id)}
                    >
                      <span
                        className={`plan-room-dot ${space.status === "AVAILABLE" ? "available" : ""}`}
                      />
                      <span>
                        {space.name}
                        <small>
                          {space.capacity} personas ·{" "}
                          {space.status === "AVAILABLE"
                            ? "Habilitado"
                            : space.status === "MAINTENANCE"
                              ? "Mantenimiento"
                              : "Sin habilitar"}
                        </small>
                      </span>
                    </button>
                  ))
              )}
              {ready &&
                !spaces.some((space) =>
                  space.name.toLowerCase().includes(query.toLowerCase()),
                ) && <p>No hay espacios con ese nombre.</p>}
            </div>
            {active && (
              <div className="plan-room-selection">
                <strong>{active.name}</strong>
                <p>Esta selección no señala una posición en el plano.</p>
                <button
                  className="button button-primary button-small"
                  type="button"
                  disabled={active.status !== "AVAILABLE"}
                  onClick={() => onReserve(active.id)}
                >
                  Solicitar reserva
                </button>
              </div>
            )}
          </aside>
        </div>
      </div>
      <aside className="integration-pending">
        <Workflow size={20} />
        <div>
          <h3>Flujo de agenda con n8n</h3>
          <p>
            El webhook de Tomas sigue pendiente. Las propuestas deberán validar
            aforo, estado y cruces antes de aplicarse.
          </p>
        </div>
        <span className="status-badge">Pendiente de conexión</span>
      </aside>
    </section>
  );
}
