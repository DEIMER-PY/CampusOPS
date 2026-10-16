import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import {
  canActorReturnLoan,
  canLoanResource,
  canReturnLoan,
  hasCapacity,
  overlaps,
} from "../src/domain/rules.js";
import type {
  AssetStatus,
  PrismaClient,
} from "../src/generated/prisma/client.js";
import { createLoan, returnLoan } from "../src/services/loans.js";

test("aforo positivo entero, límite permitido y exceso rechazado", () => {
  assert.equal(hasCapacity(25, 25), true);
  for (const value of [0, -1, 26, 1.5, Number.NaN])
    assert.equal(hasCapacity(25, value), false);
});
test("intervalos contiguos permitidos; solapes parciales y contenidos rechazados", () => {
  const d = (hour: number) => new Date(Date.UTC(2026, 9, 16, hour));
  assert.equal(overlaps(d(8), d(10), d(10), d(11)), false);
  assert.equal(overlaps(d(8), d(10), d(9), d(11)), true);
  assert.equal(overlaps(d(8), d(12), d(9), d(10)), true);
});
test("préstamo solo permitido en recursos AVAILABLE sin préstamo activo", () => {
  assert.equal(canLoanResource("AVAILABLE", false), true);
  assert.equal(canLoanResource("AVAILABLE", true), false);
  assert.equal(canLoanResource("DISABLED", false), false);
  assert.equal(canLoanResource("MAINTENANCE", false), false);
});
test("devolución rechaza préstamos ya devueltos y valida propietario o rol operativo", () => {
  assert.equal(canReturnLoan(null), true);
  assert.equal(canReturnLoan(new Date()), false);
  assert.equal(canActorReturnLoan("u-1", { id: "u-1", role: "CLIENT" }), true);
  assert.equal(canActorReturnLoan("u-1", { id: "u-2", role: "CLIENT" }), false);
  assert.equal(
    canActorReturnLoan("u-1", { id: "u-2", role: "OPERATOR" }),
    true,
  );
  assert.equal(canActorReturnLoan("u-1", { id: "u-3", role: "ADMIN" }), true);
});
test("servicio transaccional: concurrencia, estados inhabilitados, devolución duplicada y auditoría atómica", async () => {
  const resources = new Map<
    string,
    {
      id: string;
      code: string;
      name: string;
      status: AssetStatus;
      source: string;
    }
  >();
  const loans = new Map<
    string,
    {
      id: string;
      resourceId: string;
      userId: string;
      createdAt: Date;
      returnedAt: Date | null;
    }
  >();
  const audits: Array<{
    id: string;
    actorId: string;
    action: string;
    entityId: string;
    createdAt: Date;
  }> = [];

  const availableId = randomUUID();
  const disabledId = randomUUID();
  const maintenanceId = randomUUID();
  resources.set(availableId, {
    id: availableId,
    code: "RES-1",
    name: "Kit Arduino",
    status: "AVAILABLE",
    source: "test",
  });
  resources.set(disabledId, {
    id: disabledId,
    code: "RES-2",
    name: "Proyector",
    status: "DISABLED",
    source: "test",
  });
  resources.set(maintenanceId, {
    id: maintenanceId,
    code: "RES-3",
    name: "Cámara",
    status: "MAINTENANCE",
    source: "test",
  });

  let queue = Promise.resolve();
  const fakeDb = {
    $transaction: async <T>(fn: (tx: unknown) => Promise<T>): Promise<T> => {
      const run = queue.then(async () => {
        const snapshotLoans = new Map(
          [...loans.entries()].map(([k, v]) => [k, { ...v }]),
        );
        const snapshotAuditsLen = audits.length;
        const tx = {
          $queryRaw: async (
            strings: TemplateStringsArray,
            ...values: unknown[]
          ) => {
            const sql = strings.join("?");
            if (sql.includes('FROM app_private."Loan"')) {
              const id = String(values[0]);
              const found = loans.get(id);
              return found
                ? [{ id: found.id, resourceId: found.resourceId }]
                : [];
            }
            return [];
          },
          resource: {
            findUnique: async ({ where }: { where: { id: string } }) =>
              resources.get(where.id) ?? null,
          },
          loan: {
            findFirst: async ({
              where,
            }: {
              where: { resourceId: string; returnedAt: null };
            }) => {
              for (const item of loans.values()) {
                if (
                  item.resourceId === where.resourceId &&
                  item.returnedAt === null
                ) {
                  return item;
                }
              }
              return null;
            },
            findUnique: async ({ where }: { where: { id: string } }) =>
              loans.get(where.id) ?? null,
            create: async ({
              data,
            }: {
              data: { resourceId: string; userId: string };
            }) => {
              const created = {
                id: randomUUID(),
                resourceId: data.resourceId,
                userId: data.userId,
                createdAt: new Date(),
                returnedAt: null,
              };
              loans.set(created.id, created);
              return created;
            },
            update: async ({
              where,
              data,
            }: {
              where: { id: string };
              data: { returnedAt: Date };
            }) => {
              const existing = loans.get(where.id);
              if (!existing) throw new Error("Loan not found");
              const updated = { ...existing, returnedAt: data.returnedAt };
              loans.set(where.id, updated);
              return updated;
            },
          },
          auditEvent: {
            create: async ({
              data,
            }: {
              data: { actorId: string; action: string; entityId: string };
            }) => {
              const event = {
                id: randomUUID(),
                actorId: data.actorId,
                action: data.action,
                entityId: data.entityId,
                createdAt: new Date(),
              };
              audits.push(event);
              return event;
            },
          },
        };
        try {
          return await fn(tx);
        } catch (err) {
          loans.clear();
          for (const [k, v] of snapshotLoans) loans.set(k, v);
          audits.splice(snapshotAuditsLen);
          throw err;
        }
      });
      queue = run.then(
        () => undefined,
        () => undefined,
      );
      return run;
    },
  } as unknown as PrismaClient;

  const userA = { id: randomUUID(), role: "CLIENT" as const };
  const userB = { id: randomUUID(), role: "CLIENT" as const };

  // Estados inhabilitados rechazados
  assert.deepEqual(await createLoan(fakeDb, userA, disabledId), {
    ok: false,
    reason: "RESOURCE_UNAVAILABLE",
  });
  assert.deepEqual(await createLoan(fakeDb, userA, maintenanceId), {
    ok: false,
    reason: "RESOURCE_UNAVAILABLE",
  });
  assert.equal(loans.size, 0);
  assert.equal(audits.length, 0);

  // Dos préstamos concurrentes: solo uno persiste
  const [res1, res2] = await Promise.all([
    createLoan(fakeDb, userA, availableId),
    createLoan(fakeDb, userB, availableId),
  ]);
  const created = [res1, res2].filter((r) => r.ok);
  const rejected = [res1, res2].filter((r) => !r.ok);
  assert.equal(created.length, 1);
  assert.equal(rejected.length, 1);
  assert.equal(rejected[0].reason, "RESOURCE_ALREADY_LOANED");
  assert.equal(loans.size, 1);
  assert.equal(audits.length, 1);
  assert.equal(audits[0].action, "loan.created");

  const loanId = created[0].data.id;

  // Devolución duplicada rechazada y auditoría atómica
  const [ret1, ret2] = await Promise.all([
    returnLoan(fakeDb, userA, loanId),
    returnLoan(fakeDb, userA, loanId),
  ]);
  const returned = [ret1, ret2].filter((r) => r.ok);
  const dupRejected = [ret1, ret2].filter((r) => !r.ok);
  assert.equal(returned.length, 1);
  assert.ok(returned[0].data.returnedAt);
  assert.equal(dupRejected.length, 1);
  assert.equal(dupRejected[0].reason, "LOAN_ALREADY_RETURNED");
  assert.equal(audits.length, 2);
  assert.equal(audits[1].action, "loan.returned");
});
