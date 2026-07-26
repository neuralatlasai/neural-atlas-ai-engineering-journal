/**
 * Determinism gate (plan §3.2, §27).
 *
 * Builds the site twice from identical sources and compares the exported bytes.
 * Any difference means something in the pipeline depends on state that is not
 * the source: a clock reading, a random identifier, filesystem traversal order,
 * or an unstable sort.
 *
 * `NEXT_BUILD_ID` is pinned for the comparison because Next.js otherwise embeds
 * a fresh random build ID in every page (see `next.config.mjs`). That is the
 * only sanctioned source of variance; everything else must match exactly.
 */
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "out");
const BUILD_ID = "determinism-probe";

function build(label) {
  process.stdout.write(`build ${label}… `);
  execFileSync("npm", ["run", "build"], {
    stdio: ["ignore", "ignore", "inherit"],
    env: { ...process.env, NEXT_BUILD_ID: BUILD_ID },
    shell: process.platform === "win32",
  });
  process.stdout.write("done\n");
}

/** sha256 of every exported file, keyed by its site-relative path. */
function manifest(dir = OUT, base = OUT, acc = {}) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) manifest(full, base, acc);
    else {
      const rel = path.relative(base, full).split(path.sep).join("/");
      acc[rel] = crypto.createHash("sha256").update(fs.readFileSync(full)).digest("hex");
    }
  }
  return acc;
}

build("1/2");
const first = manifest();
build("2/2");
const second = manifest();

const changed = Object.keys(first).filter((f) => second[f] && second[f] !== first[f]);
const removed = Object.keys(first).filter((f) => !second[f]);
const added = Object.keys(second).filter((f) => !first[f]);
const differences = [
  ...changed.map((f) => `  ~ ${f}`),
  ...removed.map((f) => `  - ${f}`),
  ...added.map((f) => `  + ${f}`),
];

console.log(`\ncompared ${Object.keys(first).length} exported files`);

if (differences.length === 0) {
  console.log("✓ Build is deterministic.");
  process.exit(0);
}

console.error(`✖ Build is not deterministic — ${differences.length} file(s) differ:`);
console.error(differences.slice(0, 40).join("\n"));
if (differences.length > 40) console.error(`  … and ${differences.length - 40} more`);
process.exit(1);
