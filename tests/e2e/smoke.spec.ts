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
    page.getByRole("link", { name: "Ingresar", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Ingresar", exact: true }).click();
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

test("arquitectura RAG nativa: selección, reproducción, pausa y estado pendiente", async ({
  page,
}) => {
  await page.goto("/#rag");
  const section = page.locator("#rag");
  await expect(section.getByRole("heading", { level: 2 })).toContainText(
    "Respuestas",
  );
  const source = section.getByRole("button", { name: /Fuentes autorizadas/ });
  await expect(source).toHaveAttribute("aria-pressed", "true");
  const citations = section.getByRole("button", {
    name: /Respuesta con citas/,
  });
  await citations.click();
  await expect(citations).toHaveAttribute("aria-pressed", "true");
  await expect(section.locator("#rag-step-description")).toContainText(
    "página, hoja o fila",
  );
  const play = section.getByRole("button", {
    name: "Reproducir recorrido RAG",
  });
  await play.click();
  await expect(source).toHaveAttribute("aria-pressed", "true");
  await expect(
    section.getByRole("button", { name: /Fragmentos con origen/ }),
  ).toHaveAttribute("aria-pressed", "true", { timeout: 6000 });
  await section.getByRole("button", { name: "Pausar recorrido RAG" }).click();
  await expect(play).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(play).toBeDisabled();
  await source.click();
  await expect(source).toHaveAttribute("aria-pressed", "true");
  await expect(
    section.getByRole("link", { name: /Consultar el diagrama estático/ }),
  ).toHaveAttribute("href", "/images/rag-campusflow.webp");
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
    name: "Robot astronauta CampusFlow de cuerpo completo, ilustración con IA",
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

test("galería del campus cambia fotografías editadas y conserva lectura accesible", async ({
  page,
}) => {
  await page.goto("/#espacios");
  const gallery = page.locator(".campus-gallery");
  await expect(gallery).toContainText("edición con IA");
  await expect(gallery.getByRole("heading")).toHaveText(
    "Lugar para encontrarse.",
  );
  await gallery.getByRole("button", { name: "Ver siguiente espacio" }).click();
  await expect(gallery.getByRole("heading")).toHaveText("Ideas sobre la mesa.");
  const selected = gallery.locator('.campus-photo-card[data-active="true"]');
  await expect(selected.getByRole("img")).toHaveJSProperty("complete", true);
  await expect(selected.getByRole("img")).toHaveAttribute(
    "src",
    /sala-colaborativa-editada/,
  );
  await selected.focus();
  await page.keyboard.press("Home");
  await expect(gallery.getByRole("heading")).toHaveText(
    "Espacio para concentrarse.",
  );
  await expect(gallery.locator(".robot-full img")).toHaveJSProperty(
    "complete",
    true,
  );
});

test("robot responde al puntero y respeta movimiento reducido", async ({
  page,
}, testInfo) => {
  await page.goto("/login");
  const art = page.locator(".robot-artwork");
  if (testInfo.project.name === "desktop") {
    let x = 60;
    await expect
      .poll(async () => {
        x += 15;
        await page.mouse.move(x, 100);
        return (await art.getAttribute("style")) || "";
      })
      .toMatch(/perspective/);
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.mouse.move(300, 300);
  await expect(art).not.toHaveAttribute("style", /perspective/);
  await expect(art).toHaveCSS("transform", "none");
});

test("portada y acceso sin desbordamiento en cinco anchuras", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "desktop",
    "La matriz contiene móvil y tablet explícitos",
  );
  for (const path of ["/", "/login"]) {
    await page.goto(path);
    for (const width of [360, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 960 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
    }
  }
});

test("la portada conserva contenido sin JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto(baseURL || "http://127.0.0.1:3000/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "La última palabra es humana." }),
    ).toBeVisible();
    await expect(page.locator(".campus-hero-photo img")).toBeVisible();
  } finally {
    await context.close();
  }
});

test("portada: explorador de fotos, decisión humana y footer navegables", async ({
  page,
}) => {
  await page.goto("/");
  const hero = page.locator(".hero-explorer");
  await hero.getByRole("button", { name: "Encuentro", exact: true }).click();
  await expect(hero.getByRole("img")).toHaveAttribute(
    "src",
    /zona-reunion-editada/,
  );
  await expect(
    hero.getByRole("link", { name: /El equipo empieza aquí/ }),
  ).toHaveAttribute("href", "#espacios");
  const decision = page.locator(".campus-decision");
  await decision
    .getByRole("button", { name: "Propuesta IA", exact: true })
    .click();
  await expect(
    decision.getByRole("heading", { name: "La IA orienta la atención." }),
  ).toBeVisible();
  await decision
    .getByRole("button", { name: "Revisión humana", exact: true })
    .click();
  await expect(
    decision.getByRole("heading", {
      name: "El equipo decide el siguiente paso.",
    }),
  ).toBeVisible();
  const footer = page.getByRole("contentinfo");
  await expect(
    footer.getByRole("navigation", { name: "Explorar CampusFlow" }),
  ).toBeVisible();
  await expect(
    footer.getByRole("link", { name: "Arquitectura RAG" }),
  ).toHaveAttribute("href", "#rag");
});
