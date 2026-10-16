import { expect, test } from "@playwright/test";

test("portada accesible, navegación y layout sin desbordamiento", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Menos cruces.",
  );
  await expect(
    page.getByRole("link", { name: "Ingresar", exact: false }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Ingresar", exact: false }).click();
  await expect(
    page.getByRole("heading", { name: "Qué bueno verte." }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("sin configuración el acceso se muestra pendiente sin aceptar credenciales", async ({
  page,
}) => {
  test.skip(
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    "Smoke del estado sin servicios externos",
  );
  await page.goto("/login");
  await expect(page.getByRole("status")).toContainText("pendiente");
  await expect(
    page.getByRole("button", { name: "Ingresar a mi cuenta" }),
  ).toBeDisabled();
});
test("API viva y rutas protegidas sin sesión", async ({ request }) => {
  const health = await request.get("http://127.0.0.1:4000/health");
  expect(health.ok()).toBe(true);
  const response = await request.get("http://127.0.0.1:4000/api/admin/audit");
  expect([401, 503]).toContain(response.status());
  expect((await response.json()).data).toBeUndefined();
});
