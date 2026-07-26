/**
 * Lightweight content validation (plan §25.1 `content:validate`).
 *
 * Runs independently of the Next build: discovers the Markdown corpus and
 * reports source-aware diagnostics — empty stubs, duplicate titles, unbalanced
 * display-math brackets, and unclosed code fences. Exits non-zero on any error
 * so it can gate CI (plan §27). This intentionally has no dependency on the
 * TypeScript compiler modules so it stays runnable with plain Node.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CONTENT_ROOT = path.join(ROOT, "docs");
const MD = new Set([".md", ".mdx"]);

/** @type {string[]} */
const files = [];
(function walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  entries.sort((a, b) => a.name.localeCompare(b.name, "en"));
  for (const e of entries) {
    if (e.name.startsWith(".")) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "assets") continue;
      walk(full);
    } else if (MD.has(path.extname(e.name).toLowerCase())) {
      files.push(full);
    }
  }
})(CONTENT_ROOT);

const diagnostics = [];
const titles = new Map();

function firstHeading(body) {
  const m = body.match(/^\s{0,3}#\s+(.+?)\s*$/m);
  return m ? m[1].trim() : null;
}

for (const abs of files) {
  const rel = path.relative(ROOT, abs).split(path.sep).join("/");
  const raw = fs.readFileSync(abs, "utf8");
  // Strip a leading YAML front-matter block before structural checks.
  const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");

  if (body.trim().length === 0) {
    diagnostics.push({ level: "warn", code: "NA-DOC-001", file: rel, msg: "Empty document (skipped from publication)." });
    continue;
  }

  const title = firstHeading(body);
  if (!title) {
    diagnostics.push({ level: "error", code: "NA-META-001", file: rel, msg: "No level-1 heading to derive a title." });
  } else {
    const key = title.toLowerCase();
    if (titles.has(key)) {
      diagnostics.push({ level: "error", code: "NA-META-002", file: rel, msg: `Duplicate title "${title}" (also in ${titles.get(key)}).` });
    } else {
      titles.set(key, rel);
    }
  }

  // Balance of bare display-math brackets and code fences, ignoring fenced code.
  const lines = body.split(/\r?\n/);
  let inFence = false;
  let open = 0;
  let fenceLines = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*(```+|~~~+)/.test(line)) {
      inFence = !inFence;
      fenceLines++;
      continue;
    }
    if (inFence) continue;
    if (/^\s*\[\s*$/.test(line)) open++;
    else if (/^\s*\]\s*$/.test(line)) open--;
    if (open < 0) {
      diagnostics.push({ level: "warn", code: "NA-MATH-001", file: `${rel}:${i + 1}`, msg: "Display-math close `]` with no matching open `[`." });
      open = 0;
    }
  }
  if (open > 0) {
    diagnostics.push({ level: "warn", code: "NA-MATH-002", file: rel, msg: `${open} unbalanced display-math open bracket(s).` });
  }
  if (fenceLines % 2 !== 0) {
    diagnostics.push({ level: "error", code: "NA-CODE-001", file: rel, msg: "Unclosed code fence." });
  }
}

const errors = diagnostics.filter((d) => d.level === "error");
const warnings = diagnostics.filter((d) => d.level === "warn");

console.log(`Neural Atlas content validation`);
console.log(`  discovered: ${files.length} document(s)`);
console.log(`  errors:     ${errors.length}`);
console.log(`  warnings:   ${warnings.length}\n`);

for (const d of diagnostics) {
  console.log(`  ${d.level === "error" ? "✖" : "⚠"} ${d.code} ${d.file}\n     ${d.msg}`);
}

if (errors.length > 0) {
  console.error(`\nValidation failed with ${errors.length} error(s).`);
  process.exit(1);
}
console.log(`\nValidation passed.`);
