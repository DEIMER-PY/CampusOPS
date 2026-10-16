"use client";
import { createBrowserClient } from "@supabase/ssr";
import {
  ArrowLeft,
  ArrowRight,
  Box,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardList,
  Grid2X2,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";
import { Brand } from "./brand";

type Tab =
  | "summary"
  | "spaces"
  | "reservations"
  | "resources"
  | "incidents"
  | "audit";
type Space = { id: string; name: string; capacity: number; status: string };
type Reservation = {
  id: string;
  space: Space;
  startAt: string;
  endAt: string;
  purpose: string;
  cancelledAt: string | null;
};
type Resource = {
  id: string;
  name: string;
  code: string;
  status: string;
  loans: { id: string }[];
};
type Loan = {
  id: string;
  resource: { name: string; code: string };
  createdAt: string;
  returnedAt: string | null;
};
type Triage = {
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
type Incident = {
  id: string;
  description: string;
  aiStatus: string;
  aiError: string | null;
  status: string;
  triage: Triage | null;
  createdAt: string;
};
type Audit = {
  id: string;
  action: string;
  entityId: string;
  createdAt: string;
};
const nav = [
  { key: "summary", label: "Resumen", icon: LayoutDashboard },
  { key: "spaces", label: "Espacios", icon: Grid2X2 },
  { key: "reservations", label: "Reservas", icon: CalendarDays },
  { key: "resources", label: "Recursos y préstamos", icon: Box },
  { key: "incidents", label: "Incidencias e IA", icon: Sparkles },
  { key: "audit", label: "Auditoría", icon: ClipboardList },
] as const;
const titles: Record<Tab, [string, string]> = {
  summary: [
    "Tu campus, en perspectiva.",
    "Consulta la actividad y decide tu siguiente paso.",
  ],
  spaces: [
    "Espacios del campus",
    "Consulta el aforo y solicita el horario que necesitas.",
  ],
  reservations: ["Reservas", "Cada horario confirmado, en un mismo lugar."],
  resources: [
    "Recursos y préstamos",
    "Consulta el inventario y lleva el seguimiento de tus recursos.",
  ],
  incidents: [
    "Resolver empieza por entender.",
    "Reporta una incidencia. La IA ayuda a encontrar su camino.",
  ],
  audit: [
    "Historial de operaciones",
    "Trazabilidad de los cambios guardados en el sistema.",
  ],
};
const labels: Record<string, string> = {
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
const date = (v: string) =>
  new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(v));
function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="empty-state">
      <ClipboardList size={26} />
      <p>{children}</p>
    </div>
  );
}
function Badge({ value }: { value: string }) {
  return (
    <span className={`status-badge status-${value.toLowerCase()}`}>
      {labels[value] || value}
    </span>
  );
}

export function Workspace({
  configured,
  initialRole = "CLIENT",
  administrative = false,
  connectionMessage = "",
}: {
  configured: boolean;
  initialRole?: string;
  administrative?: boolean;
  connectionMessage?: string;
}) {
  const [tab, setTab] = useState<Tab>("incidents");
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [audit, setAudit] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [query, setQuery] = useState("");
  const [selectedSpace, setSelectedSpace] = useState("");
  const formId = useId();
  const operator = ["ADMIN", "OPERATOR"].includes(initialRole);
  const api = useCallback(
    async <T,>(path: string, method = "GET", body?: unknown): Promise<T> => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      if (!url || !key)
        throw new Error("Conecta Supabase para utilizar el sistema.");
      const client = createBrowserClient(url, key);
      const {
        data: { session },
      } = await client.auth.getSession();
      if (!session) throw new Error("Tu sesión venció. Vuelve a ingresar.");
      const response = await fetch(`/api${path}`, {
        method,
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(35_000),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.error?.message ||
            "No se completó la solicitud. Intenta de nuevo.",
        );
      return result.data as T;
    },
    [],
  );
  const refresh = useCallback(async () => {
    if (!configured) return;
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        api<Space[]>("/spaces"),
        api<Reservation[]>("/reservations"),
        api<Resource[]>("/resources"),
        api<Loan[]>("/loans"),
        api<Incident[]>("/incidents"),
        initialRole === "ADMIN"
          ? api<Audit[]>("/admin/audit")
          : Promise.resolve([] as Audit[]),
      ] as const);
      const [s, r, equipment, l, i, a] = results;
      if (s.status === "fulfilled") setSpaces(s.value);
      if (r.status === "fulfilled") setReservations(r.value);
      if (equipment.status === "fulfilled") setResources(equipment.value);
      if (l.status === "fulfilled") setLoans(l.value);
      if (i.status === "fulfilled") setIncidents(i.value);
      if (a.status === "fulfilled") setAudit(a.value);
      const names = [
        "espacios",
        "reservas",
        "inventario",
        "préstamos",
        "incidencias",
        "auditoría",
      ];
      const failed = results.flatMap((result, index) =>
        result.status === "rejected" ? [names[index]] : [],
      );
      if (failed.length)
        setError(
          `No se pudo actualizar: ${failed.join(", ")}. Los demás módulos siguen disponibles. Pulsa actualizar para reintentar.`,
        );
      setLoaded(results.some((result) => result.status === "fulfilled"));
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No pudimos cargar los datos. Actualiza para reintentar.",
      );
    } finally {
      setLoading(false);
    }
  }, [api, configured, initialRole]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  async function mutate(
    key: string,
    path: string,
    method = "POST",
    body?: unknown,
  ) {
    if (busy) return false;
    setBusy(key);
    setError("");
    setNotice("");
    try {
      await api(path, method, body);
      setNotice("Cambio guardado.");
      await refresh();
      return true;
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No fue posible guardar. Reintenta.",
      );
      return false;
    } finally {
      setBusy("");
    }
  }
  async function report(form: HTMLFormElement) {
    if (busy) return;
    setBusy("report");
    setError("");
    setNotice("");
    try {
      const record = await api<Incident>("/incidents", "POST", {
        description: String(new FormData(form).get("description")),
      });
      form.reset();
      setNotice("Reporte guardado. Analizando con Groq…");
      await refresh();
      try {
        await api(`/incidents/${record.id}/triage`, "POST");
        setNotice("Reporte guardado y analizado. Revisa la sugerencia de IA.");
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Reporte guardado; análisis pendiente.",
        );
        setNotice("");
      }
      await refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No pudimos guardar tu reporte.",
      );
    } finally {
      setBusy("");
    }
  }
  async function signOut() {
    const client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "",
    );
    const { error } = await client.auth.signOut();
    if (error) {
      setError("No se pudo cerrar la sesión. Reintenta.");
      return;
    }
    window.location.assign("/login");
  }
  const active = nav.find((n) => n.key === tab);
  const disabled = !configured || Boolean(busy) || loading;
  return (
    <div className="workspace-shell">
      <aside className="workspace-sidebar">
        <Brand />
        <div className="workspace-label">
          {administrative ? "Administración" : "Mi espacio de trabajo"}
        </div>
        <nav aria-label="Módulos">
          {nav
            .filter((n) => n.key !== "audit" || initialRole === "ADMIN")
            .map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                aria-current={tab === key ? "page" : undefined}
                onClick={() => {
                  setTab(key);
                  setQuery("");
                }}
              >
                <Icon size={18} />
                {label}
                {key === "incidents" && <span className="ai-label">IA</span>}
              </button>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <p>
            <ShieldCheck size={16} />{" "}
            {operator ? "Operación del campus" : "Cuenta de la comunidad"}
          </p>
          <Link href="/">
            <ArrowLeft size={16} /> Ver página principal
          </Link>
          {configured && (
            <button type="button" onClick={() => void signOut()}>
              <LogOut size={16} /> Cerrar sesión
            </button>
          )}
        </div>
      </aside>
      <main className="workspace-main" id="contenido">
        <header className="workspace-topbar">
          <span>
            <span className="desktop-only">
              CampusFlow <ChevronRight size={14} />
            </span>{" "}
            {active?.label}
          </span>
          <div>
            <span className="role-pill">
              {initialRole === "ADMIN"
                ? "Administrador"
                : initialRole === "OPERATOR"
                  ? "Operador"
                  : "Comunidad"}
            </span>
            {configured && (
              <button
                type="button"
                className="icon-button mobile-account-action"
                aria-label="Cerrar sesión"
                onClick={() => void signOut()}
              >
                <LogOut size={17} />
              </button>
            )}
            <button
              type="button"
              className="icon-button"
              aria-label="Actualizar datos"
              disabled={!configured || loading || Boolean(busy)}
              onClick={() => {
                setError("");
                void refresh();
              }}
            >
              <RefreshCw size={17} className={loading ? "spin" : ""} />
            </button>
          </div>
        </header>
        <div className="workspace-body">
          <div className="workspace-heading">
            <div>
              <h1>{titles[tab][0]}</h1>
              <p>{titles[tab][1]}</p>
            </div>
            <span className="timezone">Hora de Colombia · UTC−5</span>
          </div>
          {!configured && (
            <div className="notice">
              <ShieldCheck size={20} />
              <div>
                <strong>La conexión necesita atención</strong>
                <p>
                  {connectionMessage ||
                    "Configura la autenticación y el perfil para operar con datos reales."}
                </p>
                <Link href="/login" className="text-link">
                  Volver al acceso <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          )}
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          {notice && (
            <p className="success-message" role="status">
              {notice}
            </p>
          )}
          {loading && (
            <p className="loading-message" role="status">
              <LoaderCircle size={17} className="spin" /> Actualizando datos…
            </p>
          )}
          {tab === "incidents" && (
            <div className="incident-layout">
              <section className="report-composer">
                <div className="panel-heading">
                  <Sparkles size={22} />
                  <h2>Nueva incidencia</h2>
                </div>
                <p>
                  Cuéntanos qué ocurre, dónde y a quién afecta. No incluyas
                  contraseñas ni datos sensibles.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void report(e.currentTarget);
                  }}
                >
                  <label htmlFor={`${formId}-description`}>
                    Descripción del problema
                  </label>
                  <textarea
                    id={`${formId}-description`}
                    name="description"
                    rows={7}
                    minLength={15}
                    maxLength={4000}
                    required
                    placeholder="Por ejemplo: el proyector de Apolo no enciende y no podemos continuar la presentación…"
                    disabled={disabled}
                  />
                  <p className="field-help">
                    El reporte se guarda antes del análisis. Se envían a Groq la
                    descripción y el estado del catálogo, sin datos de otros
                    usuarios.
                  </p>
                  <button
                    className="button button-primary"
                    type="submit"
                    disabled={disabled}
                  >
                    {busy === "report" ? (
                      <>
                        <LoaderCircle size={17} className="spin" /> Guardando y
                        analizando…
                      </>
                    ) : (
                      <>
                        <Send size={17} /> Reportar y analizar
                      </>
                    )}
                  </button>
                </form>
                <div className="ai-policy">
                  <ShieldCheck size={18} />
                  <p>
                    La IA propone; el equipo decide. Las áreas sugeridas son
                    colas de trabajo configuradas para CampusFlow.
                  </p>
                </div>
              </section>
              <section className="incident-feed">
                <div className="section-title">
                  <h2>
                    {operator ? "Cola de incidencias" : "Mis incidencias"}
                  </h2>
                  <span className="subtle">Últimos 50 reportes</span>
                </div>
                {!incidents.length ? (
                  <Empty>
                    {loading
                      ? "Cargando reportes…"
                      : loaded
                        ? "Todavía no hay reportes. Crea el primero y conserva su seguimiento aquí."
                        : "Tus reportes aparecerán cuando el sistema esté conectado."}
                  </Empty>
                ) : (
                  incidents.map((i) => (
                    <article className="incident-item" key={i.id}>
                      <header>
                        <span className="record-id">#{i.id.slice(0, 8)}</span>
                        <span>{date(i.createdAt)}</span>
                        <Badge value={i.status} />
                      </header>
                      <h3>
                        {i.triage?.summary || i.description.slice(0, 120)}
                      </h3>
                      <p className="incident-description">{i.description}</p>
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
                              {date(i.triage.generatedAt)} ·{" "}
                              {i.triage.latencyMs} ms
                              {i.triage.contextObservedAt && (
                                <>
                                  <br />
                                  Contexto operativo consultado:{" "}
                                  {date(i.triage.contextObservedAt)}. Horarios
                                  sujetos a validación.
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
                            onClick={() =>
                              void mutate(i.id, `/incidents/${i.id}/triage`)
                            }
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
                                void mutate(
                                  i.id,
                                  `/incidents/${i.id}`,
                                  "PATCH",
                                  { status: e.target.value },
                                )
                              }
                            >
                              <option value="OPEN">Abierta</option>
                              <option value="IN_PROGRESS">En atención</option>
                              <option value="RESOLVED">Resuelta</option>
                            </select>
                          </label>
                        )}
                      </div>
                      {i.aiError && (
                        <p className="field-help">
                          El reporte está guardado. El proveedor no completó el
                          análisis ({i.aiError}). Reintenta.
                        </p>
                      )}
                    </article>
                  ))
                )}
              </section>
            </div>
          )}
          {tab === "spaces" && (
            <>
              <div className="list-toolbar">
                <label className="search-field">
                  <Search size={17} />
                  <input
                    aria-label="Buscar espacios"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar un espacio"
                  />
                </label>
                <span className="subtle">
                  Habilitado no garantiza un horario libre.
                </span>
              </div>
              <div className="space-rows">
                {spaces
                  .filter((s) =>
                    s.name.toLowerCase().includes(query.toLowerCase()),
                  )
                  .map((s) => (
                    <article key={s.id} className="space-row">
                      <div className="space-icon">
                        <Grid2X2 size={23} />
                      </div>
                      <div className="space-name">
                        <h2>{s.name}</h2>
                        <span>
                          <Users size={14} />
                          {s.capacity} personas
                        </span>
                      </div>
                      <Badge value={s.status} />
                      {operator && (
                        <select
                          aria-label={`Estado de ${s.name}`}
                          value={s.status}
                          disabled={disabled}
                          onChange={(e) =>
                            void mutate(s.id, `/spaces/${s.id}`, "PATCH", {
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
                        disabled={disabled || s.status !== "AVAILABLE"}
                        onClick={() => {
                          setSelectedSpace(s.id);
                          setTab("reservations");
                        }}
                      >
                        Reservar <ArrowRight size={15} />
                      </button>
                    </article>
                  ))}
              </div>
              {!spaces.length && (
                <Empty>
                  No hay espacios cargados. La administración debe importar el
                  catálogo.
                </Empty>
              )}
            </>
          )}
          {tab === "reservations" && (
            <div className="operations-layout">
              <section className="operation-form">
                <h2>Solicitar una reserva</h2>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const f = e.currentTarget;
                    const d = new FormData(f);
                    const start = new Date(
                      `${d.get("day")}T${d.get("start")}:00-05:00`,
                    );
                    const end = new Date(
                      `${d.get("day")}T${d.get("end")}:00-05:00`,
                    );
                    if (!Number.isFinite(start.getTime()) || end <= start) {
                      setError(
                        "Selecciona un horario cuyo fin sea posterior al inicio.",
                      );
                      return;
                    }
                    if (
                      await mutate("reservation", "/reservations", "POST", {
                        spaceId: d.get("space"),
                        startAt: start.toISOString(),
                        endAt: end.toISOString(),
                        attendees: Number(d.get("attendees")),
                        purpose: d.get("purpose"),
                      })
                    )
                      f.reset();
                  }}
                >
                  <label htmlFor={`${formId}-space`}>Espacio</label>
                  <select
                    id={`${formId}-space`}
                    name="space"
                    value={selectedSpace}
                    onChange={(e) => setSelectedSpace(e.target.value)}
                    required
                    disabled={disabled}
                  >
                    <option value="">Selecciona un espacio</option>
                    {spaces
                      .filter((s) => s.status === "AVAILABLE")
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} · {s.capacity} personas
                        </option>
                      ))}
                  </select>
                  <label htmlFor={`${formId}-day`}>Fecha</label>
                  <input
                    id={`${formId}-day`}
                    name="day"
                    type="date"
                    required
                    disabled={disabled}
                  />
                  <div className="form-pair">
                    <label>
                      Desde
                      <input
                        name="start"
                        type="time"
                        required
                        disabled={disabled}
                      />
                    </label>
                    <label>
                      Hasta
                      <input
                        name="end"
                        type="time"
                        required
                        disabled={disabled}
                      />
                    </label>
                  </div>
                  <label htmlFor={`${formId}-attendees`}>
                    Número de personas
                  </label>
                  <input
                    id={`${formId}-attendees`}
                    name="attendees"
                    type="number"
                    min="1"
                    max="100"
                    required
                    disabled={disabled}
                  />
                  <label htmlFor={`${formId}-purpose`}>Motivo</label>
                  <input
                    id={`${formId}-purpose`}
                    name="purpose"
                    minLength={3}
                    maxLength={300}
                    required
                    disabled={disabled}
                  />
                  <button
                    className="button button-primary"
                    disabled={disabled}
                    type="submit"
                  >
                    Confirmar reserva <CalendarDays size={17} />
                  </button>
                  <p className="field-help">
                    La API valida aforo y cruces al confirmar. Horario de
                    Colombia.
                  </p>
                </form>
              </section>
              <section>
                <h2>{operator ? "Agenda del campus" : "Mis reservas"}</h2>
                {!reservations.length && (
                  <Empty>No hay reservas registradas.</Empty>
                )}
                {reservations.map((r) => (
                  <article key={r.id} className="record-row">
                    <div>
                      <h3>{r.space.name}</h3>
                      <p>{r.purpose}</p>
                      <small>
                        {date(r.startAt)} → {date(r.endAt)}
                      </small>
                    </div>
                    {r.cancelledAt ? (
                      <span className="status-badge">Cancelada</span>
                    ) : (
                      <button
                        type="button"
                        disabled={disabled}
                        className="button button-outline button-small"
                        onClick={() =>
                          void mutate(r.id, `/reservations/${r.id}/cancel`)
                        }
                      >
                        Cancelar reserva
                      </button>
                    )}
                  </article>
                ))}
              </section>
            </div>
          )}
          {tab === "resources" && (
            <>
              <div className="section-title">
                <h2>Inventario</h2>
                <span className="subtle">
                  Solo recursos registrados por el equipo.
                </span>
              </div>
              {!resources.length && (
                <Empty>
                  El inventario está vacío. Un operador puede registrar el
                  primer recurso.
                </Empty>
              )}
              {resources.map((r) => (
                <article className="record-row" key={r.id}>
                  <Box size={23} />
                  <div>
                    <h3>{r.name}</h3>
                    <p>{r.code}</p>
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
              <h2 className="list-heading">Préstamos</h2>
              {!loans.length && <Empty>No hay préstamos registrados.</Empty>}
              {loans.map((l) => (
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
                    <span className="status-badge">
                      Pendiente de devolución
                    </span>
                  )}
                </article>
              ))}
            </>
          )}
          {tab === "summary" && (
            <>
              <div className="summary-intro">
                <Sparkles size={32} />
                <div>
                  <h2>Empieza por lo que necesita atención.</h2>
                  <p>
                    Reporta una incidencia y revisa la propuesta de
                    clasificación antes de atenderla.
                  </p>
                </div>
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => setTab("incidents")}
                >
                  Ir a incidencias <ArrowRight size={16} />
                </button>
              </div>
              <div className="summary-list">
                {[
                  {
                    name: "Reservas recientes",
                    data: reservations,
                    tab: "reservations" as Tab,
                  },
                  {
                    name: "Préstamos recientes",
                    data: loans,
                    tab: "resources" as Tab,
                  },
                  {
                    name: "Incidencias recientes",
                    data: incidents,
                    tab: "incidents" as Tab,
                  },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.name}
                    onClick={() => setTab(item.tab)}
                  >
                    <span>{item.name}</span>
                    <strong>
                      {loaded
                        ? `${item.data.length}${item.data.length === 50 ? "+" : ""}`
                        : "Sin conexión"}
                    </strong>
                    <ArrowRight size={19} />
                  </button>
                ))}
              </div>
              <p className="field-help">
                Recuento de las últimas 50 operaciones visibles para tu perfil.
                Usa cada módulo para revisar el detalle.
              </p>
            </>
          )}
          {tab === "audit" && (
            <>
              {!audit.length && <Empty>Aún no hay eventos de auditoría.</Empty>}
              <div className="audit-list">
                {audit.map((a) => (
                  <article key={a.id}>
                    <ShieldCheck size={16} />
                    <div>
                      <strong>{a.action}</strong>
                      <span>{a.entityId}</span>
                    </div>
                    <time>{date(a.createdAt)}</time>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
