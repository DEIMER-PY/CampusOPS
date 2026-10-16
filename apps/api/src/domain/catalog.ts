import { z } from "zod";

const rowSchema = z.strictObject({
  name: z.string().trim().min(1).max(80),
  capacity: z.coerce.number().int().positive().max(10000),
  status: z.enum(["AVAILABLE", "DISABLED", "MAINTENANCE"]),
});
export function parseSpaceCatalog(csv: string) {
  const [header, ...lines] = csv
    .replace(/^\uFEFF/, "")
    .trim()
    .split(/\r?\n/);
  if (header !== "name,capacity,status" || !lines.length)
    throw new Error("CATALOG_HEADER_INVALID");
  const rows = lines.map((line, index) => {
    const fields = line.split(",");
    if (fields.length !== 3)
      throw new Error(`CATALOG_ROW_INVALID:${index + 2}`);
    const [name, capacity, status] = fields;
    return rowSchema.parse({ name, capacity, status });
  });
  if (
    new Set(rows.map((row) => row.name.toLocaleLowerCase("es"))).size !==
    rows.length
  )
    throw new Error("CATALOG_DUPLICATE_NAME");
  return rows;
}
