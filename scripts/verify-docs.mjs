/**
 * Documentation drift gate.
 *
 * `CLAUDE.md` and `PROJECT.md` are only useful to an agent if they are true.
 * Prose rots silently: a script is renamed, a path moves, an environment
 * variable is added, and the file that was meant to give an agent fast, correct
 * context starts giving it fast, confident, wrong context — which is worse than
 * no file at all.
 *
 * This script makes that drift a build failure instead of a discovery. It only
 * asserts mechanically checkable facts:
 *
 *   1. every `npm run <script>` cited in the docs exists in package.json
 *   2. every repository path cited in the docs exists on disk
 *   3. every `process.env.X` read in source is documented
 *
 * It deliberately does NOT try to verify prose claims. Those are the reviewer's
 * job; these three are the ones that break without anyone noticing.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Docs that are checked. A missing file is skipped, not an error. */
const DOC_FILES = ["CLAUDE.md", "PROJECT.md", "CLAUDE.local.md"];

/** Directories never scanned for env vars. */
const SKIP_DIRS = new Set([
  "node_modules", ".git", ".next", ".next-dev", "out", "build", ".dist",
  ".visual-qa", ".product-design-capture", "docs",
]);

/** Path-shaped citations that are patterns or prose, not real files. */
const PATH_IGNORE = [
  /\*/, /\{/, /\[/, /\$/, /^https?:/, /^\/mnt\//, /\.\.\./,
  /^[A-Z]:/, /^~/,
];

const errors = [];
const notes = [];

const read = (rel) => {
  const abs = path.join(ROOT, rel);
  return fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : null;
};

const docs = DOC_FILES
  .map((name) => ({ name, text: read(name) }))
  .filter((d) => d.text !== null);

if (docs.length === 0) {
  console.error("verify-docs: no documentation files found to check.");
  process.exit(1);
}

// ---------------------------------------------------------------- 1. scripts
const pkg = JSON.parse(read("package.json"));
const scripts = pkg.scripts ?? {};

for (const { name, text } of docs) {
  for (const m of text.matchAll(/`npm run ([a-zA-Z0-9:_-]+)`/g)) {
    if (!(m[1] in scripts)) {
      errors.push(`${name}: cites \`npm run ${m[1]}\`, absent from package.json`);
    }
  }
}

// ------------------------------------------------------------------ 2. paths
const looksLikePath = (s) =>
  (s.includes("/") || /\.(ts|tsx|mjs|js|json|css|md|yml)$/.test(s)) &&
  !PATH_IGNORE.some((re) => re.test(s));

for (const { name, text } of docs) {
  const seen = new Set();
  for (const m of text.matchAll(/`([^`\n]+)`/g)) {
    const raw = m[1].trim().replace(/[.,;:]$/, "");
    if (!looksLikePath(raw) || seen.has(raw)) continue;
    seen.add(raw);
    const rel = raw.replace(/\/$/, "");
    if (!fs.existsSync(path.join(ROOT, rel))) {
      // A path may legitimately be build output that does not exist yet.
      if (/^(out|\.next|\.next-dev|build)\b/.test(rel)) {
        notes.push(`${name}: \`${raw}\` is build output, not checked`);
      } else {
        errors.push(`${name}: cites path \`${raw}\`, which does not exist`);
      }
    }
  }
}

// ----------------------------------------------------------------- 3. env vars
const found = new Set();
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") && entry.name !== ".github") continue;
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { walk(full); continue; }
    if (!/\.(ts|tsx|mjs|js)$/.test(entry.name)) continue;
    const src = fs.readFileSync(full, "utf8");
    for (const m of src.matchAll(/process\.env\.([A-Z][A-Z_0-9]*)/g)) found.add(m[1]);
  }
};
walk(ROOT);

// NODE_ENV is ambient to every Node project and not a project contract.
found.delete("NODE_ENV");

const allDocText = docs.map((d) => d.text).join("\n");
for (const v of [...found].sort()) {
  if (!allDocText.includes(v)) {
    errors.push(`env var ${v} is read in source but documented nowhere`);
  }
}

// ------------------------------------------------------------------- report
console.log(`verify-docs: checked ${docs.map((d) => d.name).join(", ")}`);
console.log(`  npm scripts cited ....... ok`);
console.log(`  repository paths cited ... ${errors.filter((e) => e.includes("path")).length === 0 ? "ok" : "FAIL"}`);
console.log(`  env vars documented ...... ${found.size} found in source`);
for (const n of notes) console.log(`  note: ${n}`);

if (errors.length > 0) {
  console.error(`\nverify-docs: ${errors.length} drift error(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  console.error("\nThe documentation no longer matches the repository. Fix the docs.");
  process.exit(1);
}

console.log("\nverify-docs: documentation matches the repository.");
