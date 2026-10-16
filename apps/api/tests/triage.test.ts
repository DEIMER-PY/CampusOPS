import assert from "node:assert/strict";
import test from "node:test";
import { AIUnavailable, classifyIncident } from "../src/ai/triage.js";

const valid = {
  category: "TECHNICAL",
  priority: "HIGH",
  area: "SOPORTE_TECNICO",
  summary: "Proyector sin encender",
  explanation: "El grupo no puede continuar.",
  suggestedAction: "Revisar el equipo.",
};
function stub(body: unknown, status = 200): typeof fetch {
  return (async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    })) as typeof fetch;
}
const completion = (content: unknown, finish_reason = "stop") => ({
  id: "test-completion",
  model: "test-model",
  choices: [{ finish_reason, message: { content: JSON.stringify(content) } }],
  usage: { total_tokens: 123 },
});

test("structured triage validates content and preserves provenance", async () => {
  process.env.GROQ_API_KEY ||= "test-only-not-a-credential";
  const result = await classifyIncident(
    "Descripción de prueba técnica",
    stub(completion(valid)),
  );
  assert.equal(result.priority, "HIGH");
  assert.equal(result.tokens, 123);
  assert.equal(result.promptVersion, "campus-triage-v2");
});
test("malformed, truncated, injected fields and inconsistent routes never become a triage", async () => {
  for (const response of [
    completion({ ...valid, priority: "urgent" }),
    completion({ ...valid, sql: "DROP" }),
    completion({ ...valid, area: "COORDINACION" }),
    completion(valid, "length"),
    { choices: [] },
  ]) {
    await assert.rejects(
      () => classifyIncident("Reporte", stub(response)),
      (e: unknown) =>
        e instanceof AIUnavailable && e.code === "AI_INVALID_RESPONSE",
    );
  }
});
test("provider quota produces a retryable failure, without invented fallback", async () => {
  await assert.rejects(
    () => classifyIncident("Reporte", stub({ error: "quota" }, 429)),
    (e: unknown) => e instanceof AIUnavailable && e.code === "AI_RATE_LIMIT",
  );
});
test("network failures do not expose provider details or secrets", async () => {
  const fail = (async () => {
    throw new Error("sensitive provider details");
  }) as typeof fetch;
  await assert.rejects(
    () => classifyIncident("Reporte", fail),
    (e: unknown) =>
      e instanceof AIUnavailable && e.message === "AI_PROVIDER_ERROR",
  );
});
