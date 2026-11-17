import { readFileSync, renameSync, rmSync } from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"

// Turbopack's persistent cache has served stale globals.css to fresh servers, so each run starts without it.
export function prepareE2E(outputDirectory) {
  releaseStaleLock(outputDirectory)
  rmSync(path.join(outputDirectory, "dev", "cache"), { recursive: true, force: true })
}

function releaseStaleLock(outputDirectory) {
  const lockPath = path.join(outputDirectory, "dev", "lock")
  let lock
  try {
    lock = JSON.parse(readFileSync(lockPath, "utf8"))
  } catch (error) {
    if (error.code === "ENOENT") return
    throw new Error(`Cannot read ${lockPath}. Inspect it before retrying E2E.`, { cause: error })
  }
  if (!Number.isSafeInteger(lock?.pid) || lock.pid <= 0) {
    throw new Error(`Invalid PID in ${lockPath}. Inspect it before retrying E2E.`)
  }
  try {
    process.kill(lock.pid, 0)
  } catch (error) {
    if (error.code !== "ESRCH") throw error
    renameSync(lockPath, `${lockPath}.stale-${Date.now()}`)
    console.log("Moved stale E2E Next lock aside; its process has exited.")
    return
  }
  throw new Error(`E2E Next output is owned by live PID ${lock.pid}. Stop that server or wait for its run to finish.`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  prepareE2E(path.resolve(".next-e2e"))
}
