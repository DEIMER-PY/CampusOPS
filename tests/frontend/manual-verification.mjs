import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const ARTIFACT_DIR =
  "/home/Papi_Leo/.gemini/antigravity/brain/59684870-a897-4fd6-910f-96f7cf88362b";
const SCREENSHOT_DIR = resolve(ARTIFACT_DIR, "screenshots");

await mkdir(SCREENSHOT_DIR, { recursive: true });

const TEST_PORT = 3456;
console.log(
  `Iniciando servidor de presentación de pruebas en puerto ${TEST_PORT}...`,
);
const serverProcess = spawn("node", ["tests/frontend/fixture-server.mjs"], {
  stdio: ["ignore", "pipe", "pipe"],
  env: { ...process.env, PORT: String(TEST_PORT) },
});

const serverUrl = `http://127.0.0.1:${TEST_PORT}`;

await new Promise((resolvePromise, reject) => {
  serverProcess.stdout.on("data", (data) => {
    const text = data.toString();
    console.log("[SERVER]", text.trim());
    if (text.includes(String(TEST_PORT))) {
      resolvePromise();
    }
  });
  serverProcess.stderr.on("data", (data) => {
    console.error("[SERVER ERR]", data.toString());
  });
  serverProcess.on("error", reject);
  setTimeout(() => resolvePromise(), 3000);
});

console.log(
  `Servidor listo en ${serverUrl}. Lanzando Google Chrome for Testing...`,
);

const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
    "/home/Papi_Leo/.local/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

const CHANNELS = [
  {
    id: "chan-001",
    slug: "avisos-generales",
    name: "Avisos Generales",
    description:
      "Canal oficial de difusión de Campuslands. Solo administradores pueden emitir avisos aquí.",
    isBroadcastOnly: true,
  },
  {
    id: "chan-002",
    slug: "formacion",
    name: "Formación & Aulas",
    description: "Coordinación académica, docentes y distribución de aulas.",
    isBroadcastOnly: false,
  },
  {
    id: "chan-003",
    slug: "soporte-tecnico",
    name: "Soporte Técnico",
    description:
      "Incidencias de hardware, conectividad y mantenimiento en vivo.",
    isBroadcastOnly: false,
  },
  {
    id: "chan-004",
    slug: "co-working",
    name: "Co-working & Estudio",
    description: "Gestión de puestos individuales y zonas de trabajo libre.",
    isBroadcastOnly: false,
  },
  {
    id: "chan-005",
    slug: "full-service",
    name: "Full Service & Logística",
    description: "Recepción, logística de eventos, cafetería y suministros.",
    isBroadcastOnly: false,
  },
  {
    id: "chan-006",
    slug: "marketing-alianzas",
    name: "Marketing & Alianzas",
    description: "Visitas empresariales, convenios y reservas comerciales.",
    isBroadcastOnly: false,
  },
  {
    id: "chan-007",
    slug: "clonai",
    name: "ClonAI & Innovación",
    description:
      "Proyectos de inteligencia artificial y laboratorios experimentales.",
    isBroadcastOnly: false,
  },
];

const MEMBERS = [
  {
    id: "mem-001",
    name: "Prof. Leonardo",
    email: "leonardo@campuslands.com",
    role: "ADMIN",
  },
  {
    id: "mem-002",
    name: "Ing. Carlos Gómez",
    email: "carlos.formacion@campuslands.com",
    role: "FORMACION",
  },
  {
    id: "mem-003",
    name: "Sofía Martínez",
    email: "sofia.soporte@campuslands.com",
    role: "SOPORTE",
  },
  {
    id: "mem-004",
    name: "Andrés Cowork",
    email: "andres.cw@campuslands.com",
    role: "COWORKING",
  },
  {
    id: "mem-005",
    name: "Diana FullService",
    email: "diana.fs@campuslands.com",
    role: "FULL_SERVICE",
  },
  {
    id: "mem-006",
    name: "Mateo Marketing",
    email: "mateo.mkt@campuslands.com",
    role: "MARKETING",
  },
  {
    id: "mem-007",
    name: "Valentina ClonAI",
    email: "val.clonai@campuslands.com",
    role: "CLONAI",
  },
];

const MESSAGES_CATALOG = {
  "avisos-generales": [
    {
      id: "msg-001",
      authorId: "mem-001",
      authorName: "Prof. Leonardo",
      authorRole: "ADMIN",
      content:
        "Aviso Oficial: Apertura de jornada de innovación en @espacio:Auditorio a las 10:00 AM.",
      priority: "URGENT",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "msg-002",
      authorId: "mem-001",
      authorName: "Prof. Leonardo",
      authorRole: "ADMIN",
      content:
        "Recordatorio a todas las áreas: mantener registro de @equipo:EQ-PRJ-01 al finalizar turnos.",
      priority: "NORMAL",
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
  ],
  formacion: [
    {
      id: "msg-003",
      authorId: "mem-002",
      authorName: "Ing. Carlos Gómez",
      authorRole: "FORMACION",
      content:
        "Coordinación académica: @espacio:Apolo asignado a grupo intensivo. Verificado @equipo:EQ-LAP-03.",
      priority: "NORMAL",
      createdAt: new Date(Date.now() - 1200000).toISOString(),
    },
  ],
  "soporte-tecnico": [
    {
      id: "msg-004",
      authorId: "mem-003",
      authorName: "Sofía Martínez",
      authorRole: "SOPORTE",
      content:
        "URGENTE: Mantenimiento correctivo en red inalámbrica de @espacio:Cosmos en curso.",
      priority: "URGENT",
      createdAt: new Date(Date.now() - 600000).toISOString(),
    },
  ],
};

const SPACES = [
  { id: "sp-001", name: "Auditorio", capacity: 100, status: "AVAILABLE" },
  { id: "sp-002", name: "Apolo", capacity: 34, status: "AVAILABLE" },
  { id: "sp-003", name: "Cosmos", capacity: 25, status: "OCCUPIED" },
];

const RESOURCES = [
  {
    id: "res-001",
    name: "Proyector Láser Sony",
    code: "EQ-PRJ-01",
    status: "AVAILABLE",
    loans: [],
  },
  {
    id: "res-002",
    name: "Kit Portátil Dell",
    code: "EQ-LAP-03",
    status: "IN_USE",
    loans: [],
  },
];

async function setupPage(
  page,
  userRole = "ADMIN",
  userName = "Prof. Leonardo",
) {
  page.on("pageerror", (err) => console.error(`[PAGE ERR ${userRole}]:`, err));

  // Mock API endpoints
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace("/api", "");

    if (path === "/channels") {
      await route.fulfill({ json: { data: CHANNELS } });
      return;
    }

    if (path === "/members") {
      await route.fulfill({ json: { data: MEMBERS } });
      return;
    }

    if (path.startsWith("/channels/") && path.endsWith("/messages")) {
      const parts = path.split("/");
      const slug = decodeURIComponent(parts[2]);
      const msgs = MESSAGES_CATALOG[slug] || [];
      await route.fulfill({
        json: { data: { messages: msgs, nextCursor: null } },
      });
      return;
    }

    if (path === "/spaces") {
      await route.fulfill({ json: { data: SPACES } });
      return;
    }

    if (path === "/resources") {
      await route.fulfill({ json: { data: RESOURCES } });
      return;
    }

    if (
      path === "/reservations" ||
      path === "/loans" ||
      path === "/incidents" ||
      path === "/admin/audit"
    ) {
      await route.fulfill({ json: { data: [] } });
      return;
    }

    if (path === "/agenda/status") {
      await route.fulfill({
        json: { data: { configured: false, executionEnabled: false } },
      });
      return;
    }

    await route.fulfill({ json: { data: [] } });
  });

  // Mock WebSocket with complete specification constants and event lifecycle
  await page.addInitScript(
    ({ role, name }) => {
      class MockWebSocket extends EventTarget {
        constructor(url) {
          super();
          this.url = url;
          this.readyState = MockWebSocket.OPEN;
          setTimeout(() => {
            if (typeof this.onopen === "function")
              this.onopen({ type: "open" });

            this.receive({
              type: "AUTHENTICATED",
              user: { id: "current-user", name, role },
            });

            this.receive({
              type: "CHANNEL_PRESENCE",
              channelSlug: "avisos-generales",
              users: [
                { id: "current-user", name, role },
                { id: "mem-002", name: "Ing. Carlos Gómez", role: "FORMACION" },
                { id: "mem-003", name: "Sofía Martínez", role: "SOPORTE" },
              ],
            });
          }, 50);
        }

        send(data) {
          try {
            const payload = JSON.parse(data);
            if (payload.type === "JOIN_CHANNEL") {
              const slug = payload.channelSlug;
              setTimeout(() => {
                this.receive({
                  type: "CHANNEL_PRESENCE",
                  channelSlug: slug,
                  users: [
                    { id: "current-user", name, role },
                    {
                      id: "mem-002",
                      name: "Ing. Carlos Gómez",
                      role: "FORMACION",
                    },
                  ],
                });
              }, 30);
            }
          } catch (e) {
            console.error("MockWebSocket send error:", e);
          }
        }

        receive(msg) {
          const evt = new MessageEvent("message", {
            data: JSON.stringify(msg),
          });
          if (typeof this.onmessage === "function") this.onmessage(evt);
          this.dispatchEvent(evt);
        }

        close() {
          this.readyState = MockWebSocket.CLOSED;
          if (typeof this.onclose === "function")
            this.onclose({ type: "close" });
        }
      }

      MockWebSocket.CONNECTING = 0;
      MockWebSocket.OPEN = 1;
      MockWebSocket.CLOSING = 2;
      MockWebSocket.CLOSED = 3;

      window.WebSocket = MockWebSocket;
    },
    { role: userRole, name: userName },
  );
}

async function navigateToComms(page) {
  // Wait for sidebar attached in DOM
  await page.waitForSelector(".workspace-sidebar", { state: "attached" });

  const menu = page.getByRole("button", { name: "Abrir menú de módulos" });
  if (await menu.isVisible()) {
    await menu.click();
    await page.waitForTimeout(400);
  }

  const commsBtn = page
    .locator(".workspace-sidebar nav button")
    .filter({ hasText: "Comunicaciones" });
  await commsBtn.click();
  await page.waitForSelector(".comms-workspace-container", { timeout: 10000 });
}

const report = {
  testedRoles: [],
  screenshotsTaken: [],
  observations: [],
};

try {
  // TEST 1: ADMIN en Desktop
  console.log(
    "--- TEST 1: Administrador General (ADMIN) en Desktop (1440x900) ---",
  );
  const adminContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const adminPage = await adminContext.newPage();
  await setupPage(adminPage, "ADMIN", "Prof. Leonardo");

  await adminPage.goto(`${serverUrl}/?role=ADMIN`);
  console.log("Navegando a la pestaña de Comunicaciones...");
  await navigateToComms(adminPage);

  // Verificar canal activo
  const heading = await adminPage
    .locator(".comms-channel-heading")
    .textContent();
  console.log("Canal activo:", heading);

  // Verificar estado del composer
  const textarea = adminPage.locator(".comms-composer-textarea");
  const isTextareaDisabled = await textarea.isDisabled();
  console.log(
    "¿Textarea deshabilitado para ADMIN en #avisos-generales?:",
    isTextareaDisabled,
  );

  // Switch de Aviso Oficial visible
  const urgentToggle = adminPage.locator(".comms-urgent-toggle");
  const hasUrgentToggle = (await urgentToggle.count()) > 0;
  console.log("¿Switch de Aviso Oficial visible para ADMIN?:", hasUrgentToggle);

  // Esperar a que se rendericen mensajes y canales
  await adminPage.waitForTimeout(500);

  // Captura 1: Admin en #avisos-generales
  const shot1 = resolve(SCREENSHOT_DIR, "manual-test-admin-avisos.png");
  await adminPage.screenshot({ path: shot1 });
  report.screenshotsTaken.push({
    name: "manual-test-admin-avisos.png",
    path: shot1,
  });
  report.testedRoles.push("ADMIN (Desktop 1440x900)");

  // Chequeo de scroll en ventana
  const scrollHeight = await adminPage.evaluate(
    () => document.documentElement.scrollHeight,
  );
  const clientHeight = await adminPage.evaluate(
    () => document.documentElement.clientHeight,
  );
  console.log(
    `ScrollHeight: ${scrollHeight}px, ClientHeight: ${clientHeight}px`,
  );
  if (scrollHeight <= clientHeight) {
    report.observations.push(
      "✅ Cero scroll en la ventana global del navegador (viewport acotado y contenido scrolleable interno).",
    );
  } else {
    report.observations.push(
      `⚠️ Desborde vertical de ${scrollHeight - clientHeight}px en la ventana global.`,
    );
  }

  // TEST 2: Usuario FORMACION (No Admin) en #avisos-generales (Solo Lectura)
  console.log("\n--- TEST 2: Usuario FORMACION en #avisos-generales ---");
  const userContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const userPage = await userContext.newPage();
  await setupPage(userPage, "FORMACION", "Ing. Carlos Gómez");

  await userPage.goto(`${serverUrl}/?role=FORMACION`);
  await navigateToComms(userPage);

  // Banner informativo visible
  const broadcastNotice = await userPage
    .locator(".comms-broadcast-notice")
    .textContent();
  console.log("Cartel de solo lectura:", broadcastNotice.trim());

  // Textarea deshabilitado para FORMACION en avisos-generales
  const isFormacionDisabledInAvisos = await userPage
    .locator(".comms-composer-textarea")
    .isDisabled();
  console.log(
    "¿Textarea deshabilitado para FORMACION en avisos-generales?:",
    isFormacionDisabledInAvisos,
  );

  await userPage.waitForTimeout(500);

  // Captura 2: Formacion en #avisos-generales
  const shot2 = resolve(SCREENSHOT_DIR, "manual-test-formacion-read-only.png");
  await userPage.screenshot({ path: shot2 });
  report.screenshotsTaken.push({
    name: "manual-test-formacion-read-only.png",
    path: shot2,
  });
  report.testedRoles.push("FORMACION (Solo lectura en avisos-generales)");

  // TEST 3: Usuario FORMACION en su propio canal #formacion (Escritura habilitada)
  console.log("\n--- TEST 3: Usuario FORMACION en canal #formacion ---");
  const formacionBtn = userPage
    .locator(".comms-channel-item")
    .filter({ hasText: "formacion" });
  await formacionBtn.click();
  await userPage.waitForTimeout(500);

  const isFormacionEnabledInOwnChannel = !(await userPage
    .locator(".comms-composer-textarea")
    .isDisabled());
  console.log(
    "¿Textarea habilitado para FORMACION en #formacion?:",
    isFormacionEnabledInOwnChannel,
  );

  const shot3 = resolve(
    SCREENSHOT_DIR,
    "manual-test-formacion-canal-activo.png",
  );
  await userPage.screenshot({ path: shot3 });
  report.screenshotsTaken.push({
    name: "manual-test-formacion-canal-activo.png",
    path: shot3,
  });
  report.testedRoles.push("FORMACION (Escritura habilitada en #formacion)");

  // TEST 4: Usuario SOPORTE en #soporte-tecnico
  console.log("\n--- TEST 4: Usuario SOPORTE en canal #soporte-tecnico ---");
  const soporteContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const soportePage = await soporteContext.newPage();
  await setupPage(soportePage, "SOPORTE", "Sofía Martínez");

  await soportePage.goto(`${serverUrl}/?role=SOPORTE`);
  await navigateToComms(soportePage);

  const soporteChannelBtn = soportePage
    .locator(".comms-channel-item")
    .filter({ hasText: "soporte-tecnico" });
  await soporteChannelBtn.click();
  await soportePage.waitForTimeout(500);

  const isSoporteUrgentVisible =
    (await soportePage.locator(".comms-urgent-toggle").count()) > 0;
  console.log(
    "¿Switch de Urgente visible para representante de SOPORTE?:",
    isSoporteUrgentVisible,
  );

  const shot4 = resolve(SCREENSHOT_DIR, "manual-test-soporte-canal.png");
  await soportePage.screenshot({ path: shot4 });
  report.screenshotsTaken.push({
    name: "manual-test-soporte-canal.png",
    path: shot4,
  });
  report.testedRoles.push("SOPORTE (Representante de área con switch urgente)");

  // TEST 5: Vista Móvil Responsiva (iPhone 13 - 390x844)
  console.log("\n--- TEST 5: Vista Móvil Responsiva (390x844) ---");
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();
  await setupPage(mobilePage, "ADMIN", "Prof. Leonardo");

  await mobilePage.goto(`${serverUrl}/?role=ADMIN`);
  await navigateToComms(mobilePage);
  await mobilePage.waitForTimeout(500);

  const shot5 = resolve(SCREENSHOT_DIR, "manual-test-mobile-comms.png");
  await mobilePage.screenshot({ path: shot5 });
  report.screenshotsTaken.push({
    name: "manual-test-mobile-comms.png",
    path: shot5,
  });
  report.testedRoles.push("ADMIN (Mobile iPhone 13 390x844)");

  console.log("\n=================================");
  console.log("TODAS LAS PRUEBAS MANUALES COMPLETADAS CON ÉXITO");
  console.log(JSON.stringify(report, null, 2));
} catch (err) {
  console.error("Error durante las pruebas manuales:", err);
  process.exitCode = 1;
} finally {
  await browser.close();
  serverProcess.kill();
}
