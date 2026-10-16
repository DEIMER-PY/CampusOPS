import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parseParticipants } from "../../web/src/lib/participants.js";
import { scheduleEntry, scheduleIssues } from "../src/schedule.js";

const reference = JSON.parse(
  readFileSync(
    new URL("../../../data/imports/schedule-reference.json", import.meta.url),
    "utf8",
  ),
);
test("schedule transcription preserves 24 source blocks, cancellation and missing date", () => {
  const entries = reference.entries.map((entry: unknown) =>
    scheduleEntry.parse(entry),
  );
  assert.equal(entries.length, 24);
  assert.equal(
    entries.filter((e: { category: string }) => e.category === "ENGLISH")
      .length,
    12,
  );
  assert.equal(
    entries.filter((e: { status: string }) => e.status === "CANCELLED").length,
    1,
  );
  assert.equal(reference.applicableDate, null);
  assert.ok(
    entries
      .filter((e: { category: string }) => e.category === "SOFTWARE")
      .every(
        (e: { timeConfidence: string }) =>
          e.timeConfidence === "VISUAL_RANGE_UNCONFIRMED",
      ),
  );
});
test("cancelled entries do not conflict; disabled and undersized spaces stay flagged", () => {
  const a = scheduleEntry.parse(reference.entries[0]);
  const b = { ...a, id: "another", status: "CANCELLED" as const };
  assert.ok(!scheduleIssues(a, [a, b], []).some((x) => x.includes("Cruce")));
  const c = { ...a, spaceId: "f00b2fa9-9357-4309-9c75-5d7e29b62290" };
  const issues = scheduleIssues(
    c,
    [c],
    [{ id: c.spaceId, capacity: 1, status: "DISABLED" }],
  );
  assert.ok(issues.some((x) => x.includes("aforo")));
  assert.ok(issues.some((x) => x.includes("habilitado")));
});
test("participant names keep the letter n and split real line breaks", () => {
  assert.deepEqual(parseParticipants("Ana\nBruno,Leonardo\r\nSamuel"), [
    "Ana",
    "Bruno",
    "Leonardo",
    "Samuel",
  ]);
});
