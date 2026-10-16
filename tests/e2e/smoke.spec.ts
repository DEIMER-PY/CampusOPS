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
  const health = await request.get(
    `${process.env.E2E_API_URL || "http://127.0.0.1:4000"}/health`,
  );
  expect(health.ok()).toBe(true);
  const response = await request.get(
    `${process.env.E2E_API_URL || "http://127.0.0.1:4000"}/api/admin/audit`,
  );
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

test("login: robot cargado, campos accesibles y registro sin elevar permisos", async ({
  page,
}) => {
  await page.goto("/login");
  const robot = page.getByRole("img", {
    name: "Robot astronauta con una sonrisa azul, referencia de Campuslands",
  });
  await expect(robot).toBeVisible();
  await expect(robot).toHaveJSProperty("complete", true);
  expect(
    await robot.evaluate((node: HTMLImageElement) => node.naturalWidth),
  ).toBeGreaterThan(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const email = page.getByLabel("Correo electrónico", { exact: true });
  const password = page.getByLabel("Contraseña", { exact: true });
  await expect(email).toHaveAttribute("type", "email");
  await expect(password).toHaveAttribute("type", "password");
  if (await email.isEnabled()) {
    await page
      .getByRole("button", { name: "Crear cuenta", exact: true })
      .click();
    await expect(password).toHaveAttribute("minlength", "12");
    await expect(password).toHaveAttribute("autocomplete", "new-password");
    await expect(
      page.getByText("Tu perfil inicial es de comunidad.", { exact: false }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Iniciar sesión", exact: true })
      .click();
    await expect(password).toHaveAttribute("autocomplete", "current-password");
  }
});

test("portal sin sesión exige autenticación", async ({ page }) => {
  await page.goto("/portal");
  await expect(page).toHaveURL(/\/login/);
  await expect(
    page.getByRole("heading", { name: "Qué bueno verte." }),
  ).toBeVisible();
});
