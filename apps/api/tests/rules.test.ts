import assert from "node:assert/strict";
import test from "node:test";
import { hasCapacity, overlaps } from "../src/domain/rules.js";

test("aforo positivo entero, límite permitido y exceso rechazado", () => {
  assert.equal(hasCapacity(25, 25), true);
  for (const value of [0, -1, 26, 1.5, Number.NaN])
    assert.equal(hasCapacity(25, value), false);
});
test("intervalos contiguos permitidos; solapes parciales y contenidos rechazados", () => {
  const d = (hour: number) => new Date(Date.UTC(2026, 9, 16, hour));
  assert.equal(overlaps(d(8), d(10), d(10), d(11)), false);
  assert.equal(overlaps(d(8), d(10), d(9), d(11)), true);
  assert.equal(overlaps(d(8), d(12), d(9), d(10)), true);
});
