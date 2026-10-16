"use client";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";

const localDay = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
export function BookingCalendar({
  id,
  disabled,
}: {
  id: string;
  disabled: boolean;
}) {
  const [value, setValue] = useState("");
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => {
    const [year, month] = localDay(new Date()).split("-").map(Number);
    return new Date(year, month - 1, 1);
  });
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const offset = (month.getDay() + 6) % 7;
  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };
  const choose = (day: string) => {
    setValue(day);
    const [year, month] = day.split("-").map(Number);
    setMonth(new Date(year, month - 1, 1));
    close();
  };
  return (
    <div className="booking-calendar">
      <div className="date-field">
        <input
          id={id}
          name="day"
          type="date"
          required
          disabled={disabled}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button
          type="button"
          ref={trigger}
          aria-label="Abrir calendario"
          aria-expanded={open}
          aria-controls={`${id}-calendar`}
          disabled={disabled}
          onClick={() => setOpen(!open)}
        >
          <CalendarDays size={19} />
        </button>
      </div>
      <div className="date-shortcuts">
        {[0, 1, 7].map((n) => (
          <button
            type="button"
            disabled={disabled}
            key={n}
            onClick={() =>
              choose(localDay(new Date(Date.now() + n * 86400000)))
            }
          >
            {n === 0 ? "Hoy" : n === 1 ? "Mañana" : "En una semana"}
          </button>
        ))}
      </div>
      {open && (
        <section
          id={`${id}-calendar`}
          className="calendar-popover"
          aria-label="Seleccionar fecha"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              close();
            }
          }}
        >
          <header>
            <button
              type="button"
              aria-label="Mes anterior"
              onClick={() =>
                setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
              }
            >
              <ChevronLeft size={18} />
            </button>
            <strong aria-live="polite">
              {new Intl.DateTimeFormat("es-CO", {
                month: "long",
                year: "numeric",
              }).format(month)}
            </strong>
            <button
              type="button"
              aria-label="Mes siguiente"
              onClick={() =>
                setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
              }
            >
              <ChevronRight size={18} />
            </button>
          </header>
          <div className="calendar-grid">
            {["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"].map((d) => (
              <span key={d}>{d}</span>
            ))}
            {[
              "monday",
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
              "saturday",
            ]
              .slice(0, offset)
              .map((day) => (
                <span key={day} />
              ))}
            {Array.from({ length: days }, (_, n) => {
              const d = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(n + 1).padStart(2, "0")}`;
              return (
                <button
                  type="button"
                  key={d}
                  aria-label={d}
                  aria-pressed={value === d}
                  onClick={() => choose(d)}
                >
                  {n + 1}
                </button>
              );
            })}
          </div>
          <button className="calendar-close" type="button" onClick={close}>
            Cerrar calendario
          </button>
        </section>
      )}
    </div>
  );
}
