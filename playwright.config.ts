import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL,
    trace: "on-first-retry",
    launchOptions: {
      // Sandboxed/agentic environments ship a preinstalled Chromium whose
      // version may not match this Playwright release — point
      // PLAYWRIGHT_CHROMIUM_EXECUTABLE at it instead of downloading.
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    },
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        // CI runs the production build (pnpm build precedes test:e2e);
        // local runs use the dev server for iteration speed.
        command: process.env.CI
          ? "pnpm --filter @launch/web start"
          : "pnpm --filter @launch/web dev",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        url: baseURL,
      },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
});
