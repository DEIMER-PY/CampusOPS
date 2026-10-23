"use client";
import {
  ArrowRight,
  ArrowUpRight,
  FileText,
  ScanText,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const chapters = [
  {
    title: "El reporte conserva el contexto.",
    subtitle: "Lo que ocurre",
    icon: FileText,
    body: "La incidencia guarda la descripción, la evidencia y la conversación. El reporte permanece aunque el análisis no se complete.",
    note: "Primero, registrar el problema.",
  },
  {
    title: "La IA orienta la atención.",
    subtitle: "Lo que propone",
    icon: ScanText,
    body: "El análisis sugiere categoría, prioridad y área responsable, con una explicación y la referencia del modelo utilizado.",
    note: "Una propuesta que se puede revisar.",
  },
  {
    title: "El equipo decide el siguiente paso.",
    subtitle: "Lo que se confirma",
    icon: ShieldCheck,
    body: "El operador revisa la propuesta y atiende el reporte. Los permisos y las reglas se verifican en el servidor; los cambios quedan registrados.",
    note: "La decisión sigue siendo humana.",
  },
];
export function DecisionJourney() {
  const [step, setStep] = useState(0);
  const current = chapters[step];
  return (
    <section className="campus-decision wrap" aria-labelledby="decision-title">
      <div className="decision-intro">
        <p>Del reporte a la atención</p>
        <h2 id="decision-title">
          La IA propone.
          <br />
          Tu equipo decide.
        </h2>
        <p>Entiende qué hace cada parte antes de pasar a la siguiente.</p>
        <Link href="/portal" className="text-link">
          Reportar una incidencia <ArrowUpRight size={18} />
        </Link>
      </div>
      <div className="decision-workbench">
        <ol>
          {chapters.map((chapter, index) => (
            <li key={chapter.subtitle}>
              <button
                type="button"
                aria-pressed={step === index}
                onClick={() => setStep(index)}
              >
                <chapter.icon size={20} />
                <span>
                  {["Reporte", "Propuesta IA", "Revisión humana"][index]}
                </span>
                <ArrowRight size={16} />
              </button>
            </li>
          ))}
        </ol>
        <div className="decision-scene" key={current.title} aria-live="polite">
          <current.icon size={38} strokeWidth={1.3} />
          <span>{current.subtitle}</span>
          <h3>{current.title}</h3>
          <p>{current.body}</p>
          <strong>{current.note}</strong>
        </div>
        <p className="field-help">
          Recorrido explicativo de las funciones del sistema.
        </p>
      </div>
    </section>
  );
}
