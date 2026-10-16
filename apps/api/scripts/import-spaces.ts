import { readFileSync } from "node:fs";
import { database, disconnectDatabase } from "../src/db.js";
import { parseSpaceCatalog } from "../src/domain/catalog.js";

try {
  const rows = parseSpaceCatalog(
    readFileSync(
      new URL("../../../data/official/spaces.csv", import.meta.url),
      "utf8",
    ),
  );
  await database().$transaction(async (tx) => {
    // Validate the entire file before writes. Preserve existing operational states.
    for (const row of rows) {
      const existing = await tx.space.findUnique({ where: { name: row.name } });
      if (existing && existing.capacity !== row.capacity)
        throw new Error(`CATALOG_CAPACITY_CONFLICT:${row.name}`);
      await tx.space.upsert({
        where: { name: row.name },
        update: {},
        create: {
          ...row,
          source:
            "Catálogo suministrado en CONTRATO_N8N_FRONTEND.md, sección 4.A; estados pendientes de confirmación",
        },
      });
    }
  });
  console.log(
    `Catálogo validado e importado: ${rows.length} espacios; estados existentes conservados.`,
  );
} finally {
  await disconnectDatabase();
}
