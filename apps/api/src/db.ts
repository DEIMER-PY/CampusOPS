import { readFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";

let client: PrismaClient | undefined;
export function database() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_NOT_CONFIGURED");
  const connection = new URL(process.env.DATABASE_URL);
  const caFile = process.env.DATABASE_SSL_CA_FILE;
  const ca =
    process.env.DATABASE_SSL_CA_CERT ||
    (caFile ? readFileSync(caFile, "utf8") : undefined);
  if (ca) {
    for (const key of ["sslmode", "sslrootcert", "sslcert", "sslkey"])
      connection.searchParams.delete(key);
  }
  client ??= new PrismaClient({
    adapter: new PrismaPg({
      connectionString: connection.toString(),
      ...(ca
        ? {
            ssl: { ca, rejectUnauthorized: true },
          }
        : {}),
      max: 5,
    }),
  });
  return client;
}
export async function disconnectDatabase() {
  await client?.$disconnect();
}
