import assert from "node:assert/strict";
import test from "node:test";
import { parseSpaceCatalog } from "../src/domain/catalog.js";

test("catálogo valida aforo positivo, duplicados y estructura antes de importar", () => {
  assert.equal(
    parseSpaceCatalog("name,capacity,status\nCosmos,25,DISABLED")[0].capacity,
    25,
  );
  for (const csv of [
    "name,capacity,status\nCosmos,0,DISABLED",
    "name,capacity,status\nCosmos,25,DISABLED\ncosmos,25,DISABLED",
    "name,capacity,status\nCosmos,25,DESCONOCIDO",
    "name,capacity,status\nCosmos,25",
    "name,capacity,status",
  ])
    assert.throws(() => parseSpaceCatalog(csv));
});
