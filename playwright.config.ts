import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : undefined,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
  webServer:
    process.env.E2E_EXTERNAL_SERVERS === "1"
      ? undefined
      : [
          {
            command: "npm run dev -w @campusflow/web",
            url: "http://127.0.0.1:3000",
            reuseExistingServer: !process.env.CI,
            timeout: 120_000,
          },
          {
            command: "npm run dev -w @campusflow/api",
            url: "http://127.0.0.1:4000/health",
            reuseExistingServer: !process.env.CI,
            timeout: 60_000,
          },
        ],
});
