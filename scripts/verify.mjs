import { spawnSync } from "node:child_process"
import { config } from "dotenv"

config({ path: ".env.local", quiet: true })
if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Set TEST_DATABASE_URL in .env.local before running verification.")
}
for (const check of ["lint", "typecheck", "test:tooling", "test", "test:e2e"]) {
  console.log(`\nVerifying: ${check}`)
  const result = spawnSync("pnpm", [check], { stdio: "inherit" })
  if (result.status !== 0) process.exit(result.status ?? 1)
}
