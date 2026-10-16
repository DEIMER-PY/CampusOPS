"use client";
import { CalendarDays, Clock3, MapPin, ShieldCheck, Users } from "lucide-react";
import { type FormEventHandler, useId } from "react";
import { BookingCalendar } from "./booking-calendar";

type Space = { id: string; name: string; capacity: number; status: string };
export function ReservationComposer({
  spaces,
  selectedSpace,
  onSpaceChange,
  disabled,
  busy,
  resetKey,
  onSubmit,
}: {
  spaces: Space[];
  selectedSpace: string;
  onSpaceChange: (id: string) => void;
  disabled: boolean;
  busy: boolean;
  resetKey: number;
  onSubmit: FormEventHandler<HTMLFormElement>;
}) {
  const id = useId();
  const selected = spaces.find((space) => space.id === selectedSpace);
  const available = spaces.filter((space) => space.status === "AVAILABLE");
  return (
    <section
      className="operation-form reservation-composer"
      aria-labelledby={`${id}-heading`}
    >
      <header className="composer-heading">
        <span className="composer-symbol">
          <CalendarDays size={22} />
        </span>
        <div>
          <h2 id={`${id}-heading`}>Solicitar una reserva</h2>
          <p>Elige dónde, cuándo y con quién.</p>
        </div>
      </header>
      <form onSubmit={onSubmit}>
        <fieldset>
          <legend>
            <MapPin size={16} /> Espacio y fecha
          </legend>
          <div className="reservation-fields">
            <label htmlFor={`${id}-space`}>
              Espacio
              <select
                id={`${id}-space`}
                name="space"
                value={selectedSpace}
                onChange={(event) => onSpaceChange(event.target.value)}
                required
                disabled={disabled}
              >
                <option value="">Selecciona un espacio</option>
                {available.map((space) => (
                  <option key={space.id} value={space.id}>
                    {space.name} · {space.capacity} personas
                  </option>
                ))}
              </select>
            </label>
            <div>
              <label htmlFor={`${id}-day`}>Fecha</label>
              <BookingCalendar
                key={resetKey}
                id={`${id}-day`}
                disabled={disabled}
              />
            </div>
          </div>
          {selected ? (
            <p className="reservation-selection">
              <MapPin size={16} />
              <strong>{selected.name}</strong>
              <span>
                <Users size={14} /> Hasta {selected.capacity} personas
              </span>
            </p>
          ) : (
            <p className="composer-hint">
              Solo se muestran espacios habilitados. La disponibilidad del
              horario se comprueba al confirmar.
            </p>
          )}
        </fieldset>
        <fieldset>
          <legend>
            <Clock3 size={16} /> Horario y aforo
          </legend>
          <div className="reservation-fields reservation-time-fields">
            <label>
              Desde
              <input name="start" type="time" required disabled={disabled} />
            </label>
            <label>
              Hasta
              <input name="end" type="time" required disabled={disabled} />
            </label>
            <label htmlFor={`${id}-attendees`}>
              Personas
              <input
                id={`${id}-attendees`}
                name="attendees"
                type="number"
                min={1}
                max={selected?.capacity ?? 100}
                placeholder="Total"
                required
                disabled={disabled}
              />
            </label>
          </div>
          <p className="composer-hint">
            Hora de Colombia · UTC−5. Incluye a quien organiza en el aforo.
          </p>
        </fieldset>
        <fieldset>
          <legend>
            <Users size={16} /> Detalles de la actividad
          </legend>
          <label htmlFor={`${id}-purpose`}>
            Motivo
            <input
              id={`${id}-purpose`}
              name="purpose"
              minLength={3}
              maxLength={300}
              placeholder="¿Para qué necesitas el espacio?"
              required
              disabled={disabled}
            />
          </label>
          <details className="reservation-participants">
            <summary>
              Agregar nombres de participantes <span>Opcional</span>
            </summary>
            <label htmlFor={`${id}-participants`}>
              Participantes
              <textarea
                id={`${id}-participants`}
                name="participants"
                rows={2}
                maxLength={8000}
                placeholder="Nombres separados por coma o por línea"
                disabled={disabled}
              />
            </label>
            <p className="composer-hint">
              Esta lista no envía invitaciones. El total de personas se indica
              arriba, aunque no escribas sus nombres.
            </p>
          </details>
        </fieldset>
        <footer className="composer-actions">
          <span>
            <ShieldCheck size={16} /> Validamos aforo y cruces en el servidor.
          </span>
          <button
            type="submit"
            className="button button-primary"
            disabled={disabled}
          >
            {busy ? "Confirmando…" : "Confirmar reserva"}
            <CalendarDays size={17} />
          </button>
        </footer>
      </form>
    </section>
  );
}
