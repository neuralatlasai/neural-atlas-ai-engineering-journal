/**
 * Build-time image pipeline (plan §15.2, §21.1).
 *
 * Walks the corpus for co-located assets and emits responsive AVIF/WebP
 * variants plus a compressed fallback, recording intrinsic dimensions in a
 * manifest so the renderer can ship correct `width`/`height` (no CLS) and a
 * `srcset` (no oversized LCP image). Never upscales beyond the original.
 *
 * Runs before `dev` and `build`; output is deterministic for identical input.
 *
 * Encoding is content-addressed and incremental. The previous version deleted
 * its output directory and re-encoded every asset on every run, which cost ~55
 * seconds on each `npm run dev` and each `npm run build` even when no image had
 * changed — roughly half of total build time. Each manifest entry now records
 * the source hash and the pipeline version, and an asset is re-encoded only
 * when one of those changes or an expected output file is missing. Stale files
 * are pruned afterwards, so repeated runs remain deterministic.
 *
 * Pass `--force` to ignore the cache and re-encode everything.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import os from "node:os";
import sharp from "sharp";

const ROOT = process.cwd();
const DOCS = path.join(ROOT, "docs");
const OUT_DIR = path.join(ROOT, "public", "content-assets");
const MANIFEST = path.join(ROOT, "build", "image-manifest.json");
const RASTER = /\.(png|jpe?g)$/i;
const PASSTHROUGH = /\.(svg|avif|webp|gif)$/i;
const WIDTHS = [640, 960, 1280, 1600];

/**
 * Bump when the encoding settings below change (formats, widths, quality,
 * effort, naming). A cached entry recorded under an older version is treated as
 * stale, so changing a quality setting cannot silently leave old output behind.
 */
const PIPELINE_VERSION = 1;

const FORCE = process.argv.includes("--force");

/** Encode a handful of images at once; sharp already threads within one image. */
const CONCURRENCY = Math.max(1, Math.min(4, os.cpus().length));

function walk(dir, acc = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  entries.sort((a, b) => a.name.localeCompare(b.name, "en"));
  for (const e of entries) {
    if (e.name.startsWith(".")) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, acc);
    else if (RASTER.test(e.name) || PASSTHROUGH.test(e.name)) acc.push(full);
  }
  return acc;
}

function slugSegment(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Stable, readable output dir derived from the asset's location in the corpus. */
function outSubdir(absImage) {
  const rel = path.relative(DOCS, path.dirname(absImage));
  return rel.split(path.sep).filter(Boolean).map(slugSegment).join("/");
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

/** Every public path an entry refers to, used for freshness checks and pruning. */
function entryPaths(entry) {
  return [entry.fallback, ...entry.avif.map((v) => v.src), ...entry.webp.map((v) => v.src)];
}

function publicPathToDisk(publicPath) {
  return path.join(ROOT, "public", publicPath.replace(/^\//, ""));
}

/**
 * Output basenames are slugified: source files may contain spaces, parentheses
 * or unicode (e.g. `GQA_ (2).png`), which produce URLs browsers cannot fetch
 * unless escaped. Slugifying once here keeps every emitted URL safe.
 *
 * Names are assigned in a single deterministic pass *before* any encoding, so
 * the collision suffixes do not depend on the order work happens to finish in.
 */
function planOutputs(images) {
  const usedNames = new Map();
  return images.map((abs) => {
    const sub = outSubdir(abs);
    const raw = path.basename(abs, path.extname(abs));
    let slug = slugSegment(raw) || "image";
    const key = `${sub}/${slug}`;
    const seen = usedNames.get(key) ?? 0;
    usedNames.set(key, seen + 1);
    if (seen > 0) slug = `${slug}-${seen + 1}`;
    return {
      abs,
      sub,
      base: slug,
      relKey: path.relative(ROOT, abs).split(path.sep).join("/"),
      destDir: path.join(OUT_DIR, sub),
    };
  });
}

async function encode({ abs, sub, base, destDir }) {
  fs.mkdirSync(destDir, { recursive: true });

  // Vector and already-modern formats are copied through untouched.
  if (PASSTHROUGH.test(abs)) {
    const name = `${base}${path.extname(abs).toLowerCase()}`;
    fs.copyFileSync(abs, path.join(destDir, name));
    let width = null;
    let height = null;
    try {
      const m = await sharp(abs).metadata();
      width = m.width ?? null;
      height = m.height ?? null;
    } catch {
      /* SVG without intrinsic size */
    }
    return { fallback: `/content-assets/${sub}/${name}`, width, height, avif: [], webp: [] };
  }

  const meta = await sharp(abs, { failOn: "none" }).metadata();
  const intrinsicW = meta.width ?? 0;
  const intrinsicH = meta.height ?? 0;
  if (!intrinsicW || !intrinsicH) return null;

  // Never enlarge a low-resolution original (plan §15.2).
  const widths = WIDTHS.filter((w) => w <= intrinsicW);
  if (widths.length === 0) widths.push(intrinsicW);

  const avif = [];
  const webp = [];
  for (const w of widths) {
    const avifName = `${base}-${w}.avif`;
    const webpName = `${base}-${w}.webp`;
    await sharp(abs).resize({ width: w }).avif({ quality: 55, effort: 4 }).toFile(path.join(destDir, avifName));
    await sharp(abs).resize({ width: w }).webp({ quality: 78 }).toFile(path.join(destDir, webpName));
    avif.push({ w, src: `/content-assets/${sub}/${avifName}` });
    webp.push({ w, src: `/content-assets/${sub}/${webpName}` });
  }

  // Compressed fallback in the original family, capped to the largest variant.
  const fbW = widths[widths.length - 1];
  const isPng = /\.png$/i.test(abs);
  const fbName = `${base}-${fbW}.${isPng ? "png" : "jpg"}`;
  const pipeline = sharp(abs).resize({ width: fbW });
  await (isPng
    ? pipeline.png({ compressionLevel: 9, palette: true })
    : pipeline.jpeg({ quality: 80, mozjpeg: true })
  ).toFile(path.join(destDir, fbName));

  return {
    fallback: `/content-assets/${sub}/${fbName}`,
    width: intrinsicW,
    height: intrinsicH,
    avif,
    webp,
  };
}

/** Run `worker` over `items` with bounded concurrency, preserving input order. */
async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (;;) {
      const index = next++;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}

let previous = {};
if (!FORCE) {
  try {
    previous = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  } catch {
    previous = {};
  }
}

const planned = planOutputs(walk(DOCS));
const manifest = {};
let reused = 0;
let encoded = 0;

const outcomes = await mapWithConcurrency(planned, CONCURRENCY, async (item) => {
  const hash = sha256(item.abs);
  const cached = previous[item.relKey];
  const isFresh =
    cached &&
    cached.sourceHash === hash &&
    cached.pipelineVersion === PIPELINE_VERSION &&
    entryPaths(cached).every((p) => fs.existsSync(publicPathToDisk(p)));

  if (isFresh) return { item, entry: cached, hash, reused: true };

  try {
    const entry = await encode(item);
    return entry ? { item, entry, hash, reused: false } : null;
  } catch (err) {
    console.warn(`  ! skipped ${path.relative(ROOT, item.abs)}: ${err.message}`);
    return null;
  }
});

for (const outcome of outcomes) {
  if (!outcome) continue;
  manifest[outcome.item.relKey] = {
    ...outcome.entry,
    sourceHash: outcome.hash,
    pipelineVersion: PIPELINE_VERSION,
  };
  if (outcome.reused) reused++;
  else encoded++;
}

// Prune anything the manifest no longer references, so a removed or renamed
// source cannot leave orphaned files behind and repeated runs stay identical.
const keep = new Set(
  Object.values(manifest).flatMap((entry) => entryPaths(entry).map(publicPathToDisk)),
);
let pruned = 0;
function prune(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      prune(full);
      if (fs.readdirSync(full).length === 0) fs.rmdirSync(full);
    } else if (!keep.has(full)) {
      fs.rmSync(full);
      pruned++;
    }
  }
}
prune(OUT_DIR);

let bytesBefore = 0;
let bytesAfter = 0;
for (const [relKey, entry] of Object.entries(manifest)) {
  bytesBefore += fs.statSync(path.join(ROOT, relKey)).size;
  const smallestAvif = entry.avif[0];
  if (smallestAvif) {
    const p = publicPathToDisk(smallestAvif.src);
    if (fs.existsSync(p)) bytesAfter += fs.statSync(p).size;
  }
}

fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
// Sorted keys keep the manifest byte-identical across runs (plan §3.2).
const ordered = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b, "en")));
const manifestTemporary = `${MANIFEST}.${process.pid}.tmp`;
try {
  // Readers must observe either the complete previous manifest or the complete
  // replacement. Writing the destination in place exposes a zero-length or
  // partial JSON document to a live development server.
  fs.writeFileSync(manifestTemporary, JSON.stringify(ordered, null, 2) + "\n", "utf8");
  fs.renameSync(manifestTemporary, MANIFEST);
} finally {
  fs.rmSync(manifestTemporary, { force: true });
}

console.log(`image pipeline: ${planned.length} source image(s)`);
console.log(`  encoded: ${encoded} | reused from cache: ${reused} | pruned: ${pruned}`);
console.log(`  original total: ${(bytesBefore / 1024).toFixed(0)} KB`);
console.log(`  smallest AVIF total: ${(bytesAfter / 1024).toFixed(0)} KB`);
console.log(`  manifest: ${path.relative(ROOT, MANIFEST)}`);
