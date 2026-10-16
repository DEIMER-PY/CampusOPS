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
  const boards: string[] = [];
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
    const agendaStatus = await request("admin", "/agenda/status");
    assert.equal(agendaStatus.status, 200);
    assert.deepEqual(Object.keys(agendaStatus.payload.data).sort(), [
      "configured",
      "executionEnabled",
    ]);
    assert.equal(typeof agendaStatus.payload.data.configured, "boolean");
    assert.equal((await request("client", "/agenda/status")).status, 403);

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
    assert.equal(
      (await request("other", `/incidents/${incidentId}/evidence`)).status,
      404,
    );
    assert.equal(
      (
        await request("other", `/incidents/${incidentId}/messages`, "POST", {
          message: "No debe guardarse",
        })
      ).status,
      404,
    );
    assert.equal(
      (
        await request("client", `/incidents/${incidentId}/messages`, "POST", {
          message: "Contexto adicional de prueba",
        })
      ).status,
      201,
    );
    const conversation = (
      await request("admin", "/incidents")
    ).payload.data.find((r: { id: string }) => r.id === incidentId);
    assert.equal(conversation.communications[0].role, "CLIENT");
    assert.equal(
      conversation.communications[0].message,
      "Contexto adicional de prueba",
    );
    assert.ok(!("evidence" in conversation));
    const image = (await import("sharp")).default;
    const bytes = await image({
      create: { width: 20, height: 20, channels: 3, background: "white" },
    })
      .png()
      .toBuffer();
    const photo = {
      assetCode: created.payload.data.code,
      image: `data:image/png;base64,${bytes.toString("base64")}`,
    };
    assert.equal(
      (
        await request(
          "client",
          `/incidents/${incidentId}/evidence`,
          "POST",
          photo,
        )
      ).status,
      201,
    );
    const stored = (
      await request("client", `/incidents/${incidentId}/evidence`)
    ).payload.data;
    assert.ok(stored.evidence.image.startsWith("data:image/jpeg;base64,"));
    assert.equal(stored.assetCode, photo.assetCode);
    assert.equal(
      (
        await request(
          "client",
          `/incidents/${incidentId}/evidence`,
          "POST",
          photo,
        )
      ).status,
      409,
    );
    process.env.GROQ_API_KEY ||= "test-only-not-a-credential";
    let visualCalls = 0;
    globalThis.fetch = (async (url, init) =>
      String(url).startsWith("https://api.groq.com/")
        ? (visualCalls++,
          new Response(
            JSON.stringify({
              choices: [
                {
                  finish_reason: "stop",
                  message: {
                    content: JSON.stringify({
                      observation: "NOT_ASSESSABLE",
                      visibleAssetCode: null,
                      findings:
                        "Fotografía de prueba sin un equipo reconocible.",
                      limitations: "No permite comprobar funcionamiento.",
                      recommendation: "Adjuntar una foto del equipo.",
                      priority: "LOW",
                    }),
                  },
                },
              ],
            }),
            { status: 200 },
          ))
        : originalFetch(url, init)) as typeof fetch;
    assert.equal(
      (await request("other", `/incidents/${incidentId}/vision`, "POST"))
        .status,
      404,
    );
    assert.equal(
      (await request("client", `/incidents/${incidentId}/vision`, "POST"))
        .status,
      200,
    );
    assert.equal(
      (await request("client", `/incidents/${incidentId}/vision`, "POST"))
        .status,
      200,
    );
    assert.equal(visualCalls, 1);
    const resourceAfter = await pool.query(
      'SELECT status FROM app_private."Resource" WHERE id=$1',
      [resourceId],
    );
    assert.equal(resourceAfter.rows[0].status, "MAINTENANCE");
    process.env.RESEND_API_KEY = "test-only-not-a-credential";
    process.env.NOTIFICATION_RECIPIENT = "operations@example.test";
    let mailCalls = 0;
    globalThis.fetch = (async (url, init) => {
      if (String(url).startsWith("https://api.resend.com/")) {
        mailCalls++;
        const payload = JSON.parse(String(init?.body));
        assert.deepEqual(payload.to, ["operations@example.test"]);
        return new Response(JSON.stringify({ id: "fixture-mail-id" }), {
          status: 200,
        });
      }
      return originalFetch(url, init);
    }) as typeof fetch;
    assert.equal(
      (await request("client", `/incidents/${incidentId}/notify`, "POST"))
        .status,
      403,
    );
    assert.equal(
      (await request("admin", `/incidents/${incidentId}/notify`, "POST"))
        .payload.data.status,
      "ACCEPTED",
    );
    assert.equal(
      (await request("admin", `/incidents/${incidentId}/notify`, "POST"))
        .payload.data.status,
      "ACCEPTED",
    );
    assert.equal(mailCalls, 1);
    globalThis.fetch = originalFetch;
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
    const boardId = randomUUID();
    boards.push(boardId);
    const scheduleBlocks = [
      {
        id: "a",
        category: "ENGLISH",
        room: "Test room",
        startMinute: 420,
        endMinute: 480,
        label: "Group A",
        attendees: 5,
        course: "B1",
        instructor: "Teacher",
        status: "DRAFT",
        metadata: {},
        timeConfidence: "VISIBLE",
        spaceId: null,
      },
      {
        id: "b",
        category: "SER",
        room: "Test room",
        startMinute: 480,
        endMinute: 540,
        label: "Group B",
        attendees: null,
        course: null,
        instructor: null,
        status: "DRAFT",
        metadata: {},
        timeConfidence: "VISIBLE",
        spaceId: null,
      },
    ];
    await pool.query(
      'INSERT INTO app_private."ScheduleBoard" (id,"sourceKey","sourceHash",title,rooms,entries) VALUES ($1,$2,$3,$4,$5,$6)',
      [
        boardId,
        `fixture-${boardId}`,
        "fixture-source-hash",
        "Isolated schedule fixture",
        JSON.stringify(["Test room"]),
        JSON.stringify(scheduleBlocks),
      ],
    );
    const patchBlock = { ...scheduleBlocks[0], expectedRevision: 1 };
    const {
      id: _id,
      metadata: _metadata,
      timeConfidence: _confidence,
      ...editable
    } = patchBlock;
    assert.equal(
      (
        await request(
          "client",
          `/schedule/${boardId}/entries/a`,
          "PATCH",
          editable,
        )
      ).status,
      403,
    );
    const edits = await Promise.all([
      request("admin", `/schedule/${boardId}/entries/a`, "PATCH", {
        ...editable,
        label: "Edit A",
      }),
      request("admin", `/schedule/${boardId}/entries/a`, "PATCH", {
        ...editable,
        label: "Edit B",
      }),
    ]);
    assert.deepEqual(edits.map((r) => r.status).sort(), [200, 409]);
    assert.equal(
      (
        await request("admin", `/schedule/${boardId}/entries/a`, "PATCH", {
          ...editable,
          expectedRevision: 2,
          startMinute: 480,
          endMinute: 540,
        })
      ).status,
      409,
    );
    const boardAfter = await pool.query(
      'SELECT revision FROM app_private."ScheduleBoard" WHERE id=$1',
      [boardId],
    );
    assert.equal(boardAfter.rows[0].revision, 2);
    const logs = await pool.query(
      'SELECT action FROM app_private."AuditEvent" WHERE "actorId" = ANY($1::uuid[])',
      [Object.values(users)],
    );
    assert.ok(logs.rows.some((r) => r.action === "resource.maintenance"));
    assert.ok(logs.rows.some((r) => r.action === "loan.returned"));
  } finally {
    globalThis.fetch = originalFetch;
    await pool.query(
      'DELETE FROM app_private."ScheduleBoard" WHERE id = ANY($1::uuid[])',
      [boards],
    );
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
