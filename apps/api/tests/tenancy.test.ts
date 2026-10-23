import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  hasMinimumRole,
  buildTenantFilter,
  createOrganizationSchema,
  createBranchSchema,
} from "../src/domain/tenancy.js";

describe("SaaS Multi-Tenancy & Role Hierarchy", () => {
  it("valida jerarquía de roles correctamente", () => {
    assert.equal(hasMinimumRole("SUPER_ADMIN", "ADMIN"), true);
    assert.equal(hasMinimumRole("ADMIN", "CAMPUS_DIRECTOR"), true);
    assert.equal(hasMinimumRole("CAMPUS_DIRECTOR", "ACADEMIC_COORDINATOR"), true);
    assert.equal(hasMinimumRole("ACADEMIC_COORDINATOR", "TRAINER"), true);
    assert.equal(hasMinimumRole("TRAINER", "CAMPER"), true);
    assert.equal(hasMinimumRole("CAMPER", "ADMIN"), false);
    assert.equal(hasMinimumRole("PARTNER_REPRESENTATIVE", "CAMPUS_DIRECTOR"), false);
  });

  it("filtro multi-tenant aísla datos de organizaciones", () => {
    const orgId = randomUUID();
    const camperContext = {
      actorId: randomUUID(),
      role: "CAMPER",
      organizationId: orgId,
      isSuperAdmin: false,
    };
    assert.deepEqual(buildTenantFilter(camperContext), { organizationId: orgId });

    assert.throws(
      () =>
        buildTenantFilter({
          actorId: randomUUID(),
          role: "CAMPER",
          isSuperAdmin: false,
        }),
      /TENANT_CONTEXT_REQUIRED/
    );

    const superAdminContext = {
      actorId: randomUUID(),
      role: "SUPER_ADMIN",
      isSuperAdmin: true,
    };
    assert.deepEqual(buildTenantFilter(superAdminContext), {});
  });

  it("valida esquema de creación de organizaciones y sedes", () => {
    const validOrg = createOrganizationSchema.parse({
      code: "CAMPUS_BUCARAMANGA_ZF",
      name: "Campuslands Bucaramanga - Zona Franca",
      type: "CAMPUS_BRANCH",
      taxId: "901234567-1",
      quotaHours: 60,
    });
    assert.equal(validOrg.code, "CAMPUS_BUCARAMANGA_ZF");

    assert.throws(() =>
      createOrganizationSchema.parse({
        code: "invalid code with spaces",
        name: "Campus",
      })
    );

    const validBranch = createBranchSchema.parse({
      organizationId: randomUUID(),
      name: "Edificio Innovación Nivel 3",
      city: "Bucaramanga",
      address: "Anillo Vial Km 2.5",
    });
    assert.equal(validBranch.city, "Bucaramanga");
  });
});
