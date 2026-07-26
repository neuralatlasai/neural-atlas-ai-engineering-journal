/**
 * Static HTML audit of the exported site.
 *
 * Complements `verify-math.mjs` (which covers equations) with whole-page
 * structural checks: heading order, landmarks, duplicate navigation, alt text,
 * link integrity, and layout hazards. Exits non-zero on any error-level finding
 * so it can gate the build alongside the maths gate.
 */
import fs from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "out");
const errors = [];
const warns = [];

function pages(dir = OUT, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) pages(p, acc);
    else if (e.name.endsWith(".html")) acc.push(p);
  }
  return acc;
}

/** Every file in the export, as a site-absolute URL path. */
function exportedFiles(dir = OUT, acc = new Set()) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) exportedFiles(p, acc);
    else acc.add("/" + path.relative(OUT, p).split(path.sep).join("/"));
  }
  return acc;
}

const files = pages();
/** Non-HTML artifacts (feed.xml, robots.txt, search-index.json, …) are valid
 *  link targets too, so link integrity is checked against the whole export
 *  rather than only against generated pages. */
const exported = exportedFiles();
const allHrefs = new Set();
const allPaths = new Set();

for (const f of files) {
  const rel = "/" + path.relative(OUT, f).split(path.sep).join("/");
  allPaths.add(rel.replace(/\/index\.html$/, "/").replace(/^\/$/, "/"));
  const html = fs.readFileSync(f, "utf8");
  const name = rel;

  // --- Headings -----------------------------------------------------------
  const h1s = html.match(/<h1[^>]*>/g) || [];
  if (h1s.length === 0) warns.push(`${name}: no <h1>`);
  if (h1s.length > 1) errors.push(`${name}: ${h1s.length} <h1> elements (must be exactly 1)`);

  // Heading level jumps (e.g. h2 -> h4) break outline semantics.
  const levels = [...html.matchAll(/<h([1-6])[^>]*>/g)].map((m) => Number(m[1]));
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] - levels[i - 1] > 1) {
      warns.push(`${name}: heading jump h${levels[i - 1]} → h${levels[i]}`);
      break;
    }
  }

  // --- Landmarks ----------------------------------------------------------
  const mains = html.match(/<main[^>]*>/g) || [];
  if (mains.length !== 1) errors.push(`${name}: ${mains.length} <main> landmarks (must be 1)`);

  // Duplicate identically-labelled nav confuses assistive tech.
  const navLabels = [...html.matchAll(/<nav[^>]*aria-label="([^"]*)"/g)].map((m) => m[1]);
  const dupes = navLabels.filter((l, i) => navLabels.indexOf(l) !== i);
  for (const d of new Set(dupes)) {
    errors.push(`${name}: duplicate <nav aria-label="${d}"> in the DOM`);
  }

  // --- Images -------------------------------------------------------------
  for (const img of html.match(/<img[^>]*>/g) || []) {
    if (!/\salt=/.test(img)) errors.push(`${name}: <img> without alt`);
    if (!/\swidth=/.test(img) || !/\sheight=/.test(img)) {
      warns.push(`${name}: <img> without width/height (layout shift risk)`);
    }
  }

  // Every referenced asset must actually exist in the export. This catches
  // unresolved document-relative paths and unsafe filenames (spaces, parens)
  // that produce URLs the browser cannot fetch.
  const assetRefs = [
    ...[...html.matchAll(/<img[^>]*\ssrc="([^"]+)"/g)].map((m) => m[1]),
    ...[...html.matchAll(/srcSet="([^"]+)"/gi)].flatMap((m) =>
      m[1].split(",").map((s) => s.trim().split(/\s+/)[0]),
    ),
  ];
  for (const ref of assetRefs) {
    if (!ref.startsWith("/")) {
      errors.push(`${name}: non-absolute asset reference "${ref}" (will 404 under the route)`);
      continue;
    }
    let decoded = ref;
    try { decoded = decodeURIComponent(ref); } catch { /* keep raw */ }
    if (!fs.existsSync(path.join(OUT, decoded))) {
      errors.push(`${name}: asset not found in export → ${ref}`);
    }
    if (/[ ()]/.test(ref)) {
      errors.push(`${name}: unsafe characters in asset URL → ${ref}`);
    }
  }

  // --- Links --------------------------------------------------------------
  for (const m of html.matchAll(/<a[^>]*href="([^"]+)"/g)) {
    const href = m[1];
    if (href.startsWith("/")) allHrefs.add(href.split("#")[0]);
    if (href === "" || href === "#") errors.push(`${name}: empty/placeholder href`);
  }

  // The site is exported with `trailingSlash: true`, so a CDN serving ./out has
  // no `/search` — only `/search/index.html`. `next/link` normalizes this, but a
  // hand-written href, a form `action`, or `location.assign` does not, and the
  // link-integrity check below cannot see it because it normalizes before
  // comparing. Flag the raw attribute instead.
  for (const m of html.matchAll(/(?:href|action)="(\/[^"#?]*)(\?[^"]*)?"/g)) {
    const target = m[1];
    if (target === "/" || target.endsWith("/")) continue;
    if (target.startsWith("/_next")) continue;
    if (/\.[a-z0-9]+$/i.test(target)) continue; // a real file: /feed.xml, /robots.txt
    errors.push(`${name}: internal path without trailing slash → ${target}${m[2] ?? ""}`);
  }

  // External links opened in a new tab need rel protection.
  for (const a of html.match(/<a[^>]*target="_blank"[^>]*>/g) || []) {
    if (!/rel="[^"]*noopener/.test(a)) errors.push(`${name}: target=_blank without rel=noopener`);
  }

  // Every in-page fragment must resolve. The outline, the heading anchors, and
  // deep links from search all depend on ids the compiler generated; a rename
  // in the slug logic would otherwise silently produce links that go nowhere.
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const deadFragments = [
    ...new Set(
      [...html.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]).filter((id) => !ids.has(id)),
    ),
  ];
  for (const fragment of deadFragments.slice(0, 5)) {
    errors.push(`${name}: dead in-page anchor → #${fragment}`);
  }

  // --- Unrendered mathematics ---------------------------------------------
  // TeX that never became an equation at all is invisible to the maths gate:
  // `verify-math.mjs` inspects rendered equations, so a display block whose
  // delimiters were mis-detected — and which therefore reached the page as
  // literal prose — passes every other check while the reader sees backslashes.
  // Code, equation annotations, and scripts legitimately contain TeX-like text
  // and are removed before looking.
  const visible = (html.match(/<main[\s\S]*?<\/main>/)?.[0] ?? "")
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<pre[\s\S]*?<\/pre>/g, " ")
    .replace(/<code[\s\S]*?<\/code>/g, " ")
    .replace(/<annotation[\s\S]*?<\/annotation>/g, " ")
    .replace(/<math[\s\S]*?<\/math>/g, " ")
    .replace(/<[^>]*>/g, " ");
  const leakedTex = [
    ...new Set(
      visible.match(/\\(?:begin|end|boxed|frac|tag|left|right|mathrm|mathcal|mathbb|bigcup|qquad|operatorname)\b/g) ??
        [],
    ),
  ];
  if (leakedTex.length > 0) {
    errors.push(
      `${name}: unrendered TeX in page text (${leakedTex.slice(0, 6).join(", ")}) — a display block was not recognised as maths`,
    );
  }

  // --- Layout hazards -----------------------------------------------------
  if (/<table/.test(html) && !/table-scroll/.test(html)) {
    warns.push(`${name}: <table> not wrapped in a scroll container`);
  }
}

// Internal link integrity against actually-exported paths.
for (const href of allHrefs) {
  if (href.startsWith("/_next") || href.startsWith("/content-assets")) continue;
  const norm = href.endsWith("/") ? href : href + "/";
  if (!allPaths.has(norm) && !allPaths.has(href) && !exported.has(href)) {
    errors.push(`broken internal link: ${href}`);
  }
}

console.log(`HTML audit: ${files.length} page(s)`);
console.log(`  errors:   ${errors.length}`);
console.log(`  warnings: ${warns.length}\n`);
for (const e of errors) console.log(`  ✖ ${e}`);
for (const w of [...new Set(warns)]) console.log(`  ⚠ ${w}`);

if (errors.length > 0) {
  console.error(`\n✖ HTML audit failed with ${errors.length} error(s).`);
  process.exit(1);
}
console.log("\n✓ HTML audit passed.");
