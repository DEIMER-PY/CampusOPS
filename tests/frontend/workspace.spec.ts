import { expect, type Page, test } from "@playwright/test";

const incident = {
  id: "fixture-incident-001",
  description:
    "PRUEBA AISLADA: la cámara no transmite imagen en la sala de formación.",
  status: "OPEN",
  aiStatus: "COMPLETE",
  aiError: null,
  createdAt: "2026-10-19T15:00:00Z",
  triage: {
    category: "TECHNICAL",
    priority: "HIGH",
    area: "SOPORTE_TECNICO",
    summary: "PRUEBA: cámara sin imagen",
    explanation: "Resultado ficticio exclusivo de la prueba de presentación.",
    suggestedAction: "Revisar el cableado.",
    model: "fixture-no-real-ai",
    generatedAt: "2026-10-19T15:00:00Z",
    latencyMs: 0,
  },
};
async function setup(
  page: Page,
  { failure = false, role = "ADMIN", rich = false } = {},
) {
  let incidents = [structuredClone(incident)];
  let loans = [
    {
      id: "fixture-loan-001",
      resource: { name: "Equipo de prueba", code: "TEST-001" },
      createdAt: "2026-10-19T14:00:00Z",
      returnedAt: null as string | null,
    },
  ];
  const resources = [
    {
      id: "fixture-resource-001",
      name: "Equipo de prueba",
      code: "TEST-001",
      status: "AVAILABLE",
      loans: [{ id: "fixture-loan-001" }],
    },
    {
      id: "fixture-resource-002",
      name: "Pantalla de prueba",
      code: "TEST-002",
      status: "MAINTENANCE",
      loans: [],
    },
  ];
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname.replace("/api", "");
    const method = route.request().method();
    if (path === "/incidents" && method === "POST") {
      const body = route.request().postDataJSON();
      const created = {
        ...structuredClone(incident),
        id: "fixture-created-002",
        description: body.description,
        aiStatus: "PENDING",
        triage: null as unknown as typeof incident.triage,
      };
      incidents = [created, ...incidents];
      await route.fulfill({ json: { data: created } });
      return;
    }
    if (path.endsWith("/triage")) {
      await route.fulfill({
        status: 503,
        json: { error: { message: "Proveedor de prueba no disponible" } },
      });
      return;
    }
    if (path.endsWith("/return")) {
      loans = loans.map((l) => ({ ...l, returnedAt: "2026-10-19T16:00:00Z" }));
      await route.fulfill({ json: { data: loans[0] } });
      return;
    }
    if (path === "/incidents" && failure) {
      await route.fulfill({
        status: 503,
        json: { error: { message: "Módulo de prueba no disponible" } },
      });
      return;
    }
    const data: Record<string, unknown> = {
      "/spaces": [
        {
          id: "fixture-space-001",
          name: "Sala de prueba",
          capacity: 12,
          status: "AVAILABLE",
        },
      ],
      "/reservations": [],
      "/resources": resources,
      "/loans": loans,
      "/incidents": incidents,
      "/admin/audit": rich
        ? [
            {
              id: "event-prueba-1",
              action: "loan.returned",
              entityId: "fixture-resource-001",
              createdAt: "2026-10-19T16:00:00Z",
            },
            {
              id: "event-prueba-2",
              action: "incident.created",
              entityId: "fixture-incident-001",
              createdAt: "2026-10-19T15:00:00Z",
            },
            {
              id: "event-prueba-3",
              action: "reservation.created",
              entityId: "fixture-reservation-001",
              createdAt: "2026-10-18T14:00:00Z",
            },
          ]
        : [],
      "/agenda/status": { configured: false, executionEnabled: false },
      "/schedule": rich
        ? {
            id: "board-prueba",
            title: "PRUEBA: plantilla aislada",
            revision: 1,
            updatedAt: "2026-10-19T15:00:00Z",
            applicableDate: null,
            rooms: ["Sala de prueba"],
            spaces: [],
            entries: [
              {
                id: "entry-prueba-1",
                category: "ENGLISH",
                room: "Sala de prueba",
                spaceId: "fixture-space-001",
                startMinute: 420,
                endMinute: 480,
                label: "GRUPO DE PRUEBA",
                attendees: 12,
                course: "A1",
                instructor: "Instructor de prueba",
                status: "PENDING",
                timeConfidence: "CONFIRMED",
                metadata: {},
                issues: [],
              },
              {
                id: "entry-prueba-2",
                category: "SER",
                room: "Sala de prueba",
                spaceId: null,
                startMinute: 480,
                endMinute: 540,
                label: "TALLER DE PRUEBA",
                attendees: null,
                course: null,
                instructor: null,
                status: "CANCELLED",
                timeConfidence: "UNCONFIRMED",
                metadata: {},
                issues: ["Dato de prueba por confirmar"],
              },
            ],
          }
        : null,
    };
    await route.fulfill({
      json: { data: Object.hasOwn(data, path) ? data[path] : [] },
    });
  });
  await page.goto(`/?role=${role}`);
  await expect(
    page.getByRole("heading", { name: "Resumen operativo", exact: true }),
  ).toBeVisible();
  if (!failure)
    await expect(
      page.getByText("Última actualización completa:", { exact: false }),
    ).toBeVisible();
}
async function navigate(page: Page, label: string) {
  const menu = page.getByRole("button", { name: "Abrir menú de módulos" });
  if (await menu.isVisible()) await menu.click();
  await page
    .getByRole("navigation", { name: "Módulos", exact: true })
    .getByRole("button", { name: label, exact: true })
    .click();
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}

test("resumen real de fixtures, navegación y retorno del foco en incidencias", async ({
  page,
}, testInfo) => {
  await setup(page);
  if (process.env.FRONTEND_SCREENSHOTS)
    await page.screenshot({
      path: `docs/assets/screenshots/redesign-fixture-${testInfo.project.name}-summary.webp`,
      fullPage: true,
      animations: "disabled",
    });
  await expect(
    page.getByText("PRUEBA: cámara sin imagen", { exact: true }),
  ).toBeVisible();
  await navigate(page, "Incidencias e IA");
  const row = page
    .getByRole("button")
    .filter({ hasText: "PRUEBA: cámara sin imagen" });
  await row.click();
  await expect(
    page.getByRole("article", { name: "Detalle de incidencia" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "PRUEBA: cámara sin imagen" }),
  ).toBeVisible();
  if (process.env.FRONTEND_SCREENSHOTS)
    await page.screenshot({
      path: `docs/assets/screenshots/redesign-fixture-${testInfo.project.name}-incident.webp`,
      fullPage: true,
      animations: "disabled",
    });
  await page.getByRole("button", { name: "Volver a la lista" }).click();
  await expect(row).toBeFocused();
  await noOverflow(page);
});
test("búsqueda, filtros y vacíos no confunden un error con cero", async ({
  page,
}) => {
  await setup(page);
  await navigate(page, "Incidencias e IA");
  await page.getByRole("button", { name: /Resueltas/ }).click();
  await expect(
    page.getByText("No hay reportes con estos filtros.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Todas/ }).click();
  await page
    .getByRole("textbox", { name: "Buscar incidencias" })
    .fill("inexistente");
  await expect(
    page.getByText("No hay reportes con estos filtros.", { exact: false }),
  ).toBeVisible();
});
test("fallo parcial mantiene los demás módulos y muestra dato ausente", async ({
  page,
}) => {
  await setup(page, { failure: true });
  await expect(page.getByRole("alert")).toContainText("incidencias");
  await expect(
    page.getByText("Préstamos activos", { exact: true }),
  ).toBeVisible();
  const workload = page.locator(".summary-workload");
  await expect(workload).toContainText("—");
  await navigate(page, "Incidencias e IA");
  await expect(
    page.getByText("No se pudieron actualizar los reportes.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("Todavía no hay reportes.", { exact: false }),
  ).toHaveCount(0);
});
test("inventario distingue estado y préstamo, filtra y devuelve con contrato existente", async ({
  page,
}) => {
  await setup(page);
  await navigate(page, "Recursos y préstamos");
  await expect(
    page.getByRole("button", { name: "En préstamo", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByText("En mantenimiento: no se puede prestar."),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Filtrar recursos o préstamos" })
    .selectOption("MAINTENANCE");
  await expect(
    page.getByRole("heading", { name: "Equipo de prueba", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Préstamos", exact: true }).click();
  await page.getByRole("button", { name: "Registrar devolución" }).click();
  await expect(page.getByText("Devuelto", { exact: true })).toBeVisible();
  await noOverflow(page);
});
test("crear reporte conserva el guardado cuando falla el análisis", async ({
  page,
}) => {
  await setup(page);
  await navigate(page, "Incidencias e IA");
  await page
    .getByRole("button", { name: "Nueva incidencia", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "¿Qué está pasando?" })
    .fill("PRUEBA AISLADA: pantalla sin señal en el equipo TEST-002.");
  await page.getByRole("button", { name: "Reportar y analizar" }).click();
  await expect(
    page.getByRole("article", { name: "Detalle de incidencia" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "PRUEBA AISLADA: pantalla sin señal en el equipo TEST-002.",
    }),
  ).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("Proveedor de prueba");
});
test("CLIENT conserva lectura y solicitudes sin controles operativos", async ({
  page,
}) => {
  await setup(page, { role: "CLIENT" });
  await navigate(page, "Recursos y préstamos");
  await expect(
    page.getByLabel("Estado de recurso Equipo de prueba"),
  ).toHaveCount(0);
  await expect(
    page.getByText("Registrar un recurso", { exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Préstamos", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Registrar devolución" }),
  ).toHaveCount(0);
  const menu = page.getByRole("button", { name: "Abrir menú de módulos" });
  if (await menu.isVisible()) await menu.click();
  await expect(
    page.getByRole("button", { name: "Auditoría", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Asistente de agenda", exact: true }),
  ).toHaveCount(0);
});
test("todos los módulos conservan layout y acciones en cinco anchuras", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "desktop",
    "La matriz ya incluye tamaños móviles explícitos",
  );
  await setup(page, { rich: true });
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 960 });
    for (const module of [
      "Resumen",
      "Recursos y préstamos",
      "Incidencias e IA",
      "Reservas",
      "Horarios de formación",
      "Espacios",
      "Planos e integraciones",
      "Asistente de agenda",
      "Auditoría",
    ]) {
      await navigate(page, module);
      await noOverflow(page);
    }
  }
});
test("menú móvil cierra con Escape y restaura foco", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Solo menú plegable");
  await setup(page);
  const toggle = page.getByRole("button", { name: "Abrir menú de módulos" });
  await toggle.click();
  const nav = page.getByRole("navigation", { name: "Módulos", exact: true });
  await nav.getByRole("button", { name: "Resumen", exact: true }).focus();
  await page.keyboard.press("Escape");
  await expect(toggle).toBeFocused();
  await expect(nav).toBeHidden();
});

test("OPERATOR accede a operación y no a auditoría", async ({ page }) => {
  await setup(page, { role: "OPERATOR" });
  await navigate(page, "Recursos y préstamos");
  await expect(
    page.getByLabel("Estado de recurso Equipo de prueba"),
  ).toBeVisible();
  await navigate(page, "Asistente de agenda");
  await expect(
    page.getByRole("radio", { name: "Aplicar", exact: false }),
  ).toBeDisabled();
  const menu = page.getByRole("button", { name: "Abrir menú de módulos" });
  if (await menu.isVisible()) await menu.click();
  await expect(
    page.getByRole("button", { name: "Auditoría", exact: true }),
  ).toHaveCount(0);
});
test("reflujo del dashboard a 200% de zoom CSS", async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== "desktop",
    "La comprobación de reflujo usa escritorio",
  );
  await setup(page);
  await page.evaluate(() => {
    document.body.style.zoom = "2";
  });
  await navigate(page, "Incidencias e IA");
  await noOverflow(page);
});

test("resumen: inventario alterna vistas y filtra sin inventar registros", async ({
  page,
}) => {
  await setup(page);
  const search = page.getByRole("searchbox", {
    name: "Buscar en el resumen de recursos",
  });
  await search.fill("TEST-002");
  const catalog = page.locator(".console-catalog");
  await expect(catalog).toContainText("Pantalla de prueba");
  await expect(catalog).not.toContainText("Equipo de prueba");
  await page
    .getByRole("button", { name: "Ver recursos como tarjetas" })
    .click();
  await expect(catalog).toHaveClass(/is-grid/);
  await search.fill("inexistente");
  await expect(
    page.getByText("No hay recursos con esta búsqueda."),
  ).toBeVisible();
  await search.fill("");
  await expect(page.locator(".console-resource")).toHaveCount(2);
  await noOverflow(page);
});

test("buscador de módulos respeta permisos y limpia al navegar", async ({
  page,
}) => {
  await setup(page, { role: "CLIENT" });
  const toggle = page.getByRole("button", { name: "Abrir menú de módulos" });
  if (await toggle.isVisible()) await toggle.click();
  const search = page.getByRole("searchbox", { name: "Buscar módulo" });
  await search.fill("Auditoría");
  await expect(page.getByRole("status")).toContainText("No hay módulos");
  await search.fill("Recursos");
  const nav = page.getByRole("navigation", { name: "Módulos", exact: true });
  await expect(nav.getByRole("button")).toHaveCount(1);
  await nav.getByRole("button", { name: "Recursos y préstamos" }).click();
  if (await toggle.isVisible()) await toggle.click();
  await expect(search).toHaveValue("");
  await expect(
    nav.getByRole("button", { name: "Resumen", exact: true }),
  ).toBeVisible();
});

test("plano: vinculación manual accesible, persistencia local y acercamiento", async ({
  page,
}, testInfo) => {
  await setup(page);
  await navigate(page, "Planos e integraciones");
  await page.getByRole("button", { name: /Sala de prueba/ }).click();
  await page
    .getByRole("button", { name: "Vincular posición en el plano" })
    .click();
  const marker = page.getByRole("button", {
    name: /Marcar posición de Sala de prueba/,
  });
  await marker.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("ArrowUp");
  await page
    .getByRole("button", { name: "Guardar posición", exact: true })
    .click();
  await expect(
    page.locator(".plan-room-selection").getByRole("status"),
  ).toContainText("Posición vinculada en este navegador");
  await expect(page.locator(".plan-selection-marker")).toBeVisible();
  await expect(page.locator(".plan-camera")).toHaveAttribute(
    "style",
    /scale\(1.8\)/,
  );
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("campusflow-plan-links-v1") || "{}"),
  );
  expect(saved["fixture-space-001"]).toEqual({ x: 1115, y: 790 });
  await page.getByRole("button", { name: "Ajustar plano a la vista" }).click();
  await expect(page.locator(".plan-camera")).toHaveAttribute("style", /none/);
  await page.reload();
  await navigate(page, "Planos e integraciones");
  await page.getByRole("button", { name: /Sala de prueba/ }).click();
  await expect(page.locator(".plan-selection-marker")).toBeVisible();
  if (process.env.FRONTEND_SCREENSHOTS)
    await page.screenshot({
      path: `docs/assets/screenshots/feedback-fixture-${testInfo.project.name}-plan.webp`,
      fullPage: true,
      animations: "disabled",
    });
  await page.getByRole("button", { name: "Quitar marcador local" }).click();
  await expect(page.locator(".plan-selection-marker")).toHaveCount(0);
  await noOverflow(page);
});

test("auditoría: eventos por día, filtro y ficha legible", async ({
  page,
}, testInfo) => {
  await setup(page, { rich: true });
  await navigate(page, "Auditoría");
  await expect(page.locator(".journal-day")).toHaveCount(2);
  await page.getByRole("button", { name: /Recurso devuelto/ }).click();
  await expect(
    page.getByRole("complementary", { name: "Detalle del evento" }),
  ).toContainText("fixture-resource-001");
  if (process.env.FRONTEND_SCREENSHOTS)
    await page.screenshot({
      path: `docs/assets/screenshots/feedback-fixture-${testInfo.project.name}-audit.webp`,
      fullPage: true,
      animations: "disabled",
    });
  await page
    .getByRole("combobox", { name: "Filtrar eventos por módulo" })
    .selectOption("reservation");
  await expect(page.locator(".journal-day")).toHaveCount(1);
  await expect(page.locator(".journal-day")).toContainText(
    "Reserva confirmada",
  );
  await page
    .getByRole("textbox", { name: "Buscar en el historial" })
    .fill("inexistente");
  await expect(
    page.getByRole("heading", { name: "Sin coincidencias" }),
  ).toBeVisible();
  await noOverflow(page);
});

test("horario: calendario por sala sin scroll dentro de los bloques", async ({
  page,
}, testInfo) => {
  await setup(page, { rich: true });
  await navigate(page, "Horarios de formación");
  await expect(
    page.getByText("plantilla sin fecha de aplicación", { exact: false }),
  ).toBeVisible();
  const entry = page.getByRole("button", {
    name: /GRUPO DE PRUEBA, Sala de prueba/,
  });
  await expect(entry).toBeVisible();
  await expect(entry).toHaveCSS("overflow", "hidden");
  if (process.env.FRONTEND_SCREENSHOTS)
    await page.screenshot({
      path: `docs/assets/screenshots/feedback-fixture-${testInfo.project.name}-calendar.webp`,
      fullPage: true,
      animations: "disabled",
    });
  await entry.click();
  await expect(
    page.getByRole("textbox", { name: "Grupo", exact: true }),
  ).toHaveValue("GRUPO DE PRUEBA");
  await page.getByRole("button", { name: /Inglés/ }).click();
  await expect(page.locator(".schedule-block")).toHaveCount(1);
  await page.getByRole("button", { name: "Ver lista" }).click();
  await expect(page.locator(".schedule-list")).toContainText("GRUPO DE PRUEBA");
  await noOverflow(page);
});

test("asistente: tareas comprensibles y datos opcionales desplegables", async ({
  page,
}, testInfo) => {
  await setup(page);
  await navigate(page, "Asistente de agenda");
  await page.getByRole("button", { name: /Reservar una sala/ }).click();
  await expect(
    page.getByRole("textbox", { name: "Describe tu solicitud" }),
  ).toHaveValue(/Necesito Apolo/);
  const date = page.getByLabel("Fecha", { exact: true });
  await expect(date).toBeHidden();
  await page
    .getByText("Precisar fecha, sala y asistentes", { exact: false })
    .click();
  await expect(date).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Pedir propuesta" }),
  ).toBeDisabled();
  await expect(
    page.getByText("Asistente pendiente de configurar", { exact: false }),
  ).toBeVisible();
  if (process.env.FRONTEND_SCREENSHOTS)
    await page.screenshot({
      path: `docs/assets/screenshots/feedback-fixture-${testInfo.project.name}-agenda.webp`,
      fullPage: true,
      animations: "disabled",
    });
  await noOverflow(page);
});

test("agenda envía el contrato, distingue propuesta/aplicación y conserva errores", async ({
  page,
}) => {
  await setup(page);
  let enabled = false;
  let fail = false;
  let applied = false;
  const bodies: Record<string, unknown>[] = [];
  await page.route("**/api/agenda/status", (route) =>
    route.fulfill({
      json: { data: { configured: true, executionEnabled: enabled } },
    }),
  );
  await page.route("**/api/agenda/assistant", async (route) => {
    const body = route.request().postDataJSON();
    bodies.push(body);
    if (fail) {
      await route.fulfill({
        status: 503,
        json: {
          error: {
            message:
              "PRUEBA: resultado no confirmado; revisa auditoría antes de repetir.",
          },
        },
      });
      return;
    }
    applied = body.modo === "EJECUCION";
    await route.fulfill({
      json: {
        data: {
          execution: applied ? "APPLIED" : "NOT_APPLIED",
          requestId: "prueba-solicitud",
          receivedAt: "2026-10-19T16:00:00Z",
          warnings: [],
          proposal: {
            decisionIA: {
              titulo: applied
                ? "PRUEBA: cambio aplicado"
                : "PRUEBA: propuesta recibida",
              explicacion: "Respuesta aislada, sin operación real.",
              tipoAlerta: "SUCCESS",
              accionEjecutada: "RESERVA_CREADA",
            },
            interpretacionIA: { intencion: "RESERVA", modelo: "fixture" },
            salas: [],
            incidenciaDetectada: {
              existe: false,
              descripcion: null,
              prioridad: "NONE",
              areaResponsable: null,
            },
          },
        },
      },
    });
  });
  await navigate(page, "Asistente de agenda");
  await page
    .getByRole("textbox", { name: "Describe tu solicitud" })
    .fill("Reserva Sala de prueba mañana de 10 a 11 para 5 personas");
  await page.getByRole("button", { name: "Pedir propuesta" }).click();
  await expect(
    page.getByText("PRUEBA: propuesta recibida", { exact: true }),
  ).toBeVisible();
  expect(bodies[0]).toMatchObject({ modo: "PROPUESTA", rol: "ADMINISTRATIVO" });
  expect(bodies[0]).not.toHaveProperty("usuario");
  await expect(
    page.getByText("Solo propuesta: no se aplicó ningún cambio"),
  ).toBeVisible();
  await expect(page.getByRole("radio", { name: /Aplicar/ })).toBeDisabled();
  enabled = true;
  await page.getByRole("button", { name: "Revisar configuración" }).click();
  const apply = page.getByRole("radio", { name: /Aplicar/ });
  await expect(apply).toBeEnabled();
  await apply.check();
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("button", { name: "Analizar y aplicar" }).click();
  expect(bodies).toHaveLength(1);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Analizar y aplicar" }).click();
  await expect(
    page.getByText("PRUEBA: cambio aplicado", { exact: true }),
  ).toBeVisible();
  expect(bodies[1].modo).toBe("EJECUCION");
  fail = true;
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Analizar y aplicar" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "resultado no confirmado",
  );
  await expect(
    page.getByText("PRUEBA: cambio aplicado", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("textbox", { name: "Describe tu solicitud" }),
  ).toHaveValue(/Reserva Sala/);
  await noOverflow(page);
});
