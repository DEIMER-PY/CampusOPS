import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { Pool } from "pg";

test("n8n SQL revalida extensiones y no presenta clasificación externa como triaje Groq", async () => {
  const connection = process.env.TEST_DATABASE_URL;
  assert.ok(connection);
  assert.equal(new URL(connection).pathname, "/campusflow_test");
  const pool = new Pool({ connectionString: connection });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const spaceId = randomUUID(),
      reservationId = randomUUID(),
      name = `TEST-N8N-${randomUUID()}`;
    const svc = "00000000-0000-4000-8000-00000000cf01";
    await client.query(
      "INSERT INTO app_private.\"Space\" (id,name,capacity,status,source) VALUES ($1,$2,10,'AVAILABLE','TEST')",
      [spaceId, name],
    );
    await client.query(
      'INSERT INTO app_private."Reservation" (id,"spaceId","userId","startAt","endAt",attendees,purpose) VALUES ($1,$2,$3,\'2030-01-10T10:00:00Z\',\'2030-01-10T11:00:00Z\',5,\'TEST\')',
      [reservationId, spaceId, svc],
    );
    await client.query(
      "UPDATE app_private.\"Space\" SET status='DISABLED' WHERE id=$1",
      [spaceId],
    );
    await client.query("SAVEPOINT invalid_extension");
    await assert.rejects(
      () =>
        client.query("SELECT app_private.n8n_apply_plan($1::jsonb)", [
          JSON.stringify({
            ops: [
              {
                op: "extend",
                id: reservationId,
                fin: "2030-01-10T12:00:00Z",
                nota: "TEST",
              },
            ],
          }),
        ]),
      /espacio no habilitado/,
    );
    await client.query("ROLLBACK TO SAVEPOINT invalid_extension");
    const saved = await client.query(
      'SELECT "endAt" FROM app_private."Reservation" WHERE id=$1',
      [reservationId],
    );
    assert.equal(saved.rows[0].endAt.toISOString(), "2030-01-10T11:00:00.000Z");
    const incident = await client.query(
      "SELECT app_private.n8n_apply_plan($1::jsonb) AS result",
      [
        JSON.stringify({
          ops: [
            {
              op: "incident",
              descripcion: "TEST clasificación externa",
              prioridad: "HIGH",
              area: "soporte",
            },
          ],
        }),
      ],
    );
    const id = incident.rows[0].result[0].id;
    const record = await client.query(
      'SELECT "aiStatus",triage,description FROM app_private."Incident" WHERE id=$1',
      [id],
    );
    assert.equal(record.rows[0].aiStatus, "PENDING");
    assert.equal(record.rows[0].triage, null);
    assert.match(record.rows[0].description, /Clasificación externa n8n/);
    const publicAccess = await client.query(
      "SELECT count(*)::int AS n FROM pg_proc p CROSS JOIN LATERAL aclexplode(p.proacl) a WHERE p.oid='app_private.n8n_apply_plan(jsonb)'::regprocedure AND a.grantee=0 AND a.privilege_type='EXECUTE'",
    );
    assert.equal(publicAccess.rows[0].n, 0);
  } finally {
    await client.query("ROLLBACK");
    client.release();
    await pool.end();
  }
});
