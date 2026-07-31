/**
 * Rebuild session-bound development artifacts before Next starts.
 *
 * Development uses `.next-dev`, isolated from the production `.next` tree. A
 * terminated dev process can still leave a truncated manifest or a hot-update
 * graph from its previous session. Only the compiler cache is valid across
 * server lifetimes; every route manifest and emitted chunk belongs to one exact
 * process session.
 *
 * The persistent wrapper owns the project lock before invoking this script, so
 * cleanup cannot race a live development server.
 */
import fs from "node:fs";
import path from "node:path";

const PROJECT_ROOT = process.cwd();
const NEXT_DIR = path.join(PROJECT_ROOT, ".next-dev");
const PERSISTENT_CACHE = path.join(NEXT_DIR, "cache");
const BUILD_DIR = path.join(PROJECT_ROOT, "build");
const CACHE_HOLD = path.join(BUILD_DIR, ".next-dev-cache-hold");
const LOCK_FILE = path.join(BUILD_DIR, ".dev-server.lock");
const WEBPACK_CACHE = path.join(PROJECT_ROOT, "node_modules", ".cache");
const requestedOwner = Number(process.env.NEURAL_ATLAS_DEV_OWNER_PID);
const requestedOwnerPid =
  Number.isInteger(requestedOwner) && requestedOwner > 0 ? requestedOwner : null;

/** Signal zero checks liveness without changing the target process. */
function isRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === "EPERM";
  }
}

function activeDevServer() {
  try {
    const pid = Number(fs.readFileSync(LOCK_FILE, "utf8").trim());
    return Number.isInteger(pid) && pid > 0 && isRunning(pid) ? pid : null;
  } catch {
    return null;
  }
}

const owner = activeDevServer();
if (owner !== null && owner !== requestedOwnerPid) {
  console.warn(
    `dev cache: .next-dev is in use by dev server pid ${owner} — leaving it alone.\n` +
      "           Run one dev server per project; two processes cannot share\n" +
      "           one compiler directory safely.",
  );
  process.exit(requestedOwnerPid === null ? 0 : 73);
}

fs.rmSync(CACHE_HOLD, { recursive: true, force: true });
if (fs.existsSync(PERSISTENT_CACHE)) {
  fs.mkdirSync(BUILD_DIR, { recursive: true });
  fs.renameSync(PERSISTENT_CACHE, CACHE_HOLD);
}

fs.rmSync(NEXT_DIR, { recursive: true, force: true });

if (fs.existsSync(CACHE_HOLD)) {
  fs.mkdirSync(NEXT_DIR, { recursive: true });
  fs.renameSync(CACHE_HOLD, PERSISTENT_CACHE);
}

// This legacy external cache may retain module-to-chunk mappings for deleted
// session output. Rebuilding it is cheaper than diagnosing nondeterministic
// missing chunks or partially read manifests.
fs.rmSync(WEBPACK_CACHE, { recursive: true, force: true });
console.log("dev cache: rebuilt .next-dev runtime state");

// The persistent wrapper supplies its own PID. The fallback preserves safe
// standalone use of this preparation script.
fs.mkdirSync(BUILD_DIR, { recursive: true });
fs.writeFileSync(LOCK_FILE, String(requestedOwnerPid ?? process.ppid), "utf8");
