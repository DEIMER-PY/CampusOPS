import {
  canActorReturnLoan,
  canLoanResource,
  canReturnLoan,
} from "../domain/rules.js";
import {
  Prisma,
  type PrismaClient,
  type Role,
} from "../generated/prisma/client.js";

export interface LoanActor {
  id: string;
  role: Role;
}

export type CreateLoanOutcome =
  | { ok: true; data: Prisma.LoanGetPayload<object> }
  | {
      ok: false;
      reason:
        | "RESOURCE_NOT_FOUND"
        | "RESOURCE_UNAVAILABLE"
        | "RESOURCE_ALREADY_LOANED";
    };

export type ReturnLoanOutcome =
  | { ok: true; data: Prisma.LoanGetPayload<object> }
  | {
      ok: false;
      reason: "LOAN_NOT_FOUND" | "FORBIDDEN" | "LOAN_ALREADY_RETURNED";
    };

export async function createLoan(
  db: PrismaClient,
  actor: LoanActor,
  resourceId: string,
): Promise<CreateLoanOutcome> {
  try {
    return await db.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM app_private."Resource" WHERE id = ${resourceId}::uuid FOR UPDATE`;
        const resource = await tx.resource.findUnique({
          where: { id: resourceId },
        });
        if (!resource) {
          return { ok: false, reason: "RESOURCE_NOT_FOUND" } as const;
        }
        const activeLoan = await tx.loan.findFirst({
          where: { resourceId: resource.id, returnedAt: null },
        });
        if (!canLoanResource(resource.status, Boolean(activeLoan))) {
          return {
            ok: false,
            reason:
              resource.status !== "AVAILABLE"
                ? "RESOURCE_UNAVAILABLE"
                : "RESOURCE_ALREADY_LOANED",
          } as const;
        }
        const loan = await tx.loan.create({
          data: {
            resourceId: resource.id,
            userId: actor.id,
          },
        });
        await tx.auditEvent.create({
          data: {
            actorId: actor.id,
            action: "loan.created",
            entityId: loan.id,
          },
        });
        return { ok: true, data: loan } as const;
      },
      { isolationLevel: "ReadCommitted" },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { ok: false, reason: "RESOURCE_ALREADY_LOANED" };
    }
    throw error;
  }
}

export async function returnLoan(
  db: PrismaClient,
  actor: LoanActor,
  loanId: string,
): Promise<ReturnLoanOutcome> {
  return await db.$transaction(
    async (tx) => {
      const target = await tx.$queryRaw<
        Array<{ id: string; resourceId: string }>
      >`SELECT id, "resourceId" FROM app_private."Loan" WHERE id = ${loanId}::uuid`;
      if (target.length === 0) {
        return { ok: false, reason: "LOAN_NOT_FOUND" } as const;
      }
      await tx.$queryRaw`SELECT id FROM app_private."Resource" WHERE id = ${target[0].resourceId}::uuid FOR UPDATE`;
      await tx.$queryRaw`SELECT id FROM app_private."Loan" WHERE id = ${loanId}::uuid FOR UPDATE`;
      const loan = await tx.loan.findUnique({
        where: { id: loanId },
      });
      if (!loan) {
        return { ok: false, reason: "LOAN_NOT_FOUND" } as const;
      }
      if (!canActorReturnLoan(loan.userId, actor)) {
        return { ok: false, reason: "FORBIDDEN" } as const;
      }
      if (!canReturnLoan(loan.returnedAt)) {
        return { ok: false, reason: "LOAN_ALREADY_RETURNED" } as const;
      }
      const now = new Date();
      const returnedAt = now >= loan.createdAt ? now : loan.createdAt;
      const updated = await tx.loan.update({
        where: { id: loan.id },
        data: { returnedAt },
      });
      await tx.auditEvent.create({
        data: {
          actorId: actor.id,
          action: "loan.returned",
          entityId: loan.id,
        },
      });
      return { ok: true, data: updated } as const;
    },
    { isolationLevel: "ReadCommitted" },
  );
}
