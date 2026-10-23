"use client";
import { createBrowserClient } from "@supabase/ssr";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Grid2X2,
  LoaderCircle,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { parseParticipants } from "@/lib/participants";
import { AgendaAssistant } from "./agenda-assistant";
import { AuditView } from "./audit-view";
import { CampusPlan } from "./campus-plan";
import { IncidentsView } from "./incidents-view";
import { ReservationComposer } from "./reservation-composer";
import { ResourcesView } from "./resources-view";
import { ScheduleView } from "./schedule-view";
import { SummaryView } from "./summary-view";
import {
  type Audit,
  auditAction,
  Badge,
  date,
  Empty,
  type Incident,
  type Loan,
  type Reservation,
  type Resource,
  type Space,
  type Tab,
} from "./workspace-shared";
import { WorkspaceShell } from "./workspace-shell";

const titles: Record<Tab, [string, string]> = {
  schedule: [
    "Horarios de formación",
    "Organiza grupos, salas e instructores con trazabilidad.",
  ],
  plans: [
    "Planos del campus",
    "Explora el plano y vincula las salas del catálogo.",
  ],
  summary: [
    "Resumen operativo",
    "Consulta la actividad y decide tu siguiente paso.",
  ],
  spaces: [
    "Espacios del campus",
    "Consulta el aforo y solicita el horario que necesitas.",
  ],
  reservations: ["Reservas", "Cada horario confirmado, en un mismo lugar."],
  agenda: [
    "Asistente de agenda",
    "La IA interpreta; las reglas del campus validan la propuesta.",
  ],
  resources: [
    "Recursos y préstamos",
    "Consulta el inventario y lleva el seguimiento de tus recursos.",
  ],
  incidents: [
    "Incidencias",
    "Reporta una incidencia. La IA ayuda a encontrar su camino.",
  ],
  audit: [
    "Historial de operaciones",
    "Trazabilidad de los cambios guardados en el sistema.",
  ],
};
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
  const [tab, setTab] = useState<Tab>("summary");
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [audit, setAudit] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [moduleReady, setModuleReady] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [query, setQuery] = useState("");
  const [selectedSpace, setSelectedSpace] = useState("");
  const [bookingReset, setBookingReset] = useState(0);
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
        signal: AbortSignal.timeout(path.endsWith("/vision") ? 55000 : 35000),
      });
      if (!response.headers.get("content-type")?.includes("application/json"))
        throw new Error(
          response.status === 429
            ? "El servidor está ocupado. Espera un minuto y actualiza."
            : "La API no respondió correctamente. Actualiza en unos segundos.",
        );
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
        setLoadError(
          `No se pudo actualizar: ${failed.join(", ")}. Los demás módulos siguen disponibles. Pulsa actualizar para reintentar.`,
        );
      if (!failed.length) setLoadError("");
      setModuleReady(
        Object.fromEntries(
          [
            "spaces",
            "reservations",
            "resources",
            "loans",
            "incidents",
            "audit",
          ].map((name, index) => [name, results[index].status === "fulfilled"]),
        ),
      );
      if (results.slice(0, 5).every((result) => result.status === "fulfilled"))
        setUpdatedAt(new Date().toISOString());
    } catch (e) {
      setLoadError(
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
  async function report(form: HTMLFormElement): Promise<string | undefined> {
    let createdId: string | undefined;
    if (busy) return;
    setBusy("report");
    setError("");
    setNotice("");
    try {
      const record = await api<Incident>("/incidents", "POST", {
        description: String(new FormData(form).get("description")),
      });
      createdId = record.id;
      setIncidents((current) => [
        record,
        ...current.filter((item) => item.id !== record.id),
      ]);
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
    return createdId;
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
  const disabled = !configured || Boolean(busy) || loading;
  return (
    <WorkspaceShell
      tab={tab}
      onNavigate={(next) => {
        setTab(next);
        setQuery("");
      }}
      role={initialRole}
      configured={configured}
      loading={loading || Boolean(busy)}
      onRefresh={() => {
        setError("");
        void refresh();
      }}
      onSignOut={() => void signOut()}
    >
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
      {loadError && (
        <p className="error-message" role="alert">
          {loadError}
        </p>
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
      {tab === "plans" && (
        <CampusPlan
          canLink={operator}
          spaces={spaces}
          ready={Boolean(moduleReady.spaces)}
          onReserve={(id) => {
            setSelectedSpace(id);
            setTab("reservations");
          }}
        />
      )}
      {tab === "agenda" && (
        <AgendaAssistant
          contextReady={Boolean(moduleReady.spaces && moduleReady.reservations)}
          api={api}
          spaces={spaces}
          reservations={reservations}
          operator={operator}
          disabled={disabled}
          onApplied={() => void refresh()}
        />
      )}
      {tab === "schedule" && (
        <ScheduleView
          api={api}
          operator={operator}
          onReserve={(spaceId) => {
            setSelectedSpace(spaceId);
            setTab("reservations");
          }}
        />
      )}
      {tab === "incidents" && (
        <IncidentsView
          incidents={incidents}
          ready={Boolean(moduleReady.incidents)}
          loading={loading}
          operator={operator}
          disabled={disabled}
          busy={busy}
          api={api}
          refresh={refresh}
          mutate={mutate}
          onReport={report}
        />
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
              .filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))
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
        <div className="operations-layout reservations-layout">
          <ReservationComposer
            spaces={spaces}
            selectedSpace={selectedSpace}
            onSpaceChange={setSelectedSpace}
            disabled={disabled}
            busy={busy === "reservation"}
            resetKey={bookingReset}
            onSubmit={async (e) => {
              e.preventDefault();
              const f = e.currentTarget;
              const d = new FormData(f);
              const start = new Date(
                `${d.get("day")}T${d.get("start")}:00-05:00`,
              );
              const end = new Date(`${d.get("day")}T${d.get("end")}:00-05:00`);
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
                  participants: parseParticipants(
                    String(d.get("participants") || ""),
                  ),
                })
              ) {
                f.reset();
                setBookingReset((value) => value + 1);
              }
            }}
          />
          <section>
            <h2>{operator ? "Agenda del campus" : "Mis reservas"}</h2>
            {!reservations.length && (
              <Empty>No hay reservas registradas.</Empty>
            )}
            {reservations.map((r) => (
              <article key={r.id} className="record-row reservation-record">
                <div className="reservation-date">
                  <strong>
                    {new Intl.DateTimeFormat("es-CO", {
                      day: "2-digit",
                      timeZone: "America/Bogota",
                    }).format(new Date(r.startAt))}
                  </strong>
                  <span>
                    {new Intl.DateTimeFormat("es-CO", {
                      month: "short",
                      timeZone: "America/Bogota",
                    }).format(new Date(r.startAt))}
                  </span>
                </div>
                <div>
                  <h3>{r.space.name}</h3>
                  <p>{r.purpose}</p>
                  {!!r.participants?.length && (
                    <div className="participant-chips">
                      {r.participants.map((name) => (
                        <span key={name}>{name}</span>
                      ))}
                    </div>
                  )}
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
        <ResourcesView
          resources={resources}
          loans={loans}
          ready={Boolean(moduleReady.resources)}
          loansReady={Boolean(moduleReady.loans)}
          loading={loading}
          operator={operator}
          disabled={disabled}
          mutate={mutate}
        />
      )}
      {tab === "summary" && (
        <SummaryView
          incidents={incidents}
          loans={loans}
          resources={resources}
          spaces={spaces}
          reservations={reservations}
          ready={moduleReady}
          loading={loading}
          updatedAt={updatedAt}
          onNavigate={setTab}
        />
      )}
      {tab === "audit" && (
        <AuditView
          events={audit}
          ready={Boolean(moduleReady.audit)}
          loading={loading}
        />
      )}
    </WorkspaceShell>
  );
}
