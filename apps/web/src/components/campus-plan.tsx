"use client";
import { Download, Minus, Plus, RotateCw, Workflow } from "lucide-react";
import { useState } from "react";
export function CampusPlan() {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const imageWidth = 448 * zoom;
  const imageHeight = 580 * zoom;
  const sideways = rotation === 90 || rotation === 270;
  return (
    <section className="campus-plan">
      <div className="section-title">
        <div>
          <h2>Planos del campus</h2>
          <p className="subtle">
            Torre Zenith · Nivel 6 · plano suministrado por el equipo
          </p>
        </div>
        <a
          className="button button-outline button-small"
          href="/plans/torre-zenith-nivel-6.pdf"
          download
        >
          <Download size={15} />
          Descargar PDF
        </a>
      </div>
      <div className="plan-controls">
        <button
          type="button"
          className="button button-outline button-small"
          disabled={zoom <= 1}
          onClick={() => setZoom(Math.max(1, zoom - 0.25))}
          aria-label="Reducir plano"
        >
          <Minus size={16} />
        </button>
        <span aria-live="polite">{Math.round(zoom * 100)} %</span>
        <button
          type="button"
          className="button button-outline button-small"
          disabled={zoom >= 3}
          onClick={() => setZoom(Math.min(3, zoom + 0.25))}
          aria-label="Ampliar plano"
        >
          <Plus size={16} />
        </button>
        <button
          type="button"
          className="button button-outline button-small"
          onClick={() => setRotation((rotation + 90) % 360)}
        >
          <RotateCw size={16} />
          Girar
        </button>
        <button
          type="button"
          className="text-link"
          onClick={() => {
            setZoom(1);
            setRotation(0);
          }}
        >
          Restablecer
        </button>
      </div>
      <section
        className="plan-viewport"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: Scroll regions require keyboard access.
        tabIndex={0}
        aria-label="Plano ampliable; utiliza el desplazamiento para recorrerlo"
      >
        <div
          style={{
            position: "relative",
            width: sideways ? imageHeight : imageWidth,
            height: sideways ? imageWidth : imageHeight,
            margin: "0 auto",
          }}
        >
          <img
            src="/plans/torre-zenith-nivel-6.webp"
            width={1700}
            height={2200}
            alt="Planta arquitectónica del nivel 6 de Torre Zenith. Consulta el PDF para leer las anotaciones originales."
            style={{
              width: imageWidth,
              height: imageHeight,
              maxWidth: "none",
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
            }}
          />
        </div>
      </section>
      <p className="field-help">
        Las posiciones de los espacios del catálogo están pendientes de
        vinculación. El plano no indica disponibilidad en tiempo real; consulta
        y reserva desde Espacios.
      </p>
      <aside className="integration-pending">
        <Workflow size={22} />
        <div>
          <h3>Integración de calendario con n8n</h3>
          <p>
            Pendiente de conectar el webhook de Tomas. Las propuestas deberán
            validar estado, aforo y cruces en el servidor antes de aplicarse.
          </p>
        </div>
        <span className="status-badge">Pendiente de conexión</span>
      </aside>
    </section>
  );
}
