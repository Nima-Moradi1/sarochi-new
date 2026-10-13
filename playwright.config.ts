import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  workers: 1,
  retries: 0,
  use: { baseURL, trace: "retain-on-failure" },
  projects: [
    { name: "api", testMatch: /api\.spec\.ts/ },
    { name: "desktop", testMatch: /browser\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", testMatch: /browser\.spec\.ts/, use: { ...devices["Pixel 7"] } },
  ],
  webServer: process.env.E2E_BASE_URL ? undefined : {
    command: "pnpm dev --port 3100 --hostname 127.0.0.1",
    url: `${baseURL}/admin/login`,
    env: { APP_ORIGIN: baseURL },
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
