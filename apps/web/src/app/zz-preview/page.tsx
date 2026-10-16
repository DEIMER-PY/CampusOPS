"use client";
// TEMPORAL (no se confirma en Git): vista previa local del asistente conectado al n8n de pruebas.
import { useState } from "react";
import { AgendaAssistant } from "../../components/agenda-assistant";

const spaces = [
  ["Auditorio", 100],
  ["Spooki", 38],
  ["Apolo", 34],
  ["Artemis", 32],
  ["Cosmos", 25],
  ["Skilab", 20],
  ["Blanca", 12],
  ["Azul", 10],
  ["Amarillas", 6],
  ["Azules", 6],
  ["Verdes", 6],
].map(([name, capacity], i) => ({
  id: `s${i}`,
  name: String(name),
  capacity: Number(capacity),
  status: "AVAILABLE",
}));

export default function Preview() {
  const [applied, setApplied] = useState(0);
  const api = async <T,>(path: string, _m?: string, body?: unknown) => {
    if (path !== "/agenda/assistant") throw new Error("ruta no simulada");
    const input = body as Record<string, unknown>;
    const response = await fetch(
      "http://localhost:5679/webhook/test-campusflow",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer cf-test-secret",
        },
        body: JSON.stringify({ ...input, usuario: "operador-demo" }),
      },
    );
    const j = await response.json();
    if (!response.ok)
      throw new Error(j.decisionIA?.explicacion || "n8n respondió con error");
    const execution =
      input.modo === "PROPUESTA" || j.ejecucion === "NO_APLICADA"
        ? "NOT_APPLIED"
        : j.ejecucion === "APLICADA"
          ? "APPLIED"
          : j.ejecucion === "SIN_CAMBIOS"
            ? "NO_CHANGES"
            : "NOT_REPORTED";
    return {
      proposal: j,
      execution,
      requestId: crypto.randomUUID(),
      receivedAt: new Date().toISOString(),
      warnings: [],
    } as T;
  };
  return (
    <main style={{ padding: 24, maxWidth: 1280, margin: "0 auto" }}>
      <p data-applied={applied}>
        VISTA PREVIA LOCAL · n8n de pruebas + base local · el intérprete es un
        doble de prueba (no Gemini) · cambios aplicados: {applied}
      </p>
      <AgendaAssistant
        api={api}
        spaces={spaces}
        reservations={[]}
        operator
        disabled={false}
        onApplied={() => setApplied((n) => n + 1)}
      />
    </main>
  );
}
