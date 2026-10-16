import { expect, test } from "@playwright/test";

test("portada accesible, navegación y layout sin desbordamiento", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "El campus,",
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
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) || !process.env.CI,
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

test("explicación RAG accesible con imagen real y estado pendiente explícito", async ({
  page,
}) => {
  await page.goto("/#rag");
  const section = page.locator("#rag");
  await expect(section.getByRole("heading", { level: 2 })).toContainText(
    "Respuestas que muestran",
  );
  const image = section.getByRole("img");
  await expect(image).toBeVisible();
  await expect(image).toHaveJSProperty("complete", true);
  expect(
    await image.evaluate((node: HTMLImageElement) => node.naturalWidth),
  ).toBeGreaterThan(0);
  await expect(section).toContainText(
    "todavía están pendientes de implementar",
  );
  await section
    .getByText("Leer el recorrido del diagrama", { exact: true })
    .click();
  await expect(
    section.getByText("Un operador carga un PDF o Excel autorizado.", {
      exact: false,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
