import path from "node:path"
import { defineConfig, devices } from "@playwright/test"
import { artifactPaths, createRunId } from "./scripts/artifacts.mjs"
import { testDatabaseEnv } from "./test/test-database"

if (!process.env.E2E_PORT) throw new Error("Run pnpm test:e2e to select an available, non-reserved port.")
process.env.E2E_RUN_ID ??= createRunId()
const port = Number(process.env.E2E_PORT)
const baseURL = `http://localhost:${port}`

export default defineConfig({
  testDir: "./e2e",
  testIgnore: [`${path.resolve(import.meta.dirname, ".claude")}/**`],
  fullyParallel: true,
  workers: process.env.E2E_WORKERS ? Number(process.env.E2E_WORKERS) : undefined,
  outputDir: artifactPaths(process.cwd(), process.env.E2E_RUN_ID).e2e,
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
