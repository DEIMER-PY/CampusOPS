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
import { useEffect, useRef, useState } from "react";

type Space = { id: string; name: string; capacity: number; status: string };
export function CampusPlan({
  spaces,
  ready,
  onReserve,
  canLink = false,
}: {
  spaces: Space[];
  ready: boolean;
  onReserve: (id: string) => void;
  canLink?: boolean;
}) {
  const [zoom, setZoom] = useState(1);
  const [original, setOriginal] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("");
  const viewport = useRef<HTMLDivElement>(null);
  const active = spaces.find((space) => space.id === selected);
  const [positions, setPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const [focused, setFocused] = useState(false);
  const [linking, setLinking] = useState(false);
  const [draft, setDraft] = useState<{ x: number; y: number } | null>(null);
  const [linkNotice, setLinkNotice] = useState("");
  const drawing = useRef<SVGSVGElement>(null);
  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(
        localStorage.getItem("campusflow-plan-links-v1") || "{}",
      );
      if (saved && typeof saved === "object")
        setPositions(
          Object.fromEntries(
            Object.entries(saved).filter(
              ([, point]) =>
                point &&
                typeof point === "object" &&
                Number.isFinite(point.x) &&
                Number.isFinite(point.y) &&
                point.x >= 80 &&
                point.x <= 2150 &&
                point.y >= 310 &&
                point.y <= 1310,
            ),
          ),
        );
    } catch {
      setLinkNotice("No se pudieron recuperar las vinculaciones locales.");
    }
  }, []);
  const point = linking ? draft : positions[selected];
  function choose(id: string) {
    setSelected(id);
    setLinking(false);
    setDraft(null);
    setLinkNotice("");
    reset();
    setFocused(true);
  }
  function savePosition() {
    if (!draft || !selected) return;
    const next = { ...positions, [selected]: draft };
    setPositions(next);
    setFocused(true);
    setLinking(false);
    setDraft(null);
    try {
      localStorage.setItem("campusflow-plan-links-v1", JSON.stringify(next));
      setLinkNotice(
        "Posición vinculada en este navegador. No modifica el plano oficial.",
      );
    } catch {
      setLinkNotice(
        "Posición disponible en esta sesión; el navegador no permitió guardarla.",
      );
    }
  }

  const reset = () => {
    setZoom(1);
    setFocused(false);
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
                  ref={drawing}
                  role="img"
                  aria-labelledby="campus-plan-title"
                >
                  <title id="campus-plan-title">
                    Planta arquitectónica del nivel 6 de Torre Zenith, orientada
                    horizontalmente. Los marcadores son vinculaciones manuales
                    del navegador.
                  </title>
                  <g
                    className="plan-camera"
                    style={{
                      transform:
                        point && !linking && focused
                          ? `translate(${1115 - point.x * 1.8}px, ${810 - point.y * 1.8}px) scale(1.8)`
                          : "none",
                    }}
                  >
                    <image
                      href="/plans/torre-zenith-nivel-6.webp"
                      width={1700}
                      height={2200}
                      transform="translate(2200 0) rotate(90)"
                    />
                    {point && (
                      <g className="plan-selection-marker">
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r={65}
                          fill="#23b5ff33"
                          stroke="#73c7ff"
                          strokeWidth={5}
                        />
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r={12}
                          fill="#73c7ff"
                        />
                        <text
                          x={point.x}
                          y={point.y - 85}
                          textAnchor="middle"
                          fill="#ffffff"
                          stroke="#111111"
                          strokeWidth={8}
                          paintOrder="stroke"
                          fontSize={32}
                        >
                          {active?.name}
                        </text>
                      </g>
                    )}
                  </g>
                </svg>
                {linking && (
                  <button
                    type="button"
                    className="plan-link-surface"
                    aria-label={`Marcar posición de ${active?.name}; usa las flechas para ajustar y el botón Guardar posición para confirmar`}
                    onClick={(event) => {
                      if (event.detail === 0) {
                        setDraft((current) => current || { x: 1115, y: 810 });
                        return;
                      }
                      const svg = drawing.current,
                        matrix = svg?.getScreenCTM();
                      if (!svg || !matrix) return;
                      const cursor = svg.createSVGPoint();
                      cursor.x = event.clientX;
                      cursor.y = event.clientY;
                      const position = cursor.matrixTransform(matrix.inverse());
                      if (
                        position.x >= 80 &&
                        position.x <= 2150 &&
                        position.y >= 310 &&
                        position.y <= 1310
                      )
                        setDraft({ x: position.x, y: position.y });
                    }}
                    onKeyDown={(event) => {
                      const delta: Record<string, [number, number]> = {
                        ArrowUp: [0, -20],
                        ArrowDown: [0, 20],
                        ArrowLeft: [-20, 0],
                        ArrowRight: [20, 0],
                      };
                      if (!delta[event.key]) return;
                      event.preventDefault();
                      const [x, y] = delta[event.key];
                      setDraft((current) => ({
                        x: Math.max(
                          80,
                          Math.min(2150, (current?.x || 1115) + x),
                        ),
                        y: Math.max(
                          310,
                          Math.min(1310, (current?.y || 810) + y),
                        ),
                      }));
                    }}
                  >
                    <span>
                      Marca {active?.name} sobre el plano · Flechas para ajustar
                      con teclado
                    </span>
                  </button>
                )}
              </div>
            </section>
            <div className="plan-caption">
              <span>
                <MapPin size={14} /> Vista centrada del plano aportado
              </span>
              <span>
                {point
                  ? "Marcador manual local · no es una ubicación verificada"
                  : "Selecciona una sala para explorar su ubicación vinculada"}
              </span>
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
              Selecciona una sala para acercar su marcador. Las posiciones se
              vinculan manualmente; no hay coordenadas oficiales verificadas.
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
                      onClick={() => choose(space.id)}
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
                <p>
                  {positions[selected]
                    ? "Marcador vinculado manualmente en este navegador."
                    : "Esta sala todavía no tiene una posición vinculada."}
                </p>
                {canLink && (
                  <div className="plan-link-actions">
                    {linking ? (
                      <>
                        <button
                          className="button button-primary"
                          type="button"
                          disabled={!draft}
                          onClick={savePosition}
                        >
                          Guardar posición
                        </button>
                        <button
                          className="button button-outline"
                          type="button"
                          onClick={() => {
                            setLinking(false);
                            setDraft(null);
                          }}
                        >
                          Cancelar vinculación
                        </button>
                      </>
                    ) : (
                      <button
                        className="button button-outline"
                        type="button"
                        onClick={() => {
                          setZoom(1);
                          setDraft(positions[selected] || null);
                          setLinking(true);
                        }}
                      >
                        Vincular posición en el plano
                      </button>
                    )}
                  </div>
                )}
                {canLink && positions[selected] && !linking && (
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => {
                      const next = { ...positions };
                      delete next[selected];
                      setPositions(next);
                      setFocused(false);
                      try {
                        localStorage.setItem(
                          "campusflow-plan-links-v1",
                          JSON.stringify(next),
                        );
                        setLinkNotice("Marcador local eliminado.");
                      } catch {
                        setLinkNotice(
                          "Marcador retirado de esta sesión; el navegador no permitió actualizar el guardado.",
                        );
                      }
                    }}
                  >
                    Quitar marcador local
                  </button>
                )}
                {linkNotice && <p role="status">{linkNotice}</p>}
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
          <h3>Agenda y validación de horarios</h3>
          <p>
            Los marcadores y las plantillas no reservan espacios. Cada solicitud
            debe validar aforo, estado y cruces en el servidor.
          </p>
        </div>
        <span className="status-badge">Validación en servidor</span>
      </aside>
    </section>
  );
}
