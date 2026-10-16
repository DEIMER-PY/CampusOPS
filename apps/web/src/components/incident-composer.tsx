"use client";
import {
  ArrowRight,
  ClipboardList,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useId, useState } from "react";

export function IncidentComposer({
  disabled,
  busy,
  onReport,
}: {
  disabled: boolean;
  busy: boolean;
  onReport: (form: HTMLFormElement) => Promise<void>;
}) {
  const id = useId();
  const [length, setLength] = useState(0);
  return (
    <section className="report-composer" aria-labelledby={`${id}-heading`}>
      <header className="composer-heading">
        <span className="composer-symbol">
          <ClipboardList size={22} />
        </span>
        <div>
          <h2 id={`${id}-heading`}>Nueva incidencia</h2>
          <p>Describe el problema. Nosotros te ayudamos a encaminarlo.</p>
        </div>
      </header>
      <form
        onReset={() => setLength(0)}
        onSubmit={(event) => {
          event.preventDefault();
          void onReport(event.currentTarget);
        }}
      >
        <div className="composer-writing">
          <div className="field-heading">
            <label htmlFor={`${id}-description`}>¿Qué está pasando?</label>
            <span>{length.toLocaleString("es-CO")} / 4.000</span>
          </div>
          <textarea
            id={`${id}-description`}
            name="description"
            rows={5}
            minLength={15}
            maxLength={4000}
            required
            disabled={disabled}
            onChange={(event) => setLength(event.target.value.length)}
            aria-describedby={`${id}-hint`}
            placeholder="El equipo [código] en [espacio] presenta… Desde hace… Esto impide…"
          />
          <p id={`${id}-hint`} className="composer-hint">
            Incluye ubicación, código del equipo y cómo afecta la actividad.
            Mínimo 15 caracteres.
          </p>
        </div>
        <footer className="composer-actions">
          <span>
            <ShieldCheck size={16} /> Evita contraseñas y datos sensibles.
          </span>
          <button
            type="submit"
            className="button button-primary"
            disabled={disabled}
          >
            {busy ? (
              <>
                <LoaderCircle size={17} className="spin" /> Guardando y
                analizando…
              </>
            ) : (
              <>
                Reportar y analizar <ArrowRight size={17} />
              </>
            )}
          </button>
        </footer>
      </form>
      <details className="composer-explanation">
        <summary>
          <Sparkles size={15} /> Cómo interviene la IA
        </summary>
        <p>
          Guardamos el reporte antes del análisis. Groq recibe tu descripción y
          el estado del catálogo, sin datos de otros usuarios. Propone
          categoría, prioridad y área; el equipo revisa y decide. Puedes
          adjuntar evidencia al reporte guardado.
        </p>
      </details>
    </section>
  );
}
