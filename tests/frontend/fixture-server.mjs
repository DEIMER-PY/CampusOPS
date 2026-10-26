// Serves real frontend components with test-only identity. Binds loopback only.

import { mkdtemp, readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, resolve, sep } from "node:path";
import { build } from "esbuild";

const output = await mkdtemp(join(tmpdir(), "campusflow-frontend-"));
await build({
  entryPoints: ["tests/frontend/workspace-fixture.tsx"],
  bundle: true,
  conditions: ["style"],
  outdir: output,
  entryNames: "fixture",
  format: "esm",
  jsx: "automatic",
  loader: { ".woff": "file", ".woff2": "file" },
  tsconfig: "apps/web/tsconfig.json",
  define: {
    "process.env": "{}",
    "process.env.NODE_ENV": '"development"',
    "process.env.NEXT_PUBLIC_SUPABASE_URL": '"http://test-identity.invalid"',
    "process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY": '"test-only"',
  },
  plugins: [
    {
      name: "isolated-identity",
      setup(b) {
        b.onResolve({ filter: /^@supabase\/ssr$/ }, () => ({
          path: "test-identity",
          namespace: "fixture",
        }));
        b.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({
          contents:
            'export function createBrowserClient(){return {auth:{getSession:async()=>({data:{session:{access_token:"fixture-token"}}}),signOut:async()=>({error:null})}}}',
          loader: "js",
        }));
        b.onResolve({ filter: /^next\/link$/ }, () => ({
          path: "test-link",
          namespace: "link",
        }));
        b.onLoad({ filter: /.*/, namespace: "link" }, () => ({
          contents:
            'import React from "react";export default function Link(props){return React.createElement("a",props)}',
          loader: "js",
          resolveDir: process.cwd(),
        }));
      },
    },
  ],
});
const mime = {
  ".js": "text/javascript",
  ".css": "text/css",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};
const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, "http://localhost").pathname;
  try {
    if (pathname === "/") {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end(
        '<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>CampusFlow · Test fixture</title><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>',
      );
      return;
    }
    const base =
      pathname.startsWith("/brand/") || pathname.startsWith("/plans/")
        ? resolve("apps/web/public")
        : output;
    const path = resolve(base, `.${pathname}`);
    if (!path.startsWith(`${base}${sep}`)) throw new Error("Invalid path");
    res.setHeader(
      "Content-Type",
      mime[extname(path)] || "application/octet-stream",
    );
    res.end(await readFile(path));
  } catch {
    res.statusCode = 404;
    res.end("Not found");
  }
});
const port = Number(process.env.PORT) || 3200;
server.listen(port, "127.0.0.1", () =>
  console.log(`Isolated frontend fixture on 127.0.0.1:${port}`),
);
