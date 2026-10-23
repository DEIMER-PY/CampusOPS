import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/frontend",
  outputDir: "./artifacts/frontend-tests",
  testMatch: "*.spec.ts",
  fullyParallel: true,
  use: {
    baseURL: "http://127.0.0.1:3200",
    trace: "retain-on-failure",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : undefined,
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 960 },
      },
    },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: {
    command: "node tests/frontend/fixture-server.mjs",
    url: "http://127.0.0.1:3200",
    reuseExistingServer: !process.env.CI,
  },
});
