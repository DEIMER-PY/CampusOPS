import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { saasRoutes } from "../src/saas/routes.js";

describe("Endpoints de la API SaaS (Rutas, CMMS y Control de Cuotas)", () => {
  it("el router SaaS define los manejadores esperados", () => {
    assert.equal(typeof saasRoutes, "function");
    const stack = (saasRoutes as any).stack;
    assert.ok(stack.length >= 7, "Debe tener al menos 7 rutas registradas");

    const routes = stack
      .map((layer: any) => ({
        path: layer.route?.path,
        method: Object.keys(layer.route?.methods || {})[0],
      }))
      .filter((r: any) => r.path);

    const hasOrgs = routes.some((r: any) => r.path === "/organizations" && r.method === "get");
    const hasConsent = routes.some((r: any) => r.path === "/consent" && r.method === "post");
    const hasActas = routes.some((r: any) => r.path === "/actas" && r.method === "post");
    const hasCmms = routes.some((r: any) => r.path === "/cmms/evaluate-batch" && r.method === "post");
    const hasQuota = routes.some((r: any) => r.path === "/partners/check-quota" && r.method === "post");

    assert.equal(hasOrgs, true);
    assert.equal(hasConsent, true);
    assert.equal(hasActas, true);
    assert.equal(hasCmms, true);
    assert.equal(hasQuota, true);
  });
});
