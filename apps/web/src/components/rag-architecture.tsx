"use client";

import {
  ArrowRight,
  BookOpen,
  Database,
  FileCheck2,
  FileSearch,
  Files,
  Layers3,
  Pause,
  Play,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";

const steps = [
  {
    title: "Fuentes autorizadas",
    label: "PDF / Excel",
    icon: Files,
    phase: "Preparar las fuentes",
    description:
      "Se comprobará la procedencia, el permiso de uso y la versión de cada documento. Un archivo simulado deberá identificarse como demostración.",
  },
  {
    title: "Fragmentos con origen",
    label: "Extraer / dividir",
    icon: Layers3,
    phase: "Preparar las fuentes",
    description:
      "Cada fragmento conservará su documento, página, hoja o fila. Así la respuesta podrá volver a una fuente concreta y verificable.",
  },
  {
    title: "Índice documental",
    label: "Embeddings",
    icon: Database,
    phase: "Preparar las fuentes",
    description:
      "Los fragmentos se representarán en un índice vectorial con sus permisos. El proveedor de embeddings sigue por definir.",
  },
  {
    title: "Pregunta y permisos",
    label: "Identidad verificada",
    icon: ShieldCheck,
    phase: "Responder con evidencia",
    description:
      "Antes de recuperar contenido, el servidor verificará la sesión y el acceso a los documentos. Un archivo nunca puede conceder permisos al usuario.",
  },
  {
    title: "Recuperar evidencia",
    label: "Búsqueda contextual",
    icon: FileSearch,
    phase: "Responder con evidencia",
    description:
      "Se buscarán fragmentos relevantes dentro de las fuentes autorizadas. Si la evidencia no es suficiente, el sistema deberá decirlo en lugar de inventar una respuesta.",
  },
  {
    title: "Generar con contexto",
    label: "LLM / Groq",
    icon: Sparkles,
    phase: "Responder con evidencia",
    description:
      "El modelo recibirá la pregunta y los fragmentos recuperados. El contenido documental se tratará como información, no como instrucciones para ejecutar acciones.",
  },
  {
    title: "Respuesta con citas",
    label: "Origen comprobable",
    icon: FileCheck2,
    phase: "Responder con evidencia",
    description:
      "La respuesta incluirá referencias a página, hoja o fila. La disponibilidad y las operaciones del campus seguirán validadas en PostgreSQL; el RAG no asigna recursos.",
  },
];

export function RagArchitecture() {
  const [selected, setSelected] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => {
      setReduced(media.matches);
      if (media.matches) setPlaying(false);
    };
    change();
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    if (!playing || reduced) return;
    const timer = window.setTimeout(() => {
      if (selected === steps.length - 1) setPlaying(false);
      else setSelected(selected + 1);
    }, 3600);
    return () => clearTimeout(timer);
  }, [playing, reduced, selected]);
  return (
    <section
      className="rag-machine"
      aria-label="Recorrido conceptual de la arquitectura RAG"
    >
      <div className="rag-machine-toolbar">
        <span>
          <span className="concept-dot" /> Arquitectura prevista{" "}
          <span className="rag-toolbar-note">/ Sin conexión a documentos</span>
        </span>
        <button
          type="button"
          className="button button-outline"
          disabled={reduced}
          onClick={() => {
            if (!playing && selected === steps.length - 1) setSelected(0);
            setPlaying(!playing);
          }}
          aria-label={
            playing ? "Pausar recorrido RAG" : "Reproducir recorrido RAG"
          }
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}{" "}
          {playing ? "Pausar" : "Recorrer"}
        </button>
      </div>
      <div className="rag-directed-layout">
        <nav
          className="rag-step-rail"
          aria-label="Pasos de la arquitectura RAG"
        >
          <ol>
            {steps.map((step, index) => (
              <li key={step.title}>
                <button
                  type="button"
                  aria-pressed={selected === index}
                  aria-controls="rag-step-description"
                  onClick={() => {
                    setSelected(index);
                    setPlaying(false);
                  }}
                >
                  <step.icon size={18} />
                  <span>{step.title}</span>
                  <small>{index + 1}</small>
                </button>
              </li>
            ))}
          </ol>
        </nav>
        <div className="rag-live-stage" data-frame={selected} key={selected}>
          <div className="rag-live-heading">
            <span>
              {selected < 3
                ? "Preparar las fuentes"
                : "Responder con evidencia"}
            </span>
            <span>Paso {selected + 1} de 7</span>
          </div>
          <figure
            className="rag-stage-diagram"
            aria-label={`Diagrama del paso: ${steps[selected].title}`}
          >
            <div className="rag-input-stack" aria-hidden="true">
              <span>
                <Files size={26} />
                {selected === 0 ? "PDF" : "Fuente"}
              </span>
              <span>
                <Layers3 size={26} />
                {selected === 0 ? "Excel" : "Contexto"}
              </span>
            </div>
            <svg
              className="rag-live-connections"
              viewBox="0 0 600 160"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M65 40 H160 Q180 40 180 60 V80 H275 M65 120 H160 Q180 120 180 100 V80 M325 80 H535"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="6 7"
              />
              <path
                d="M525 70 L537 80 525 90"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            <div className="rag-active-node">
              {(() => {
                const Icon = steps[selected].icon;
                return <Icon size={54} strokeWidth={1.3} />;
              })()}
            </div>
            <div className="rag-output-node">
              {selected < 3 ? (
                <Database size={42} strokeWidth={1.3} />
              ) : selected === 3 ? (
                <ShieldCheck size={42} strokeWidth={1.3} />
              ) : (
                <FileCheck2 size={42} strokeWidth={1.3} />
              )}
            </div>
          </figure>
          <div className="rag-stage-labels">
            <span>
              {
                [
                  "PDF y Excel autorizados",
                  "Documento validado",
                  "Fragmentos con origen",
                  "Pregunta y sesión",
                  "Pregunta autorizada",
                  "Evidencia recuperada",
                  "Respuesta con contexto",
                ][selected]
              }
            </span>
            <strong>{steps[selected].title}</strong>
            <span>
              {
                [
                  "Fuente versionada",
                  "Fragmentos referenciados",
                  "Índice con permisos",
                  "Acceso documental",
                  "Contexto relevante",
                  "Borrador de respuesta",
                  "Citas comprobables",
                ][selected]
              }
            </span>
          </div>
          <p className="rag-stage-caption">
            {selected < 3
              ? "El documento se transforma; su procedencia y sus permisos se conservan."
              : selected === 3
                ? "Los permisos se comprueban antes de recuperar cualquier fragmento."
                : selected === 4
                  ? "Solo evidencia autorizada y relevante puede entrar en el contexto."
                  : selected === 5
                    ? "El modelo recibe contexto acotado; los documentos no ejecutan acciones."
                    : "Cada afirmación deberá permitir volver a su fuente de origen."}
          </p>
        </div>
      </div>
      <div
        className="rag-inspector"
        id="rag-step-description"
        aria-live={playing ? "off" : "polite"}
        aria-atomic="true"
      >
        <span className="rag-step-index">Paso {selected + 1} de 7</span>
        <div>
          <p>{steps[selected].phase}</p>
          <h4>{steps[selected].title}</h4>
          <p>{steps[selected].description}</p>
        </div>
        <BookOpen size={24} aria-hidden="true" />
      </div>
      <p className="rag-machine-footnote">
        {reduced
          ? "Movimiento reducido: explora los pasos con los botones."
          : "Selecciona un paso o reproduce el recorrido explicativo."}{" "}
        Sin evidencia, no se inventa una respuesta.
      </p>
    </section>
  );
}
