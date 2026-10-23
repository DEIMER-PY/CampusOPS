import { z } from "zod";

export const OrganizationTypeSchema = z.enum([
  "CAMPUS_HEADQUARTERS",
  "CAMPUS_BRANCH",
  "PARTNER_COMPANY",
  "EDUCATIONAL_ALLIANCE",
]);

export const RoleHierarchy: Record<string, number> = {
  CLIENT: 10,
  CAMPER: 10,
  TRAINER: 30,
  OPERATOR: 50,
  IT_OPERATOR: 50,
  PARTNER_REPRESENTATIVE: 40,
  ACADEMIC_COORDINATOR: 60,
  CAMPUS_DIRECTOR: 80,
  ADMIN: 90,
  SUPER_ADMIN: 100,
};

export function hasMinimumRole(actualRole: string, requiredRole: string): boolean {
  const actualRank = RoleHierarchy[actualRole] ?? 0;
  const requiredRank = RoleHierarchy[requiredRole] ?? 999;
  return actualRank >= requiredRank;
}

export const createOrganizationSchema = z.strictObject({
  code: z
    .string()
    .trim()
    .min(3)
    .max(50)
    .regex(/^[A-Z0-9_-]+$/, "El código debe ser alfanumérico en mayúsculas"),
  name: z.string().trim().min(3).max(150),
  type: OrganizationTypeSchema.default("CAMPUS_BRANCH"),
  taxId: z.string().trim().min(5).max(30).optional(),
  billingPlan: z.enum(["FREE_TRIAL", "ENTERPRISE_INTERNAL", "PARTNER_PRO", "CAMPUS_CUSTOM"]).default("ENTERPRISE_INTERNAL"),
  quotaHours: z.number().int().nonnegative().default(40),
});

export const createBranchSchema = z.strictObject({
  organizationId: z.uuid(),
  name: z.string().trim().min(3).max(150),
  city: z.string().trim().min(2).max(100),
  address: z.string().trim().min(5).max(250),
  timezone: z.string().trim().default("America/Bogota"),
});

export const assignMembershipSchema = z.strictObject({
  userId: z.uuid(),
  organizationId: z.uuid(),
  department: z.enum(["ACADEMIC", "WELLNESS", "OPERATIONS", "PARTNER_RELATIONS", "IT_SUPPORT"]).optional(),
  role: z.enum([
    "CLIENT",
    "OPERATOR",
    "ADMIN",
    "SUPER_ADMIN",
    "CAMPUS_DIRECTOR",
    "ACADEMIC_COORDINATOR",
    "TRAINER",
    "CAMPER",
    "PARTNER_REPRESENTATIVE",
    "IT_OPERATOR",
  ]),
});

export type TenantContext = {
  actorId: string;
  role: string;
  organizationId?: string;
  isSuperAdmin: boolean;
};

export function buildTenantFilter(context: TenantContext) {
  if (context.isSuperAdmin) {
    return context.organizationId ? { organizationId: context.organizationId } : {};
  }
  if (!context.organizationId) {
    throw new Error("TENANT_CONTEXT_REQUIRED");
  }
  return { organizationId: context.organizationId };
}
