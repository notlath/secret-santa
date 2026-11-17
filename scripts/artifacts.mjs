import { randomUUID } from "node:crypto"
import path from "node:path"

export function createRunId() {
  return `${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`
}

export function artifactPaths(cwd, runId) {
  if (!/^[a-zA-Z0-9_-]+$/.test(runId)) throw new Error("Invalid test run identifier")
  return {
    verification: path.resolve(cwd, "test-results", "verification", runId),
    e2e: path.resolve(cwd, "test-results", "e2e", runId),
  }
}
