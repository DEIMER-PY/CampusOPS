import assert from "node:assert/strict";
import test from "node:test";
import { inspectEquipment } from "../src/ai/vision.js";

const observation = {
  observation: "NOT_ASSESSABLE",
  visibleAssetCode: null,
  findings: "No se distingue un equipo.",
  limitations: "La imagen no permite verificar funcionamiento.",
  recommendation: "Solicitar una fotografía legible.",
  priority: "LOW",
};
const stub = (content: unknown, finish_reason = "stop"): typeof fetch =>
  (async () =>
    new Response(
      JSON.stringify({
        choices: [
          { finish_reason, message: { content: JSON.stringify(content) } },
        ],
      }),
      { status: 200 },
    )) as typeof fetch;
test("visual assessment rejects executable additions, invalid priorities and truncated output", async () => {
  process.env.GROQ_API_KEY ||= "test-only-not-a-credential";
  for (const [content, finish] of [
    [{ ...observation, state: "AVAILABLE" }, "stop"],
    [{ ...observation, priority: "urgent" }, "stop"],
    [observation, "length"],
  ] as const)
    await assert.rejects(
      inspectEquipment(
        "PC-1",
        "Prueba aislada",
        "data:image/jpeg;base64,AA==",
        stub(content, finish),
      ),
    );
});
test("an unreadable equipment code stays unknown; mismatches are recorded", async () => {
  process.env.GROQ_API_KEY ||= "test-only-not-a-credential";
  const unknown = await inspectEquipment(
    "PC-1",
    "Prueba aislada",
    "data:image/jpeg;base64,AA==",
    stub(observation),
  );
  assert.equal(unknown.codeMatches, null);
  const mismatch = await inspectEquipment(
    "PC-1",
    "Prueba aislada",
    "data:image/jpeg;base64,AA==",
    stub({ ...observation, visibleAssetCode: "PC-2" }),
  );
  assert.equal(mismatch.codeMatches, false);
});
