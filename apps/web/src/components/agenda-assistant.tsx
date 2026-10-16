"use client";

import {
  CalendarDays,
  CircleAlert,
  CircleCheck,
  LoaderCircle,
  Send,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";

type Space = { id: string; name: string; capacity: number; status: string };
type Booking = {
  id: string;
  space: Space;
  startAt: string;
  endAt: string;
  purpose: string;
  cancelledAt: string | null;
};
type Room = {
  nombre: string;
  capacidad: number;
  estado: string;
  ocupanteActual: string | null;
  horario: string | null;
  nota: string | null;
};
type Result = {
  proposal: {
    decisionIA: {
      titulo: string;
      explicacion: string;
      tipoAlerta: "SUCCESS" | "WARNING" | "ERROR";
      accionEjecutada: string;
    };
    interpretacionIA?: { intencion: string; modelo: string | null } | null;
    salas: Room[];
    incidenciaDetectada: {
      existe: boolean;
      descripcion: string | null;
      prioridad: string;
      areaResponsable: string | null;
    };
  };
  execution: "APPLIED" | "NOT_APPLIED" | "NO_CHANGES" | "NOT_REPORTED";
  requestId: string;
  receivedAt: string;
  warnings: string[];
};
type Api = <T>(path: string, method?: string, body?: unknown) => Promise<T>;

const examples = [
  "Necesito Apolo hoy de 3 a 5 pm para 20 personas",
  "La clase en Cosmos se extiende hasta las 11:30",
  "El proyector de Skilab no funciona y no se puede usar la sala",
  "¿Qué salas hay libres hoy de 2 a 4 pm para 10 personas?",
];
const intents: Record<string, string> = {
  RESERVA: "Reserva",
  EXTENSION: "Extensión de horario",
  INCIDENCIA: "Incidencia",
  CONSULTA: "Consulta de disponibilidad",
  CONVERSACION: "Conversación",
  FUERA_DE_ALCANCE: "Fuera de alcance",
};
const executionText: Record<Result["execution"], [string, string]> = {
  APPLIED: [
    "Aplicación informada por n8n; revisa la agenda actualizada",
    "applied",
  ],
  NOT_APPLIED: ["Solo propuesta: no se aplicó ningún cambio", "proposal"],
  NO_CHANGES: ["Sin cambios en la base de datos", "none"],
  NOT_REPORTED: ["n8n no confirmó la aplicación del cambio", "warning"],
};
const stateText: Record<string, string> = {
  DISPONIBLE: "Disponible",
  OCUPADO: "Ocupada",
  REUBICADO_IA: "Reubicada por IA",
  MANTENIMIENTO: "Mantenimiento",
  SIN_HABILITAR: "Sin habilitar",
};
const priorityText: Record<string, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  CRITICAL: "Crítica",
};
const clock = new Intl.DateTimeFormat("es-CO", {
  timeZone: "America/Bogota",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function currentBoard(spaces: Space[], bookings: Booking[]): Room[] {
  const now = Date.now();
  return [...spaces]
    .sort((a, b) => b.capacity - a.capacity || a.name.localeCompare(b.name))
    .map((space) => {
      const base = { nombre: space.name, capacidad: space.capacity };
      if (space.status === "MAINTENANCE")
        return {
          ...base,
          estado: "MANTENIMIENTO",
          ocupanteActual: null,
          horario: null,
          nota: null,
        };
      if (space.status !== "AVAILABLE")
        return {
          ...base,
          estado: "SIN_HABILITAR",
          ocupanteActual: null,
          horario: null,
          nota: "Pendiente de habilitar por el operador",
        };
      const active = bookings.find(
        (b) =>
          b.space.id === space.id &&
          !b.cancelledAt &&
          new Date(b.startAt).getTime() <= now &&
          now < new Date(b.endAt).getTime(),
      );
      if (!active)
        return {
          ...base,
          estado: "DISPONIBLE",
          ocupanteActual: null,
          horario: null,
          nota: null,
        };
      return {
        ...base,
        estado: "OCUPADO",
        ocupanteActual: active.purpose,
        horario: `${clock.format(new Date(active.startAt))} - ${clock.format(new Date(active.endAt))}`,
        nota: null,
      };
    });
}

export function AgendaAssistant({
  api,
  spaces,
  reservations,
  operator,
  disabled,
  onApplied,
}: {
  api: Api;
  spaces: Space[];
  reservations: Booking[];
  operator: boolean;
  disabled: boolean;
  onApplied: () => void;
}) {
  const id = useId();
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"PROPUESTA" | "EJECUCION">("PROPUESTA");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [availability, setAvailability] = useState<{
    configured: boolean;
    executionEnabled: boolean;
  } | null>(null);
  const [statusError, setStatusError] = useState(false);
  useEffect(() => {
    if (!operator) return;
    let active = true;
    api<{ configured: boolean; executionEnabled: boolean }>("/agenda/status")
      .then((value) => {
        if (active) setAvailability(value);
      })
      .catch(() => {
        if (active) setStatusError(true);
      });
    return () => {
      active = false;
    };
  }, [api, operator]);
  const board = useMemo(
    () => (result ? result.proposal.salas : currentBoard(spaces, reservations)),
    [result, spaces, reservations],
  );

  async function submit(form: HTMLFormElement) {
    const data = new FormData(form);
    const optional = (name: string) => {
      const value = String(data.get(name) ?? "").trim();
      return value || undefined;
    };
    const attendees = optional("asistentes");
    const body = {
      reporte: text.trim(),
      rol: String(data.get("rol")),
      modo: mode,
      fecha: optional("fecha"),
      salaActual: optional("sala"),
      asistentes: attendees ? Number(attendees) : undefined,
      horaInicio: optional("inicio"),
      horaFinSolicitada: optional("fin"),
    };
    if (
      mode === "EJECUCION" &&
      !window.confirm(
        "Se interpretará tu solicitud con IA y, si cumple las reglas, el cambio se guardará en la base de datos. ¿Continuar?",
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      const response = await api<Result>("/agenda/assistant", "POST", body);
      setResult(response);
      if (response.execution === "APPLIED") onApplied();
    } catch (e) {
      setResult(null);
      setError(
        e instanceof Error ? e.message : "No se pudo completar la solicitud.",
      );
    } finally {
      setBusy(false);
    }
  }

  const decision = result?.proposal.decisionIA;
  const execution = result ? executionText[result.execution] : null;
  const AlertIcon =
    decision?.tipoAlerta === "SUCCESS"
      ? CircleCheck
      : decision?.tipoAlerta === "ERROR"
        ? CircleAlert
        : TriangleAlert;
  const locked = disabled || busy || !operator;

  return (
    <div className="agenda-layout">
      <section className="report-composer agenda-composer">
        <div className="panel-heading">
          <Sparkles size={22} />
          <h2>Asistente de agenda</h2>
        </div>
        <p>
          Escribe lo que necesitas. La IA entiende el texto y las reglas del
          campus deciden: aforo, solapes, estado del espacio y orden de llegada.
        </p>
        {!operator && (
          <p className="agenda-note" role="note">
            Disponible para operadores y administradores.
          </p>
        )}
        {operator && !availability?.configured && (
          <p className="agenda-note" role="status">
            {statusError
              ? "No pudimos comprobar la conexión de n8n. Actualiza la página para reintentar."
              : availability
                ? "Conexión pendiente: configura el webhook de Tomas en el servidor. Puedes consultar el tablero; aún no se envían solicitudes a n8n."
                : "Comprobando configuración de n8n…"}
          </p>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit(e.currentTarget);
          }}
        >
          <label htmlFor={`${id}-text`}>¿Qué necesitas?</label>
          <textarea
            id={`${id}-text`}
            rows={4}
            minLength={5}
            maxLength={4000}
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Por ejemplo: necesito Apolo hoy de 3 a 5 pm para 20 personas…"
            disabled={locked}
          />
          <ul className="agenda-examples" aria-label="Ejemplos">
            {examples.map((example) => (
              <li key={example}>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => setText(example)}
                >
                  {example}
                </button>
              </li>
            ))}
          </ul>
          <fieldset className="agenda-fields" disabled={locked}>
            <legend>
              Datos opcionales (si los omites, la IA los toma del texto)
            </legend>
            <div>
              <label htmlFor={`${id}-date`}>Fecha</label>
              <input id={`${id}-date`} name="fecha" type="date" />
            </div>
            <div>
              <label htmlFor={`${id}-space`}>Sala</label>
              <select id={`${id}-space`} name="sala" defaultValue="">
                <option value="">Que decida la IA / las reglas</option>
                {spaces.map((space) => (
                  <option key={space.id} value={space.name}>
                    {space.name} ({space.capacity})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`${id}-people`}>Asistentes</label>
              <input
                id={`${id}-people`}
                name="asistentes"
                type="number"
                min={1}
                max={100}
                inputMode="numeric"
              />
            </div>
            <div>
              <label htmlFor={`${id}-start`}>Hora de inicio</label>
              <input id={`${id}-start`} name="inicio" type="time" />
            </div>
            <div>
              <label htmlFor={`${id}-end`}>Hora de fin</label>
              <input id={`${id}-end`} name="fin" type="time" />
            </div>
            <div>
              <label htmlFor={`${id}-role`}>Tipo de solicitante</label>
              <select
                id={`${id}-role`}
                name="rol"
                defaultValue="ADMINISTRATIVO"
              >
                <option value="DOCENTE">Docente</option>
                <option value="COMERCIAL">Comercial</option>
                <option value="ADMINISTRATIVO">Administrativo</option>
              </select>
            </div>
          </fieldset>
          <fieldset className="agenda-mode" disabled={locked}>
            <legend>¿Qué hacer con el resultado?</legend>
            <label>
              <input
                type="radio"
                name="mode"
                checked={mode === "PROPUESTA"}
                onChange={() => setMode("PROPUESTA")}
              />
              <span>
                <strong>Solo proponer</strong> — no cambia nada.
              </span>
            </label>
            <label>
              <input
                type="radio"
                name="mode"
                checked={mode === "EJECUCION"}
                disabled={!availability?.executionEnabled}
                onChange={() => setMode("EJECUCION")}
              />
              <span>
                <strong>Aplicar</strong> — guarda el cambio con auditoría.
              </span>
            </label>
          </fieldset>
          <button
            className="button button-primary"
            type="submit"
            disabled={
              locked || !availability?.configured || text.trim().length < 5
            }
          >
            {busy ? (
              <>
                <LoaderCircle size={17} className="spin" /> Analizando con IA…
              </>
            ) : (
              <>
                <Send size={17} />
                {mode === "EJECUCION"
                  ? "Analizar y aplicar"
                  : "Pedir propuesta"}
              </>
            )}
          </button>
        </form>
        <div className="ai-policy">
          <ShieldCheck size={18} />
          <p>
            La IA solo interpreta tu texto. Nunca decide disponibilidad: cada
            cambio lo valida la base de datos y queda en la auditoría.
          </p>
        </div>
      </section>
      <section className="agenda-result" aria-live="polite">
        {error && (
          <div className="agenda-alert agenda-alert-error" role="alert">
            <CircleAlert size={20} />
            <div>
              <h3>No se pudo completar</h3>
              <p>{error}</p>
            </div>
          </div>
        )}
        {decision && result && execution && (
          <div
            className={`agenda-alert agenda-alert-${decision.tipoAlerta.toLowerCase()}`}
            role="status"
          >
            <AlertIcon size={20} />
            <div>
              <h3>{decision.titulo}</h3>
              <p>{decision.explicacion}</p>
              <p className="agenda-meta">
                <span className={`agenda-exec agenda-exec-${execution[1]}`}>
                  {execution[0]}
                </span>
                {result.proposal.interpretacionIA && (
                  <span>
                    La IA entendió:{" "}
                    {intents[result.proposal.interpretacionIA.intencion] ||
                      result.proposal.interpretacionIA.intencion}
                    {result.proposal.interpretacionIA.modelo
                      ? ` · ${result.proposal.interpretacionIA.modelo}`
                      : ""}
                  </span>
                )}
                <span>Solicitud {result.requestId.slice(0, 8)}</span>
              </p>
              {result.warnings.map((warning) => (
                <p className="agenda-warning" key={warning}>
                  {warning}
                </p>
              ))}
            </div>
          </div>
        )}
        {result?.proposal.incidenciaDetectada.existe && (
          <div className="agenda-incident">
            <h3>Incidencia detectada</h3>
            <p>{result.proposal.incidenciaDetectada.descripcion}</p>
            <p className="agenda-meta">
              <span>
                Prioridad{" "}
                {priorityText[result.proposal.incidenciaDetectada.prioridad] ||
                  result.proposal.incidenciaDetectada.prioridad}
              </span>
              <span>
                Área {result.proposal.incidenciaDetectada.areaResponsable}
              </span>
            </p>
          </div>
        )}
        <div className="agenda-board-head">
          <h3>
            <CalendarDays size={18} />{" "}
            {result ? "Estado de las salas tras tu solicitud" : "Salas ahora"}
          </h3>
          <p>
            {result
              ? "Leído de la base de datos después de procesar la solicitud."
              : "Según las reservas guardadas. Pide una propuesta para ver el efecto de un cambio."}
          </p>
        </div>
        {board.length === 0 ? (
          <p className="agenda-note">
            Aún no hay espacios cargados. Importa el catálogo para empezar.
          </p>
        ) : (
          <ul className="agenda-board">
            {board.map((room) => (
              <li
                key={room.nombre}
                className={`agenda-room agenda-room-${room.estado.toLowerCase()}`}
              >
                <header>
                  <strong>{room.nombre}</strong>
                  <span>{room.capacidad} pers.</span>
                </header>
                <span className="agenda-room-state">
                  {stateText[room.estado] || room.estado}
                </span>
                {room.ocupanteActual && <p>{room.ocupanteActual}</p>}
                {room.horario && (
                  <p className="agenda-room-time">{room.horario}</p>
                )}
                {room.nota && <p className="agenda-room-note">{room.nota}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
