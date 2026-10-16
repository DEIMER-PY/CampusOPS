"use client";
import {
  AlertTriangle,
  CalendarRange,
  Clock3,
  LayoutList,
  LoaderCircle,
  RefreshCw,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Entry = {
  id: string;
  category: string;
  room: string;
  spaceId: string | null;
  startMinute: number;
  endMinute: number;
  label: string;
  attendees: number | null;
  course: string | null;
  instructor: string | null;
  status: string;
  timeConfidence: string;
  metadata: Record<string, string>;
  issues: string[];
};
type Board = {
  id: string;
  title: string;
  revision: number;
  updatedAt: string;
  applicableDate: string | null;
  rooms: string[];
  entries: Entry[];
  spaces: { id: string; name: string; capacity: number; status: string }[];
};
type Api = <T>(path: string, method?: string, body?: unknown) => Promise<T>;
const categories: Record<string, string> = {
  SOFTWARE: "Software",
  ENGLISH: "Inglés",
  SER: "SER",
};
const clock = (minute: number) =>
  `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
const minutes = (value: string) => {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
};
export function ScheduleView({
  api,
  operator,
  onReserve,
}: {
  api: Api;
  operator: boolean;
  onReserve: (spaceId: string) => void;
}) {
  const [board, setBoard] = useState<Board | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [filter, setFilter] = useState("ALL"),
    [query, setQuery] = useState(""),
    [selected, setSelected] = useState(""),
    [view, setView] = useState("AGENDA"),
    [saving, setSaving] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setBoard(await api<Board | null>("/schedule"));
      setError("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo cargar el horario.",
      );
    } finally {
      setLoading(false);
    }
  }, [api]);
  useEffect(() => {
    void load();
  }, [load]);
  const entries =
    board?.entries.filter(
      (e) =>
        (filter === "ALL" || e.category === filter) &&
        `${e.label} ${e.room} ${e.instructor ?? ""} ${e.course ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    ) ?? [];
  const current = board?.entries.find((e) => e.id === selected);
  const first = board
    ? Math.floor(Math.min(...board.entries.map((e) => e.startMinute)) / 60) * 60
    : 360;
  const last = board
    ? Math.ceil(Math.max(...board.entries.map((e) => e.endMinute)) / 60) * 60
    : 780;
  return (
    <div className="schedule-view">
      <div className="schedule-intro">
        <CalendarRange size={27} />
        <div>
          <h2>De la hoja de cálculo a una agenda compartida.</h2>
          <p>
            Bloques de la referencia, guardados en Supabase. Plantilla sin fecha
            de aplicación; sus bloques todavía no son reservas.
          </p>
        </div>
        <button
          type="button"
          className="button button-outline button-small"
          disabled={loading || saving}
          onClick={() => void load()}
        >
          <RefreshCw size={15} />
          Actualizar
        </button>
      </div>
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="success-message">
          {notice}
        </p>
      )}
      {loading && !board && (
        <p role="status">
          <LoaderCircle size={17} className="spin" />
          Cargando horario desde Supabase…
        </p>
      )}
      {!board && !loading && !error && (
        <div className="empty-state">
          Todavía no hay una plantilla de horario importada.
        </div>
      )}
      {board && (
        <>
          <div className="schedule-toolbar">
            <section
              className="schedule-category-filter"
              aria-label="Áreas del horario"
            >
              {[["ALL", "Todas"], ...Object.entries(categories)].map(
                ([key, label]) => (
                  <button
                    type="button"
                    key={key}
                    aria-pressed={filter === key}
                    className={`schedule-category-${key.toLowerCase()}`}
                    onClick={() => setFilter(key)}
                  >
                    {label}
                    <span>
                      {
                        board.entries.filter(
                          (e) => key === "ALL" || e.category === key,
                        ).length
                      }
                    </span>
                  </button>
                ),
              )}
            </section>
            <label className="search-field">
              <input
                aria-label="Buscar en horarios"
                placeholder="Grupo, sala o instructor…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="button button-outline button-small"
              onClick={() => setView(view === "AGENDA" ? "LIST" : "AGENDA")}
            >
              <LayoutList size={15} />
              {view === "AGENDA" ? "Ver lista" : "Ver agenda"}
            </button>
          </div>
          <p className="field-help">
            Hora de Colombia · {entries.length} de {board.entries.length}{" "}
            bloques · Revisión {board.revision}. Los bloques cancelados se
            conservan como referencia. Las franjas de Software requieren
            confirmación.
          </p>
          <div className="schedule-content">
            <div className="schedule-main">
              {view === "AGENDA" ? (
                <section
                  className="schedule-scroll"
                  aria-label="Agenda por sala; desplázate horizontalmente para consultar las nueve columnas"
                  // biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users must scroll the timetable.
                  tabIndex={0}
                >
                  <div
                    className="schedule-canvas"
                    style={{
                      gridTemplateColumns: `66px repeat(${board.rooms.length}, 176px)`,
                      gridTemplateRows: `56px repeat(${(last - first) / 15}, 25px)`,
                    }}
                  >
                    <div className="schedule-corner">Hora</div>
                    {board.rooms.map((room, index) => (
                      <h3
                        className="schedule-room-heading"
                        key={room}
                        style={{ gridColumn: index + 2, gridRow: 1 }}
                      >
                        {room}
                      </h3>
                    ))}
                    {Array.from(
                      { length: (last - first) / 15 },
                      (_, index) => first + index * 15,
                    ).map((minute) => (
                      <div
                        key={minute}
                        className={`schedule-time ${minute % 60 === 0 ? "schedule-hour" : ""}`}
                        style={{
                          gridColumn: 1,
                          gridRow: (minute - first) / 15 + 2,
                        }}
                      >
                        {clock(minute)}
                      </div>
                    ))}
                    {board.rooms.map((room, index) => (
                      <div
                        key={room}
                        className="schedule-room-lane"
                        style={{
                          gridColumn: index + 2,
                          gridRow: `2 / ${(last - first) / 15 + 2}`,
                        }}
                      />
                    ))}
                    {entries.map((entry) => (
                      <button
                        type="button"
                        key={entry.id}
                        className={`schedule-block schedule-block-${entry.category.toLowerCase()} ${entry.status === "CANCELLED" ? "schedule-cancelled" : ""}`}
                        aria-pressed={selected === entry.id}
                        aria-label={`${entry.label}, ${entry.room}, ${clock(entry.startMinute)} a ${clock(entry.endMinute)}, ${entry.status === "CANCELLED" ? "cancelado" : "por confirmar"}`}
                        style={{
                          gridColumn: board.rooms.indexOf(entry.room) + 2,
                          gridRow: `${(entry.startMinute - first) / 15 + 2} / ${(entry.endMinute - first) / 15 + 2}`,
                        }}
                        onClick={() => setSelected(entry.id)}
                      >
                        <span className="schedule-block-type">
                          {categories[entry.category]} ·{" "}
                          {clock(entry.startMinute)}–{clock(entry.endMinute)}
                        </span>
                        <strong>{entry.label}</strong>
                        <span>
                          {entry.course ??
                            (entry.status === "CANCELLED"
                              ? "Cancelado"
                              : "Nivel no indicado")}
                        </span>
                        <span>
                          {entry.instructor ?? "Instructor no indicado"}
                          {entry.attendees !== null
                            ? ` · ${entry.attendees} personas`
                            : ""}
                        </span>
                        {entry.issues.length > 0 && (
                          <span className="schedule-block-warning">
                            <AlertTriangle size={12} />
                            {entry.status === "CANCELLED"
                              ? "Cancelado"
                              : "Por confirmar"}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </section>
              ) : (
                <div className="schedule-list">
                  {entries.map((entry) => (
                    <button
                      type="button"
                      key={entry.id}
                      onClick={() => setSelected(entry.id)}
                      aria-pressed={selected === entry.id}
                    >
                      <span
                        className={`schedule-list-category schedule-block-${entry.category.toLowerCase()}`}
                      >
                        {categories[entry.category]}
                      </span>
                      <span>
                        <strong>
                          {entry.label} · {entry.room}
                        </strong>
                        <small>
                          {entry.instructor ?? "Sin instructor"} ·{" "}
                          {entry.status === "CANCELLED"
                            ? "Cancelado"
                            : "Por confirmar"}
                        </small>
                      </span>
                      <span>
                        {clock(entry.startMinute)}–{clock(entry.endMinute)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {!entries.length && (
                <p className="empty-state">
                  No hay bloques con los filtros seleccionados.
                </p>
              )}
            </div>
            <aside className="schedule-editor">
              {!current ? (
                <>
                  <Clock3 size={25} />
                  <h3>Revisa cada bloque</h3>
                  <p>
                    Selecciona una actividad para ver su grupo, instructor,
                    aforo y observaciones de la fuente.
                  </p>
                  <p className="field-help">
                    Sala Azul, Sala Nueva, Skylab y Sputnik conservan los
                    nombres de la captura. Vincúlalas al catálogo después de
                    confirmar su equivalencia.
                  </p>
                </>
              ) : (
                <>
                  <h3>{current.label}</h3>
                  <p className="subtle">
                    {categories[current.category]} · {current.room}
                  </p>
                  <ul className="schedule-issues">
                    {current.issues.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                  {Object.entries(current.metadata).map(([key, value]) => (
                    <p className="field-help" key={key}>
                      {key === "sourceDuration"
                        ? "Duración en la fuente"
                        : key === "sourceLocation"
                          ? "Ubicación escrita en la fuente"
                          : "Nota de lectura"}
                      : {value}
                    </p>
                  ))}
                  <form
                    key={`${current.id}-${board.revision}`}
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const data = new FormData(e.currentTarget);
                      setSaving(true);
                      setError("");
                      setNotice("");
                      try {
                        await api(
                          `/schedule/${board.id}/entries/${current.id}`,
                          "PATCH",
                          {
                            expectedRevision: board.revision,
                            label: String(data.get("label")),
                            category: String(data.get("category")),
                            room: String(data.get("room")),
                            spaceId: String(data.get("spaceId")) || null,
                            startMinute: minutes(String(data.get("start"))),
                            endMinute: minutes(String(data.get("end"))),
                            attendees:
                              String(data.get("attendees")) === ""
                                ? null
                                : Number(data.get("attendees")),
                            course: String(data.get("course")) || null,
                            instructor: String(data.get("instructor")) || null,
                            status: String(data.get("status")),
                          },
                        );
                        await load();
                        setNotice(
                          "Bloque actualizado en Supabase. La plantilla sigue pendiente de fecha y no crea reservas.",
                        );
                      } catch (e) {
                        setError(
                          e instanceof Error
                            ? e.message
                            : "No se pudo guardar.",
                        );
                      } finally {
                        setSaving(false);
                      }
                    }}
                  >
                    <label>
                      Grupo
                      <input
                        name="label"
                        defaultValue={current.label}
                        required
                        maxLength={100}
                        disabled={!operator || saving}
                      />
                    </label>
                    <label>
                      Área
                      <select
                        name="category"
                        defaultValue={current.category}
                        disabled={!operator || saving}
                      >
                        {Object.entries(categories).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Sala de la plantilla
                      <select
                        name="room"
                        defaultValue={current.room}
                        disabled={!operator || saving}
                      >
                        {board.rooms.map((room) => (
                          <option key={room}>{room}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Vincular al catálogo
                      <select
                        name="spaceId"
                        defaultValue={current.spaceId ?? ""}
                        disabled={!operator || saving}
                      >
                        <option value="">Sin equivalencia confirmada</option>
                        {board.spaces.map((space) => (
                          <option key={space.id} value={space.id}>
                            {space.name} · {space.capacity} personas ·{" "}
                            {space.status === "AVAILABLE"
                              ? "habilitado"
                              : "no habilitado"}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="form-pair">
                      <label>
                        Desde
                        <input
                          name="start"
                          type="time"
                          step={900}
                          defaultValue={clock(current.startMinute)}
                          required
                          disabled={!operator || saving}
                        />
                      </label>
                      <label>
                        Hasta
                        <input
                          name="end"
                          type="time"
                          step={900}
                          defaultValue={clock(current.endMinute)}
                          required
                          disabled={!operator || saving}
                        />
                      </label>
                    </div>
                    <label>
                      <Users size={13} />
                      Asistentes
                      <input
                        name="attendees"
                        type="number"
                        min={0}
                        max={500}
                        defaultValue={current.attendees ?? ""}
                        disabled={!operator || saving}
                      />
                    </label>
                    <label>
                      Nivel o curso
                      <input
                        name="course"
                        maxLength={100}
                        defaultValue={current.course ?? ""}
                        disabled={!operator || saving}
                      />
                    </label>
                    <label>
                      Instructor
                      <input
                        name="instructor"
                        maxLength={100}
                        defaultValue={current.instructor ?? ""}
                        disabled={!operator || saving}
                      />
                    </label>
                    <label>
                      Estado
                      <select
                        name="status"
                        defaultValue={current.status}
                        disabled={!operator || saving}
                      >
                        <option value="DRAFT">Por confirmar</option>
                        <option value="CANCELLED">Cancelado</option>
                      </select>
                    </label>
                    {operator && (
                      <button
                        type="submit"
                        className="button button-primary"
                        disabled={saving}
                      >
                        {saving ? "Guardando…" : "Guardar bloque"}
                      </button>
                    )}
                  </form>
                  {current.spaceId &&
                    current.status !== "CANCELLED" &&
                    board.spaces.some(
                      (s) =>
                        s.id === current.spaceId &&
                        s.status === "AVAILABLE" &&
                        (current.attendees ?? 0) > 0 &&
                        (current.attendees ?? 0) <= s.capacity,
                    ) && (
                      <button
                        type="button"
                        className="button button-outline button-small"
                        onClick={() => onReserve(current.spaceId as string)}
                      >
                        Elegir fecha en Reservas
                      </button>
                    )}
                </>
              )}
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
