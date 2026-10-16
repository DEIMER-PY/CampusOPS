import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { createLoan, returnLoan } from "../src/services/loans.js";

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
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString, max: 4 }),
  });
  const userId = randomUUID();
  const otherUserId = randomUUID();
  const spaceId = randomUUID();
  const resourceId = randomUUID();
  const serviceResourceId = randomUUID();
  const disabledResourceId = randomUUID();
  const maintenanceResourceId = randomUUID();
  try {
    await pool.query(
      "INSERT INTO app_private.\"Profile\" (id, role) VALUES ($1, 'CLIENT'), ($2, 'CLIENT')",
      [userId, otherUserId],
    );
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

    // Pruebas del servicio transaccional createLoan / returnLoan
    await pool.query(
      `INSERT INTO app_private."Resource" (id,code,name,status,source) VALUES
        ($1,$2,'service available','AVAILABLE','isolated integration test'),
        ($3,$4,'service disabled','DISABLED','isolated integration test'),
        ($5,$6,'service maintenance','MAINTENANCE','isolated integration test')`,
      [
        serviceResourceId,
        `svc-${serviceResourceId}`,
        disabledResourceId,
        `dis-${disabledResourceId}`,
        maintenanceResourceId,
        `mnt-${maintenanceResourceId}`,
      ],
    );
    const actor = { id: userId, role: "CLIENT" as const };
    const otherActor = { id: otherUserId, role: "CLIENT" as const };

    // 1. Estados inhabilitados rechazados sin dejar préstamos ni auditoría
    const disabledAttempt = await createLoan(prisma, actor, disabledResourceId);
    assert.deepEqual(disabledAttempt, {
      ok: false,
      reason: "RESOURCE_UNAVAILABLE",
    });
    const maintenanceAttempt = await createLoan(
      prisma,
      actor,
      maintenanceResourceId,
    );
    assert.deepEqual(maintenanceAttempt, {
      ok: false,
      reason: "RESOURCE_UNAVAILABLE",
    });

    // 2. Dos préstamos concurrentes sobre el mismo recurso: solo uno persiste
    const concurrentLoans = await Promise.all([
      createLoan(prisma, actor, serviceResourceId),
      createLoan(prisma, otherActor, serviceResourceId),
    ]);
    const succeededLoans = concurrentLoans.filter((r) => r.ok);
    const failedLoans = concurrentLoans.filter((r) => !r.ok);
    assert.equal(succeededLoans.length, 1);
    assert.equal(failedLoans.length, 1);
    assert.equal(failedLoans[0].reason, "RESOURCE_ALREADY_LOANED");
    const activeLoan = succeededLoans[0].data;
    const ownerActor = activeLoan.userId === userId ? actor : otherActor;
    const nonOwnerActor = activeLoan.userId === userId ? otherActor : actor;

    // 3. Propietario requerido para CLIENT; devolución concurrente/duplicada rechazada
    const forbiddenReturn = await returnLoan(
      prisma,
      nonOwnerActor,
      activeLoan.id,
    );
    assert.deepEqual(forbiddenReturn, { ok: false, reason: "FORBIDDEN" });

    const concurrentReturns = await Promise.all([
      returnLoan(prisma, ownerActor, activeLoan.id),
      returnLoan(prisma, ownerActor, activeLoan.id),
    ]);
    const succeededReturns = concurrentReturns.filter((r) => r.ok);
    const failedReturns = concurrentReturns.filter((r) => !r.ok);
    assert.equal(succeededReturns.length, 1);
    assert.ok(succeededReturns[0].data.returnedAt);
    assert.equal(failedReturns.length, 1);
    assert.equal(failedReturns[0].reason, "LOAN_ALREADY_RETURNED");

    const duplicateReturn = await returnLoan(prisma, ownerActor, activeLoan.id);
    assert.deepEqual(duplicateReturn, {
      ok: false,
      reason: "LOAN_ALREADY_RETURNED",
    });

    // 4. Auditoría atómica: exactamente un loan.created y un loan.returned para el préstamo
    const auditRows = await pool.query<{ action: string }>(
      'SELECT action FROM app_private."AuditEvent" WHERE "entityId" = $1 ORDER BY "createdAt" ASC, action ASC',
      [activeLoan.id],
    );
    assert.deepEqual(
      auditRows.rows.map((r) => r.action),
      ["loan.created", "loan.returned"],
    );
  } finally {
    await pool.query(
      'DELETE FROM app_private."AuditEvent" WHERE "actorId" IN ($1, $2)',
      [userId, otherUserId],
    );
    await pool.query(
      'DELETE FROM app_private."Loan" WHERE "resourceId" IN ($1, $2, $3, $4)',
      [
        resourceId,
        serviceResourceId,
        disabledResourceId,
        maintenanceResourceId,
      ],
    );
    await pool.query(
      'DELETE FROM app_private."Reservation" WHERE "spaceId"=$1',
      [spaceId],
    );
    await pool.query(
      'DELETE FROM app_private."Resource" WHERE id IN ($1, $2, $3, $4)',
      [
        resourceId,
        serviceResourceId,
        disabledResourceId,
        maintenanceResourceId,
      ],
    );
    await pool.query('DELETE FROM app_private."Space" WHERE id=$1', [spaceId]);
    await pool.query('DELETE FROM app_private."Profile" WHERE id IN ($1, $2)', [
      userId,
      otherUserId,
    ]);
    await prisma.$disconnect();
    await pool.end();
  }
});
