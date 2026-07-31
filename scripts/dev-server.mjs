/**
 * Own the complete development-server lifecycle from one persistent process.
 *
 * npm launches `predev` and `dev` in different Windows shell processes, so a
 * lock written from `predev` points at a process that exits before Next starts.
 * This wrapper acquires the lock atomically, prepares caches, optimizes images,
 * and then remains alive for exactly as long as `next dev`.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const PROJECT_ROOT = process.cwd();
const BUILD_DIR = path.join(PROJECT_ROOT, "build");
const LOCK_FILE = path.join(BUILD_DIR, ".dev-server.lock");
const OWNER_PID = process.pid;

function isRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === "EPERM";
  }
}

function readOwner() {
  try {
    const pid = Number(fs.readFileSync(LOCK_FILE, "utf8").trim());
    return Number.isInteger(pid) && pid > 0 ? pid : null;
  } catch {
    return null;
  }
}

function acquireLock() {
  fs.mkdirSync(BUILD_DIR, { recursive: true });

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const descriptor = fs.openSync(LOCK_FILE, "wx");
      try {
        fs.writeFileSync(descriptor, String(OWNER_PID), "utf8");
      } finally {
        fs.closeSync(descriptor);
      }
      return;
    } catch (error) {
      if (error.code !== "EEXIST") throw error;

      const owner = readOwner();
      if (owner !== null && isRunning(owner)) {
        throw new Error(
          `A development server already owns this project (pid ${owner}). ` +
            "Stop it before starting another instance.",
        );
      }

      // The previous owner exited without cleanup. Remove only this exact lock,
      // then retry the atomic create once.
      fs.rmSync(LOCK_FILE, { force: true });
    }
  }

  throw new Error("Unable to acquire the development-server lock.");
}

function releaseLock() {
  if (readOwner() === OWNER_PID) fs.rmSync(LOCK_FILE, { force: true });
}

function runNodeScript(relativePath, args = [], extraEnvironment = {}) {
  const result = spawnSync(
    process.execPath,
    [path.join(PROJECT_ROOT, relativePath), ...args],
    {
      cwd: PROJECT_ROOT,
      env: { ...process.env, ...extraEnvironment },
      stdio: "inherit",
    },
  );

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${relativePath} exited with status ${result.status ?? "unknown"}.`);
  }
}

try {
  acquireLock();
  process.once("exit", releaseLock);

  runNodeScript("scripts/clean-dev-cache.mjs", [], {
    NEURAL_ATLAS_DEV_OWNER_PID: String(OWNER_PID),
  });
  runNodeScript("scripts/optimize-images.mjs");

  const nextArguments = ["dev", ...process.argv.slice(2)];
  const nextResult = spawnSync(
    process.execPath,
    [path.join(PROJECT_ROOT, "node_modules", "next", "dist", "bin", "next"), ...nextArguments],
    { cwd: PROJECT_ROOT, env: process.env, stdio: "inherit" },
  );

  if (nextResult.error) throw nextResult.error;
  process.exitCode = nextResult.status ?? 1;
} catch (error) {
  console.error(`dev server: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
} finally {
  releaseLock();
}
