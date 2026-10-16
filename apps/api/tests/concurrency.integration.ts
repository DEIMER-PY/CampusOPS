import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { Pool } from "pg";

test("PostgreSQL real: aforo/intervalos y exclusión de reservas/préstamos concurrentes", async () => {
  const connectionString = process.env.TEST_DATABASE_URL;
  assert.ok(
    connectionString,
    "TEST_DATABASE_URL requerida: usar exclusivamente BD aislada",
  );
  const target = new URL(connectionString);
  assert.equal(
    target.pathname,
    "/campusflow_test",
    "Protección: la BD debe llamarse campusflow_test",
  );
  const pool = new Pool({ connectionString, max: 4 });
  const userId = randomUUID();
  const spaceId = randomUUID();
  const resourceId = randomUUID();
  try {
    await pool.query('INSERT INTO app_private."Profile" (id) VALUES ($1)', [
      userId,
    ]);
    await pool.query(
      "INSERT INTO app_private.\"Space\" (id,name,capacity,status,source) VALUES ($1,$2,25,'AVAILABLE','isolated integration test')",
      [spaceId, `test-${spaceId}`],
    );
    const reservation = (start: string, end: string) =>
      pool.query(
        'INSERT INTO app_private."Reservation" (id,"spaceId","userId","startAt","endAt",attendees,purpose) VALUES ($1,$2,$3,$4,$5,20,\'isolated test\')',
        [randomUUID(), spaceId, userId, start, end],
      );
    const attempts = await Promise.allSettled([
      reservation("2026-10-16T08:00:00Z", "2026-10-16T10:00:00Z"),
      reservation("2026-10-16T09:00:00Z", "2026-10-16T10:00:00Z"),
    ]);
    assert.equal(attempts.filter((r) => r.status === "fulfilled").length, 1);
    const rejected = attempts.find((r) => r.status === "rejected");
    assert.ok(rejected?.status === "rejected");
    assert.equal(rejected.reason.code, "23P01");
    await reservation("2026-10-16T10:00:00Z", "2026-10-16T11:00:00Z");
    await assert.rejects(
      reservation("2026-10-16T13:00:00Z", "2026-10-16T12:00:00Z"),
      { code: "23514" },
    );
    await pool.query(
      "INSERT INTO app_private.\"Resource\" (id,code,name,status,source) VALUES ($1,$2,'test resource','AVAILABLE','isolated integration test')",
      [resourceId, `test-${resourceId}`],
    );
    const loan = () =>
      pool.query(
        'INSERT INTO app_private."Loan" (id,"resourceId","userId") VALUES ($1,$2,$3)',
        [randomUUID(), resourceId, userId],
      );
    const loans = await Promise.allSettled([loan(), loan()]);
    assert.equal(loans.filter((r) => r.status === "fulfilled").length, 1);
    const duplicate = loans.find((r) => r.status === "rejected");
    assert.ok(duplicate?.status === "rejected");
    assert.equal(duplicate.reason.code, "23505");
  } finally {
    await pool.query('DELETE FROM app_private."Loan" WHERE "resourceId"=$1', [
      resourceId,
    ]);
    await pool.query(
      'DELETE FROM app_private."Reservation" WHERE "spaceId"=$1',
      [spaceId],
    );
    await pool.query('DELETE FROM app_private."Resource" WHERE id=$1', [
      resourceId,
    ]);
    await pool.query('DELETE FROM app_private."Space" WHERE id=$1', [spaceId]);
    await pool.query('DELETE FROM app_private."Profile" WHERE id=$1', [userId]);
    await pool.end();
  }
});
