/**
 * Math verification harness.
 *
 * Counting `katex-error` spans only catches equations that FAIL. It says
 * nothing about equations that render silently WRONG — the failure mode this
 * corpus actually suffers from (lost `\\` row breaks, `_`→`*` subscripts,
 * invisible set braces). This harness:
 *
 *   1. Extracts every TeX string KaTeX actually rendered (from the
 *      `<annotation encoding="application/x-tex">` in the built HTML).
 *   2. Re-renders each in KaTeX **strict mode** and reports errors + warnings
 *      that the lenient build swallows.
 *   3. Runs semantic lint rules for known corruption signatures.
 *
 * Exits non-zero if any equation errors, so it can gate CI.
 */
import fs from "node:fs";
import path from "node:path";
import katex from "katex";

const OUT = path.join(process.cwd(), "out");

function decode(s) {
  return s
    // Numeric entities first (`&#x26;` = &, `&#x3C;` = <). Missing these makes
    // every alignment `&` look like a parse error.
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#([0-9]+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&");
}

/**
 * Hide literal text-command payloads from token-level TeX lint rules.
 *
 * A `\texttt{slash-star ... star-slash}` annotation intentionally contains
 * asterisks. They are visible text, not Markdown-emphasis damage. A balanced
 * scanner handles
 * nested command arguments and escaped braces without weakening linting in the
 * surrounding mathematical expression.
 */
function maskTextCommandPayloads(tex) {
  const chars = tex.split("");
  const command = /\\(?:text|texttt|textrm|textsf|textbf|textit|textnormal|mbox)\s*\{/g;
  let match;

  while ((match = command.exec(tex)) !== null) {
    const open = match.index + match[0].length - 1;
    let depth = 1;
    let close = open + 1;

    for (; close < tex.length && depth > 0; close++) {
      if (tex[close] === "\\") {
        close++;
        continue;
      }
      if (tex[close] === "{") depth++;
      else if (tex[close] === "}") depth--;
    }

    if (depth !== 0) continue;
    for (let i = open + 1; i < close - 1; i++) chars[i] = " ";
    command.lastIndex = close;
  }

  return chars.join("");
}

/** Known corruption signatures that render without erroring. */
function lint(tex) {
  const issues = [];

  // Set-builder braces must be escaped to be visible: `\in{1,2}` shows nothing.
  const setOps = /\\(in|cup|cap|subset|subseteq|supset|supseteq|setminus)\s*\{/g;
  if (setOps.test(tex)) issues.push("invisible-set-braces");

  // `=\{`-style is fine; a bare `={` right after `=` is usually a lost `\{`.
  if (/=\s*\{[^}]*,[^}]*\}/.test(tex) && !/=\s*\\\{/.test(tex)) {
    issues.push("possible-invisible-braces-after-eq");
  }

  // Leftover markdown-emphasis artifacts inside math (`\Theta*{t}` should be
  // `\Theta_{t}`). An asterisk used as a superscript or subscript — `X^{*}`,
  // `\Sigma^*`, `\delta^{*}` — is ordinary TeX and must not be flagged; doing
  // so produced four false positives on the first article that used it.
  const tokenMath = maskTextCommandPayloads(tex);
  const emphasisArtifact = tokenMath.replace(
    /[\^_]\s*\{?\s*\*\s*\}?/g,
    "",
  );
  if (/(?<![\\\w])\*(?![*\s])/.test(emphasisArtifact)) issues.push("stray-asterisk");

  // A computed value may not follow another numeric expression without a
  // relation. This catches the silent `4096^2 16{,}777{,}216` rendering caused
  // by a lost equality separator while allowing explicit multiplication.
  if (/(?:\d|\})\s+\d{1,3}\{,\}\d{3}/.test(tokenMath)) {
    issues.push("adjacent-numeric-result");
  }

  // Literal row-break spacing that lost its backslashes.
  if (/(?<!\\)\[[0-9]+(mm|ex|pt|em)\]/.test(tex)) issues.push("literal-dimen");

  // \left / \right must pair. The lookahead keeps `\leftarrow` / `\rightarrow`
  // (and friends) from being counted as delimiters.
  const l = (tex.match(/\\left(?![a-zA-Z])/g) || []).length;
  const r = (tex.match(/\\right(?![a-zA-Z])/g) || []).length;
  if (l !== r) issues.push(`left-right-mismatch(${l}/${r})`);

  // An alignment env with `&` but no `\\` is a collapsed multi-row equation.
  if (/\\begin\{(aligned|align|cases|array)\}/.test(tex)) {
    const amp = (tex.match(/(?<!\\)&/g) || []).length;
    const rows = (tex.match(/\\\\/g) || []).length;
    if (amp >= 2 && rows === 0) issues.push("alignment-env-without-row-breaks");
  }

  // A lone trailing backslash is a row break that never got restored.
  if (/(?<!\\)\\\s*$/.test(tex)) issues.push("trailing-single-backslash");

  return issues;
}

/**
 * Every exported page that contains rendered mathematics, found by walking the
 * whole export.
 *
 * This previously read a single hard-coded directory (`out/models`), so it
 * verified two articles and silently ignored every other section — 1,009
 * equations across four articles, including any newly added post, were never
 * checked. A gate that only inspects part of the corpus reports success it has
 * not earned, so discovery is now driven by the export itself and a new
 * article is covered the moment it is built.
 */
function findPages(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) findPages(full, acc);
    else if (entry.name === "index.html") acc.push(full);
  }
  return acc;
}

const files = findPages(OUT)
  .map((file) => {
    const slug = path.relative(OUT, file).split(path.sep).slice(0, -1).join("/") || "/";
    return [slug, file];
  })
  // Only pages that actually rendered maths are interesting here.
  .filter(([, file]) => fs.readFileSync(file, "utf8").includes("katex-mathml"))
  .sort(([a], [b]) => a.localeCompare(b, "en"));

if (!fs.existsSync(OUT)) {
  console.error("No export found in ./out — run `npm run build` first.");
  process.exit(1);
}

if (files.length === 0) {
  console.log("No pages with rendered mathematics found — nothing to verify.");
}

let totalEq = 0;
let totalErr = 0;
let totalWarn = 0;
let totalLint = 0;
let totalFallback = 0;

for (const [slug, file] of files) {
  const html = fs.readFileSync(file, "utf8");
  const anns = [...html.matchAll(/<annotation encoding="application\/x-tex">([\s\S]*?)<\/annotation>/g)].map(
    (m) => decode(m[1]),
  );
  /**
   * Equations KaTeX could not render, which the page shows as raw source
   * (plan §11.4). The reader sees TeX, so this is a defect — and the author
   * needs to know *which* equation, not just that there were N of them. The
   * `title` attribute carries KaTeX's own diagnosis.
   */
  const fallbackDetails = [...html.matchAll(/class="katex-error"[^>]*title="([^"]*)"/g)].map((m) =>
    decode(m[1]),
  );
  const fallbacks = (html.match(/class="katex-error"/g) || []).length;

  const errors = [];
  const warnings = [];
  const lints = [];

  for (const tex of anns) {
    const warns = [];
    try {
      katex.renderToString(tex, {
        displayMode: true,
        throwOnError: true,
        strict: (code, msg) => {
          warns.push(`${code}: ${msg}`);
          return "ignore";
        },
      });
    } catch (e) {
      errors.push({ tex, msg: e.message });
    }
    if (warns.length) warnings.push({ tex, warns });
    const issues = lint(tex);
    if (issues.length) lints.push({ tex, issues });
  }

  totalEq += anns.length;
  totalErr += errors.length;
  totalWarn += warnings.length;
  totalLint += lints.length;
  totalFallback += fallbacks;

  console.log(`\n===== ${slug} =====`);
  console.log(`equations: ${anns.length} | strict errors: ${errors.length} | strict warnings: ${warnings.length} | lint hits: ${lints.length} | source-fallbacks: ${fallbacks}`);
  for (const detail of fallbackDetails) {
    console.log(`  ✖ SOURCE-FALLBACK (reader sees raw TeX): ${detail.slice(0, 180)}`);
  }

  for (const e of errors.slice(0, 5)) {
    console.log(`  ✖ ERROR ${e.msg}`);
    console.log(`     ${e.tex.replace(/\s+/g, " ").slice(0, 150)}`);
  }
  const lintCounts = {};
  for (const l of lints) for (const i of l.issues) lintCounts[i] = (lintCounts[i] || 0) + 1;
  for (const [k, v] of Object.entries(lintCounts)) console.log(`  ⚠ lint ${k}: ${v}`);
  for (const l of lints.slice(0, 4)) {
    console.log(`     [${l.issues.join(",")}] ${l.tex.replace(/\s+/g, " ").slice(0, 130)}`);
  }
  const warnCounts = {};
  for (const w of warnings) for (const s of w.warns) warnCounts[s.split(":")[0]] = (warnCounts[s.split(":")[0]] || 0) + 1;
  for (const [k, v] of Object.entries(warnCounts)) console.log(`  ⚠ katex-strict ${k}: ${v}`);
}

/* ---------------------------------------------------------------------------
 * Render safety.
 *
 * Valid TeX is necessary but NOT sufficient — maths can be perfectly correct
 * and still paint wrong. These checks cover the ways that has actually happened:
 * CSS containment clipping equations, missing KaTeX stylesheet/fonts, and
 * equations that produced no visual layer.
 * ------------------------------------------------------------------------ */
const renderIssues = [];
const cssDir = path.join(process.cwd(), "out", "_next", "static", "css");
const css = fs.existsSync(cssDir)
  ? fs.readdirSync(cssDir).filter((f) => f.endsWith(".css")).map((f) => fs.readFileSync(path.join(cssDir, f), "utf8")).join("\n")
  : "";

// 1. CSS containment must never apply to maths, tables or code blocks — it
//    forces a placeholder height and clips/overlaps tall content.
for (const sel of ["katex", "table-scroll", "code-block"]) {
  const rule = new RegExp(`\\.[^{}]*${sel}[^{}]*\\{[^}]*(content-visibility|contain\\s*:)[^}]*\\}`, "g");
  const hits = css.match(rule);
  if (hits) renderIssues.push(`CSS containment applied to .${sel} (${hits.length} rule(s)) — clips tall content`);
}

// 2. The KaTeX stylesheet and its webfonts must actually ship.
if (!/@font-face[^}]*KaTeX/i.test(css)) renderIssues.push("KaTeX @font-face rules missing from shipped CSS");
const fontCount = (() => {
  let n = 0;
  const walkFonts = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walkFonts(p);
      else if (/KaTeX_.*\.(woff2|woff|ttf)$/i.test(e.name)) n++;
    }
  };
  try { walkFonts(path.join(process.cwd(), "out")); } catch { /* ignore */ }
  return n;
})();
if (fontCount === 0) renderIssues.push("No KaTeX webfont files in output — maths will render garbled");

// 3. Every rendered equation needs a visual layer (.katex-html), not just MathML.
for (const [slug, file] of files) {
  const html = fs.readFileSync(file, "utf8");
  const mathml = (html.match(/class="katex-mathml"/g) || []).length;
  const visual = (html.match(/class="katex-html"/g) || []).length;
  if (mathml > 0 && visual < mathml) {
    renderIssues.push(`${slug}: ${mathml - visual} equation(s) have MathML but no visual layer`);
  }
}

/* ---------------------------------------------------------------------------
 * Mathematics that never became mathematics.
 *
 * Every check above starts from what KaTeX *rendered* — the annotations it
 * emitted, the errors it reported. An equation the preprocessor never
 * recognised produces neither: no annotation, no `katex-error`, nothing to
 * count. It is simply published to the page as raw TeX, and the harness reports
 * a clean run while the reader looks at `\left(s_k,p_k,o_k` in the middle of a
 * paragraph. That is the failure mode this gate was blindest to, and the one
 * that kept recurring.
 *
 * So the finished page is read the way a reader sees it. Rendered maths — both
 * the MathML and the `.katex-html` glyph layer — contains no backslashes, so a
 * TeX control sequence surviving in visible text means an equation was missed.
 * Source-copy annotations, scripts and code samples are excluded; every page is
 * scanned, including ones with no rendered maths at all, because a document
 * whose maths failed *entirely* has no `katex-mathml` to select it.
 * ------------------------------------------------------------------------ */
const TEX_COMMAND =
  /\\(?:frac|sum|prod|int|mathbb|mathcal|mathrm|mathbf|operatorname|left|right|alpha|beta|gamma|delta|theta|epsilon|sigma|lambda|nabla|cdot|times|leq|geq|neq|approx|propto|text|displaystyle|begin|end|tag|boxed|hat|tilde|vec|quad|mid|vert|in|forall|exists)\b/g;

const unrendered = [];
for (const file of findPages(OUT)) {
  let h = fs.readFileSync(file, "utf8");
  h = h.replace(/<annotation[\s\S]*?<\/annotation>/g, " "); // KaTeX's own source copy
  h = h.replace(/<script[\s\S]*?<\/script>/g, " "); // RSC payload restates the page
  h = h.replace(/<code[\s\S]*?<\/code>/g, " ").replace(/<pre[\s\S]*?<\/pre>/g, " ");
  const text = h.replace(/<[^>]+>/g, " ");
  const hits = [...text.matchAll(TEX_COMMAND)];
  if (hits.length === 0) continue;
  const slug = path.relative(OUT, file).split(path.sep).slice(0, -1).join("/") || "/";
  unrendered.push({
    slug,
    count: hits.length,
    sample: text.slice(Math.max(0, hits[0].index - 40), hits[0].index + 110).replace(/\s+/g, " "),
  });
}

console.log(`\n----- unrendered mathematics -----`);
if (unrendered.length === 0) console.log("no raw TeX in visible text");
else
  for (const u of unrendered) {
    console.log(`  ✖ ${u.slug}: ${u.count} TeX command(s) published as prose`);
    console.log(`     …${u.sample}…`);
  }

console.log(`\n----- render safety -----`);
console.log(`KaTeX webfonts shipped: ${fontCount}`);
if (renderIssues.length === 0) console.log("no render-safety issues");
else for (const r of renderIssues) console.log(`  ✖ ${r}`);

const totalUnrendered = unrendered.reduce((n, u) => n + u.count, 0);

console.log(`\nTOTAL: ${totalEq} equations | ${totalErr} errors | ${totalWarn} with strict warnings | ${totalLint} with lint hits | ${totalFallback} source-fallbacks | ${totalUnrendered} unrendered | ${renderIssues.length} render-safety issues`);

// Gate the build (plan §27). Equations that render *silently wrong* are the
// failure mode this corpus actually has, so lint hits fail too — not just
// hard parse errors. Pass --warn-only to report without failing.
const warnOnly = process.argv.includes("--warn-only");
if (!warnOnly && (totalErr > 0 || totalLint > 0 || totalFallback > 0 || totalUnrendered > 0 || renderIssues.length > 0)) {
  console.error(`\n✖ Math verification failed: ${totalErr} error(s), ${totalLint} lint hit(s), ${totalFallback} source-fallback(s), ${totalUnrendered} unrendered equation(s), ${renderIssues.length} render-safety issue(s).`);
  process.exit(1);
}
console.log("✓ Math verification passed.");
