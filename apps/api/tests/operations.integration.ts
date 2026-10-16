import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import test from "node:test";
import { Pool } from "pg";

// Real Express + Prisma + PostgreSQL. Only the identity provider is a local test double.
test("API integrada: permisos, préstamos concurrentes, devoluciones e incidencias privadas", async () => {
  const connection = process.env.TEST_DATABASE_URL;
  assert.ok(connection);
  assert.equal(new URL(connection).pathname, "/campusflow_test");
  process.env.DATABASE_URL = connection;
  delete process.env.DATABASE_SSL_CA_FILE;
  const users = {
    admin: randomUUID(),
    client: randomUUID(),
    other: randomUUID(),
  };
  const identity = createServer((req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const uid = users[token as keyof typeof users];
    res.setHeader("Content-Type", "application/json");
    res.statusCode = uid ? 200 : 401;
    res.end(
      JSON.stringify(
        uid
          ? {
              id: uid,
              aud: "authenticated",
              email: "fixture@example.test",
              app_metadata: {},
              user_metadata: {},
              created_at: new Date().toISOString(),
            }
          : { message: "invalid token" },
      ),
    );
  });
  await new Promise<void>((resolve) =>
    identity.listen(0, "127.0.0.1", resolve),
  );
  process.env.SUPABASE_URL = `http://127.0.0.1:${(identity.address() as AddressInfo).port}`;
  process.env.SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";
  const { app } = await import("../src/app.js");
  const { disconnectDatabase } = await import("../src/db.js");
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const pool = new Pool({ connectionString: connection });
  const resources: string[] = [];
  const originalFetch = globalThis.fetch;
  const request = async (
    actor: keyof typeof users | "invalid",
    path: string,
    method = "GET",
    body?: unknown,
  ) => {
    const response = await originalFetch(`${origin}/api${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${actor}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: response.status, payload: await response.json() };
  };
  try {
    for (const [role, uid] of Object.entries(users))
      await pool.query(
        'INSERT INTO app_private."Profile" (id,role) VALUES ($1,$2)',
        [uid, role === "admin" ? "ADMIN" : "CLIENT"],
      );
    assert.equal((await request("invalid", "/resources")).status, 401);
    assert.equal((await request("client", "/admin/audit")).status, 403);
    assert.equal(
      (await request("client", "/resources", "POST", { code: "x", name: "x" }))
        .status,
      403,
    );
    const created = await request("admin", "/resources", "POST", {
      code: `fixture-${randomUUID()}`,
      name: "Equipo de prueba aislada",
      source: "isolated integration fixture",
      status: "AVAILABLE",
    });
    assert.equal(created.status, 201);
    const resourceId = created.payload.data.id;
    resources.push(resourceId);
    const attempts = await Promise.all([
      request("client", "/loans", "POST", { resourceId }),
      request("other", "/loans", "POST", { resourceId }),
    ]);
    assert.deepEqual(attempts.map((r) => r.status).sort(), [201, 409]);
    const loanId = attempts.find((r) => r.status === 201)?.payload.data.id;
    assert.equal(
      (await request("client", `/loans/${loanId}/return`, "POST")).status,
      403,
    );
    assert.equal(
      (await request("admin", `/loans/${loanId}/return`, "POST")).status,
      200,
    );
    assert.equal(
      (
        await request("admin", `/resources/${resourceId}`, "PATCH", {
          status: "MAINTENANCE",
        })
      ).status,
      200,
    );
    assert.equal(
      (await request("client", "/loans", "POST", { resourceId })).status,
      409,
    );
    assert.equal(
      (await request("client", "/incidents", "POST", { description: "short" }))
        .status,
      400,
    );
    const report = await request("client", "/incidents", "POST", {
      description:
        "El proyector del aula no enciende y el grupo no puede continuar.",
    });
    assert.equal(report.status, 201);
    const incidentId = report.payload.data.id;
    assert.equal(
      (await request("other", `/incidents/${incidentId}/triage`, "POST"))
        .status,
      404,
    );
    assert.equal((await request("other", "/incidents")).payload.data.length, 0);
    assert.equal(
      (
        await request("client", `/incidents/${incidentId}`, "PATCH", {
          status: "RESOLVED",
        })
      ).status,
      403,
    );
    // Exercise real provider only with explicit opt-in; regular CI has no provider secret.
    if (process.env.RUN_LIVE_AI === "1") {
      assert.ok(process.env.GROQ_API_KEY);
      const result = await request(
        "client",
        `/incidents/${incidentId}/triage`,
        "POST",
      );
      assert.equal(result.status, 200);
      assert.equal(result.payload.data.aiStatus, "COMPLETE");
      assert.ok(result.payload.data.triage.model);
      assert.ok(result.payload.data.triage.contextObservedAt);
      assert.equal(
        result.payload.data.triage.contextLimits.calendarAvailability,
        "NOT_INCLUDED",
      );
      const replay = await request(
        "client",
        `/incidents/${incidentId}/triage`,
        "POST",
      );
      assert.equal(
        replay.payload.data.triage.providerId,
        result.payload.data.triage.providerId,
      );
    } else {
      process.env.GROQ_API_KEY = "test-only";
      globalThis.fetch = (async (url, init) =>
        String(url).startsWith("https://api.groq.com/")
          ? new Response("{}", { status: 429 })
          : originalFetch(url, init)) as typeof fetch;
      assert.equal(
        (await request("client", `/incidents/${incidentId}/triage`, "POST"))
          .status,
        503,
      );
      const persisted = (await request("client", "/incidents")).payload.data[0];
      assert.equal(persisted.aiStatus, "FAILED");
      assert.equal(persisted.triage, null);
      assert.equal(persisted.aiError, "AI_RATE_LIMIT");
    }
    assert.equal(
      (
        await request("admin", `/incidents/${incidentId}`, "PATCH", {
          status: "IN_PROGRESS",
        })
      ).status,
      200,
    );
    const logs = await pool.query(
      'SELECT action FROM app_private."AuditEvent" WHERE "actorId" = ANY($1::uuid[])',
      [Object.values(users)],
    );
    assert.ok(logs.rows.some((r) => r.action === "resource.maintenance"));
    assert.ok(logs.rows.some((r) => r.action === "loan.returned"));
  } finally {
    globalThis.fetch = originalFetch;
    await pool.query(
      'DELETE FROM app_private."AuditEvent" WHERE "actorId" = ANY($1::uuid[])',
      [Object.values(users)],
    );
    await pool.query(
      'DELETE FROM app_private."Incident" WHERE "userId" = ANY($1::uuid[])',
      [Object.values(users)],
    );
    await pool.query(
      'DELETE FROM app_private."Loan" WHERE "userId" = ANY($1::uuid[])',
      [Object.values(users)],
    );
    await pool.query(
      'DELETE FROM app_private."Resource" WHERE id = ANY($1::uuid[])',
      [resources],
    );
    await pool.query(
      'DELETE FROM app_private."Profile" WHERE id = ANY($1::uuid[])',
      [Object.values(users)],
    );
    await pool.end();
    await disconnectDatabase();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await new Promise<void>((resolve) => identity.close(() => resolve()));
  }
});
