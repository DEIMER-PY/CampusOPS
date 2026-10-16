import { writeFile } from "node:fs/promises";

const names = [
  "next",
  "react",
  "react-dom",
  "tailwindcss",
  "@tailwindcss/postcss",
  "typescript",
  "@types/node",
  "@types/react",
  "@types/react-dom",
  "express",
  "@types/express",
  "cors",
  "@types/cors",
  "helmet",
  "express-rate-limit",
  "zod",
  "dotenv",
  "tsx",
  "prisma",
  "@prisma/client",
  "@prisma/adapter-pg",
  "pg",
  "@types/pg",
  "@supabase/supabase-js",
  "@supabase/ssr",
  "lucide-react",
  "clsx",
  "tailwind-merge",
  "concurrently",
  "@playwright/test",
  "@playwright/cli",
  "@biomejs/biome",
  "@upstash/context7-mcp",
];
const versions = Object.fromEntries(
  await Promise.all(
    names.map(async (name) => {
      const response = await fetch(
        `https://registry.npmjs.org/${encodeURIComponent(name)}/latest`,
      );
      if (!response.ok) throw new Error(`${name}: ${response.status}`);
      const metadata = await response.json();
      return [
        name,
        {
          version: metadata.version,
          engines: metadata.engines ?? {},
          peerDependencies: metadata.peerDependencies ?? {},
        },
      ];
    }),
  ),
);
await writeFile(
  new URL("../dependency-versions.json", import.meta.url),
  JSON.stringify({ checkedAt: new Date().toISOString(), versions }, null, 2) +
    "\n",
);
console.log(JSON.stringify(versions, null, 2));
