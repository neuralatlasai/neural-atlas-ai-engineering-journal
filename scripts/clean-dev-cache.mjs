/**
 * Clear a `.next` directory left behind by a production build, before the dev
 * server starts.
 *
 * `next dev` and `next build` share `.next`. When a build writes it while a dev
 * server is running, the server goes on requesting chunks and manifests that no
 * longer exist, and dies with a cascade of:
 *
 *     ⨯ Could not find the module "…/segment-explorer-node.js#SegmentViewNode"
 *       in the React Client Manifest
 *     ⨯ Cannot find module './vendor-chunks/katex.js'
 *     ⨯ Cannot read properties of undefined (reading 'call')
 *     ⨯ ENOENT: no such file or directory, open '…/.next/routes-manifest.json'
 *
 * The page itself is fine — the process is not. Clearing the stale directory at
 * startup turns a confusing failure into a slightly slower first compile.
 *
 * The lock below is what makes this safe. An earlier version cleared `.next`
 * unconditionally, which meant starting a *second* dev server deleted the first
 * one's cache and broke it — the script caused the very failure it exists to
 * prevent.
 */
import fs from "node:fs";
import path from "node:path";

const NEXT_DIR = path.join(process.cwd(), ".next");
const HOT_UPDATE_DIR = path.join(NEXT_DIR, "static", "webpack");
/**
 * The lock lives OUTSIDE .next on purpose. Kept inside, a production build
 * deletes it along with the directory, so the next dev server sees no owner and
 * clears .next underneath the one that is still running — which is exactly the
 * failure it exists to prevent ("missing required error components").
 * build/ is gitignored and nothing else removes it.
 */
const LOCK_FILE = path.join(process.cwd(), "build", ".dev-server.lock");
const WEBPACK_CACHE = path.join(process.cwd(), "node_modules", ".cache");

/** True when a process with this id is alive. Signal 0 only tests existence. */
function isRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === "EPERM"; // alive, just owned by another user
  }
}

/** The pid of a dev server already using this `.next`, if one is running. */
function activeDevServer() {
  try {
    const pid = Number(fs.readFileSync(LOCK_FILE, "utf8").trim());
    return Number.isInteger(pid) && pid > 0 && isRunning(pid) ? pid : null;
  } catch {
    return null;
  }
}

const owner = activeDevServer();
if (owner !== null) {
  console.warn(
    `dev cache: .next is in use by dev server pid ${owner} — leaving it alone.\n` +
      "           Run one dev server per project; a second one shares the same\n" +
      "           .next and the two will corrupt each other.",
  );
  process.exit(0);
}

/**
 * Artifacts only ever written by `next build`. Any one of them means `.next`
 * holds production output the dev server cannot use.
 *
 * `BUILD_ID` alone is not enough: a build that was interrupted — or that failed
 * because a dev server was writing the same directory — never gets that far,
 * yet still leaves production chunks and manifests behind.
 */
const BUILD_ONLY_ARTIFACTS = [
  "BUILD_ID",
  "export-detail.json",
  "prerender-manifest.json",
  "required-server-files.json",
  path.join("server", "pages", "_document.js"),
];

const leftFromBuild = BUILD_ONLY_ARTIFACTS.some((rel) =>
  fs.existsSync(path.join(NEXT_DIR, rel)),
);

if (leftFromBuild) {
  fs.rmSync(NEXT_DIR, { recursive: true, force: true });
  // webpack's own cache lives outside `.next` and holds module→chunk mappings
  // that must agree with it. Clearing only `.next` left the two out of step,
  // and the dev server failed with `Cannot find module
  // './vendor-chunks/esprima.js'` for a package that was installed and present
  // — the chunk simply was never emitted. They have to be cleared together.
  fs.rmSync(WEBPACK_CACHE, { recursive: true, force: true });
  console.log("dev cache: cleared .next left behind by a production build");
} else if (fs.existsSync(HOT_UPDATE_DIR)) {
  // Hot-update chunks belong to one dev session; leftovers 404 and kill Fast
  // Refresh. Clearing them keeps `.next/cache`, so startup stays fast.
  const stale = fs
    .readdirSync(HOT_UPDATE_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.includes("hot-update")).length;
  fs.rmSync(HOT_UPDATE_DIR, { recursive: true, force: true });
  if (stale > 0) console.log(`dev cache: cleared ${stale} stale hot-update file(s)`);
}

// Claim ownership for the dev server about to start. `npm run dev` runs this
// script as a child, so record the parent — the shell that will host `next dev`.
fs.mkdirSync(path.dirname(LOCK_FILE), { recursive: true });
fs.writeFileSync(LOCK_FILE, String(process.ppid), "utf8");
