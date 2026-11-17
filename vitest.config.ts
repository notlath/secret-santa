import path from "node:path"
import { defineConfig } from "vitest/config"
import { testDatabaseEnv } from "./test/test-database"

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "server-only": path.resolve(import.meta.dirname, "node_modules/server-only/empty.js"),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
    exclude: ["**/node_modules/**", `${path.resolve(import.meta.dirname, ".claude")}/**`],
    globalSetup: ["./test/vitest-global-setup.ts"],
    env: testDatabaseEnv(),
    testTimeout: 20_000,
    hookTimeout: 60_000,
  },
})
