import path from "node:path"
import { defineConfig, devices } from "@playwright/test"
import { testDatabaseEnv } from "./test/test-database"

// The config is evaluated again in each worker, which inherits process.env, so
// the port and test schema chosen here stay the same for the whole run.
process.env.E2E_PORT ??= String(4000 + Math.floor(Math.random() * 1000))
const port = Number(process.env.E2E_PORT)
const baseURL = `http://localhost:${port}`

export default defineConfig({
  testDir: "./e2e",
  testIgnore: [`${path.resolve(import.meta.dirname, ".claude")}/**`],
  fullyParallel: true,
  globalSetup: "./test/playwright-global-setup.ts",
  use: { baseURL, locale: "en-US", timezoneId: "America/New_York", trace: "retain-on-failure" },
  projects: [
    { name: "phone", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: `node scripts/prepare-e2e.mjs && pnpm exec next dev --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: { ...testDatabaseEnv(), E2E_TEST: "1", NEXT_TELEMETRY_DISABLED: "1" },
  },
})
