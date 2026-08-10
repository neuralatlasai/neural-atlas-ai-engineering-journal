/**
 * Corpus discovery, metadata, and routing (plan §4, §6.2, §18.4).
 *
 * Recursively discovers Markdown under the configured content roots, derives
 * effective metadata while preserving authored front matter, and compiles
 * deterministic, collision-checked routes. Discovery order is lexical so
 * repeated builds are identical (plan §3.2).
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import matter from "gray-matter";
import { countProseWords, estimateReadingMinutes } from "./reading";
import { extractLede } from "./lede";
import { titleLabel } from "./tex-text";
import { basePath, withBasePath } from "../site";

const REPO_ROOT = process.cwd();

/**
 * Content roots (plan §4.1: "one or more configurable content roots").
 *
 * Configurable so the discovery rules can be exercised against fixture corpora
 * in tests — the behaviour that matters here is how *arbitrary* author input is
 * handled, which cannot be proven against the one corpus that happens to live
 * in `docs/`.
 */
const CONTENT_ROOTS: string[] = (process.env.NEURAL_ATLAS_CONTENT_ROOTS ?? "docs")
  .split(path.delimiter)
  .map((entry) => entry.trim())
  .filter(Boolean)
  .map((entry) => (path.isAbsolute(entry) ? entry : path.join(REPO_ROOT, entry)));

const MD_EXTENSIONS = new Set([".md", ".mdx"]);

/**
 * Non-fatal problems found while reading the corpus.
 *
 * A single malformed document must not take the whole site down, but it must
 * not vanish silently either (plan §3.4, §25.2). Diagnostics are collected here
 * and surfaced by `getCorpusDiagnostics()`.
 */
export interface CorpusDiagnostic {
  file: string;
  code: "unreadable-source" | "invalid-front-matter" | "empty-document" | "unusable-slug";
  message: string;
}

const diagnostics: CorpusDiagnostic[] = [];

export function getCorpusDiagnostics(): readonly CorpusDiagnostic[] {
  getAllArticles(); // ensure discovery has run
  return diagnostics;
}

export type ArticleType =
  | "research-explainer"
  | "engineering-deep-dive"
  | "model-report"
  | "benchmark-report"
  | "system-design"
  | "survey"
  | "release-note";

export interface HeroImage {
  src: string;
  alt: string;
  width: number | null;
  height: number | null;
  avif: { w: number; src: string }[];
  webp: { w: number; src: string }[];
}

export interface ArticleMeta {
  documentId: string; // stable id = POSIX relative path from repo root
  sourcePath: string; // absolute path on disk
  route: string; // e.g. /models/glm-5-2
  routeSegments: string[]; // e.g. ["models", "glm-5-2"]
  /** URL-safe source-directory path used by the recursive library browser. */
  folderSegments: string[]; // e.g. ["models", "glm-5-2"]
  /** Human-readable counterpart of `folderSegments`, preserving authored names. */
  folderLabels: string[]; // e.g. ["Models", "GLM 5.2"]
  section: string; // slug, e.g. "models"
  sectionLabel: string; // e.g. "Models"
  title: string;
  description: string;
  articleType: ArticleType;
  displayDate: string | null;
  topics: string[];
  hero: HeroImage | null;
  /** Prose words, excluding code, math, tables, and markup. */
  wordCountEstimate: number;
  /** Derived from `wordCountEstimate`; shown identically on every surface. */
  readingMinutes: number;
}

/**
 * Short, stable, URL-safe hash — used to disambiguate documents whose file
 * names cannot produce a distinct slug. Derived from the document's path, so it
 * is identical on every build (plan §3.2).
 */
function contentHash(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex").slice(0, 8);
}

/** Human-readable label for an article type, e.g. `model-report` → `Model Report`. */
export function formatArticleType(type: ArticleType): string {
  return type
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function slugify(input: string): string {
  return input
    .normalize("NFKD")
    // strip combining diacritical marks (U+0300–U+036F)
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function titleCase(slug: string): string {
  return slug.replace(/(^|-)([a-z])/g, (_, sep, ch) => (sep ? " " : "") + ch.toUpperCase()).trim();
}

function folderLabel(name: string): string {
  const words = name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ");

  return words
    .map((word) => {
      const normalized = word.toLowerCase();
      if (normalized === "deepseek") return "DeepSeek";
      if (normalized === "ffn") return "FFN";
      if (normalized === "gml") return "GLM";
      if (normalized === "moe") return "MoE";
      if (normalized === "train") return "Model training";

      const glmVersion = /^glm(\d+(?:\.\d+)*)$/i.exec(word);
      if (glmVersion) return `GLM-${glmVersion[1]}`;
      if (/^[A-Z0-9.]+$/.test(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function walk(dir: string, acc: string[]): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  // Lexical ordering for deterministic discovery (plan §4.1).
  entries.sort((a, b) => a.name.localeCompare(b.name, "en"));
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "assets") continue;
      walk(full, acc);
    } else if (MD_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      acc.push(full);
    }
  }
}

/**
 * Title derived from the document's first `#` heading.
 *
 * A leading section number is stripped: the corpus contains documents that open
 * at `# 1. Source-locked GLM-5.2 dimensions`, and "1." is an artefact of the
 * heading's position in the document, not part of the work's name. An authored
 * `title:` in front matter always wins over this (plan §4.4).
 */
function firstHeading(body: string): string | null {
  const match = body.match(/^\s{0,3}#\s+(.+?)\s*$/m);
  if (!match) return null;
  const raw = match[1]
    .replace(/\s*#*\s*$/, "")
    .replace(/^\s*\d+(?:\.\d+)*[.)]\s+/, "")
    .trim();

  // A damaged display-math opener such as `# [` is structural, not a title.
  // Do not scan subsequent source headings: lossy equations can contain lines
  // beginning with `#`, so the deterministic filename fallback is the only
  // metadata source that cannot mistake equation content for authored prose.
  return titleLabel(raw) || null;
}

function extractDate(body: string): string | null {
  const m =
    body.match(/^\*\*Release date:\*\*\s*(.+?)\s*$/m) ||
    body.match(/^\*\*Analysis cutoff:\*\*\s*(.+?)\s*$/m) ||
    body.match(/publishedAt:\s*["']?([\d-]+)/);
  return m ? m[1].trim() : null;
}

function inferType(section: string): ArticleType {
  if (section === "models") return "model-report";
  if (section === "engineering") return "engineering-deep-dive";
  if (section === "reports") return "benchmark-report";
  return "research-explainer";
}

/** Responsive variants produced by `scripts/optimize-images.mjs` (plan §15.2). */
interface ImageVariants {
  fallback: string;
  width: number | null;
  height: number | null;
  avif: { w: number; src: string }[];
  webp: { w: number; src: string }[];
}

let imageManifest: Record<string, ImageVariants> | null = null;
function getImageManifest(): Record<string, ImageVariants> {
  if (imageManifest) return imageManifest;
  try {
    const raw = JSON.parse(
      fs.readFileSync(path.join(REPO_ROOT, "build", "image-manifest.json"), "utf8"),
    ) as Record<string, ImageVariants>;
    imageManifest = withDeploymentBasePath(raw);
  } catch {
    imageManifest = {};
  }
  return imageManifest;
}

/**
 * Rewrite manifest URLs onto the deployment's base path.
 *
 * These URLs end up in raw `<img src>` and `<source srcset>` attributes emitted
 * by the content compiler, not in a `next/image` or `next/link`, so Next's
 * `basePath` never touches them. Served from a project-repository GitHub Pages
 * URL, an unprefixed `/content-assets/…` resolves against the domain root and
 * every figure in the corpus 404s.
 *
 * Applied here, at the single point the manifest is read, so body images and
 * the hero — and anything added later — are covered by construction rather
 * than by each consumer remembering to do it. A no-op when the site is served
 * from a domain root.
 */
function withDeploymentBasePath(
  manifest: Record<string, ImageVariants>,
): Record<string, ImageVariants> {
  if (!basePath) return manifest;
  const mapVariants = (list: { w: number; src: string }[]) =>
    list.map((v) => ({ ...v, src: withBasePath(v.src) }));
  return Object.fromEntries(
    Object.entries(manifest).map(([key, v]) => [
      key,
      { ...v, fallback: withBasePath(v.fallback), avif: mapVariants(v.avif), webp: mapVariants(v.webp) },
    ]),
  );
}

/** Names that mark an image as the document's lead figure. */
const LEAD_FIGURE = /(overview|architecture|hero|diagram)/i;

function toHero(variants: ImageVariants | undefined, title: string): HeroImage | null {
  if (!variants) return null;
  return {
    src: variants.fallback,
    alt: `Overview figure for ${title}`,
    width: variants.width,
    height: variants.height,
    avif: variants.avif,
    webp: variants.webp,
  };
}

/**
 * The article's lead image.
 *
 * Taken from the figures the document itself references. The previous rule
 * scanned the *folder* and picked one image for everything in it, so two
 * articles sharing a directory were given the same hero — and an article with
 * no figures of its own was given a sibling's. Four of the ten articles were
 * showing another document's diagram: `Vortral.md` references no images at all
 * yet displayed `Voxtral_Realtime1.png`, which belongs to the article beside it.
 *
 * Folder-wide selection survives only where it cannot borrow: a document alone
 * in its directory, where an unreferenced `assets/model_overview.png` is
 * unambiguously that article's own figure.
 */
function resolveHero(
  sourcePath: string,
  title: string,
  content: string,
  articlesInFolder: number,
): HeroImage | null {
  const referenced = [...content.matchAll(/!\[[^\]]*\]\(\s*([^)\s]+)/g)].map((m) => m[1]);
  if (referenced.length > 0) {
    const resolve = assetResolverFor(sourcePath);
    const lead = referenced.find((src) => LEAD_FIGURE.test(src)) ?? referenced[0];
    // The body resolver already yields hero-shaped variants; it only leaves the
    // alt text empty, because a body figure carries its own caption.
    const resolved = resolve(lead);
    if (resolved) return { ...resolved, alt: `Overview figure for ${title}` };
  }

  // Nothing referenced. Only safe to fall back when no sibling could own it.
  if (articlesInFolder > 1) return null;

  const assetsDir = path.join(path.dirname(sourcePath), "assets");
  if (!fs.existsSync(assetsDir)) return null;
  const candidates = fs
    .readdirSync(assetsDir)
    .filter((f) => /\.(png|jpe?g|avif|webp|svg)$/i.test(f))
    .sort((a, b) => a.localeCompare(b));
  const preferred = candidates.find((f) => LEAD_FIGURE.test(f)) || candidates[0];
  if (!preferred) return null;

  const key = path
    .relative(REPO_ROOT, path.join(assetsDir, preferred))
    .split(path.sep)
    .join("/");
  return toHero(getImageManifest()[key], title);
}

/**
 * Resolve a document-relative image reference (`./assets/foo.png`) to its
 * optimized, publicly-served variants. Body images are authored relative to the
 * Markdown file, which does not survive routing — without this they 404.
 */
/**
 * Memoized per source path so repeated calls return the *same* function.
 *
 * The compiler keys its memo partly on resolver identity. Handing it a fresh
 * closure on every render made every lookup a miss, so an article was fully
 * recompiled — parse, KaTeX, highlight — on each request.
 */
const assetResolvers = new Map<string, (relativeSrc: string) => HeroImage | null>();

export function assetResolverFor(sourcePath: string) {
  const existing = assetResolvers.get(sourcePath);
  if (existing) return existing;
  const resolver = createAssetResolver(sourcePath);
  assetResolvers.set(sourcePath, resolver);
  return resolver;
}

function createAssetResolver(sourcePath: string) {
  const dir = path.dirname(sourcePath);
  return (relativeSrc: string): HeroImage | null => {
    const cleaned = relativeSrc.split("#")[0].split("?")[0];
    let decoded = cleaned;
    try {
      decoded = decodeURIComponent(cleaned);
    } catch {
      /* malformed escape — use as-is */
    }
    const abs = path.resolve(dir, decoded);
    const key = path.relative(REPO_ROOT, abs).split(path.sep).join("/");
    const v = getImageManifest()[key];
    if (!v) return null;
    return { src: v.fallback, alt: "", width: v.width, height: v.height, avif: v.avif, webp: v.webp };
  };
}

let cache: ArticleMeta[] | null = null;
let cacheSignature = "";

/**
 * Identity of the corpus on disk: every discovered path and its modification
 * time. Cheap — a directory walk and a `stat` per file.
 */
function signatureOf(files: string[]): string {
  return files
    .map((file) => {
      try {
        return `${file}:${fs.statSync(file).mtimeMs}`;
      } catch {
        return `${file}:missing`;
      }
    })
    .join("|");
}

function owningContentRoot(sourcePath: string): string {
  return (
    CONTENT_ROOTS.find((root) => {
      const relative = path.relative(root, sourcePath);
      return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
    }) ?? CONTENT_ROOTS[0]
  );
}

function sourceFolderParts(sourcePath: string): string[] {
  const relative = path.relative(owningContentRoot(sourcePath), sourcePath);
  const directories = relative.split(path.sep).slice(0, -1).filter(Boolean);
  return directories.length > 0 ? directories : ["Articles"];
}

function sourceFolderKey(parts: readonly string[]): string {
  return parts.join("\u0000");
}

/**
 * Resolve every authored directory to one stable URL path.
 *
 * Slugs are allocated parent-first and in lexical order. Most directories keep
 * their readable name. Only siblings whose names normalize to the same slug get
 * a path-derived suffix, so arbitrary Unicode and punctuation cannot merge two
 * distinct folders or make a build nondeterministic.
 */
function buildFolderSegmentMap(files: readonly string[]): Map<string, string[]> {
  const sourcePaths = new Map<string, string[]>();
  for (const file of files) {
    const parts = sourceFolderParts(file);
    for (let depth = 1; depth <= parts.length; depth++) {
      const prefix = parts.slice(0, depth);
      sourcePaths.set(sourceFolderKey(prefix), prefix);
    }
  }

  const ordered = [...sourcePaths.values()].sort(
    (a, b) =>
      a.length - b.length ||
      sourceFolderKey(a).localeCompare(sourceFolderKey(b), "en"),
  );
  const resolved = new Map<string, string[]>();
  const claimed = new Map<string, string>();

  for (const sourceParts of ordered) {
    const sourceKey = sourceFolderKey(sourceParts);
    const parentSourceKey = sourceFolderKey(sourceParts.slice(0, -1));
    const parentSegments = resolved.get(parentSourceKey) ?? [];
    const base = slugify(sourceParts.at(-1) ?? "") || "collection";
    let segment = base;
    let attempt = 0;
    let candidateKey = [...parentSegments, segment].join("/");

    while (claimed.has(candidateKey) && claimed.get(candidateKey) !== sourceKey) {
      segment = `${base}-${contentHash(`${sourceKey}:${attempt}`)}`;
      candidateKey = [...parentSegments, segment].join("/");
      attempt++;
    }

    const routeSegments = [...parentSegments, segment];
    claimed.set(candidateKey, sourceKey);
    resolved.set(sourceKey, routeSegments);
  }

  return resolved;
}

export function getAllArticles(): ArticleMeta[] {
  // A production corpus is immutable for the lifetime of the build process.
  // Return before even walking the tree: static generation calls this from
  // every route, and repeating directory I/O would turn O(A) discovery into
  // O(P · A), where P is the number of generated pages.
  if (cache && process.env.NODE_ENV === "production") return cache;

  const files: string[] = [];
  for (const root of CONTENT_ROOTS) walk(root, files);

  /**
   * A build reads a corpus that cannot change underneath it, so one constant
   * signature is enough and discovery runs once.
   *
   * A dev server is different: the corpus is edited while it runs. Caching for
   * the lifetime of the process meant a file added to a folder that already
   * contained one stayed invisible — the existing article kept serving from the
   * cached list while the new sibling 404'd — until the server was restarted.
   * Keying the cache on modification times makes an edit, addition, or deletion
   * take effect on the next request.
   */
  const signature =
    process.env.NODE_ENV === "production" ? "immutable" : signatureOf(files);
  if (cache && signature === cacheSignature) return cache;

  // Rebuilding from scratch: diagnostics describe this pass only.
  diagnostics.length = 0;

  /**
   * How many documents share each directory. A folder with more than one
   * article cannot supply a hero to a document that references no figures of
   * its own — the image would belong to whichever sibling happens to own it.
   */
  const articlesPerFolder = new Map<string, number>();
  for (const file of files) {
    const dir = path.dirname(file);
    articlesPerFolder.set(dir, (articlesPerFolder.get(dir) ?? 0) + 1);
  }

  const usedRoutes = new Set<string>();
  const articles: ArticleMeta[] = [];
  const folderSegmentMap = buildFolderSegmentMap(files);

  for (const abs of files) {
    const relFromRoot = path.relative(REPO_ROOT, abs).split(path.sep).join("/");

    let raw: string;
    try {
      raw = fs.readFileSync(abs, "utf8");
    } catch (error) {
      diagnostics.push({
        file: relFromRoot,
        code: "unreadable-source",
        message: error instanceof Error ? error.message : String(error),
      });
      continue;
    }

    // Malformed front matter is an authoring mistake in *one* file. Parsing it
    // unguarded threw out of discovery, which took down every page on the site
    // — including the ones that were perfectly fine.
    let content: string;
    let data: Record<string, unknown>;
    try {
      const parsed = matter(raw);
      content = parsed.content;
      data = parsed.data as Record<string, unknown>;
    } catch (error) {
      diagnostics.push({
        file: relFromRoot,
        code: "invalid-front-matter",
        message: error instanceof Error ? error.message : String(error),
      });
      content = raw;
      data = {};
    }

    if (content.trim().length === 0) {
      diagnostics.push({
        file: relFromRoot,
        code: "empty-document",
        message: "no content after front matter; not published",
      });
      continue;
    }

    // Which root this file came from, so multiple roots produce correct
    // section names rather than paths relative to the first root.
    const owningRoot = owningContentRoot(abs);
    const relFromDocs = path.relative(owningRoot, abs).split(path.sep).join("/");
    const parts = relFromDocs.split("/");
    const rawFolderParts = sourceFolderParts(abs);
    const folderSegments =
      folderSegmentMap.get(sourceFolderKey(rawFolderParts)) ?? ["articles"];
    const folderLabels = rawFolderParts.map(folderLabel);
    const section = folderSegments[0];
    const sectionLabel = folderLabels[0] || titleCase(section);

    const baseName = path.basename(abs, path.extname(abs));
    let slugTail = slugify(baseName);
    if (slugTail === "index" || slugTail === "readme") {
      slugTail = slugify(parts[parts.length - 2] || baseName);
    }
    if (!slugTail) {
      // A name made entirely of characters the slug drops (`___.md`, `名前.md`)
      // would otherwise yield `/section/`, colliding with the section index.
      slugTail = `document-${contentHash(relFromRoot)}`;
      diagnostics.push({
        file: relFromRoot,
        code: "unusable-slug",
        message: `file name produced no URL-safe slug; using "${slugTail}"`,
      });
    }

    let routeSegments = [section, slugTail];
    let route = "/" + routeSegments.join("/");
    if (usedRoutes.has(route)) {
      // Collision → disambiguate with the parent folder (plan §6.2, §3.4).
      const parent = slugify(parts[parts.length - 2] || "");
      routeSegments = [section, parent, slugTail].filter(Boolean);
      route = "/" + routeSegments.join("/");
    }
    if (usedRoutes.has(route)) {
      // Last resort: a content-addressed suffix. Two documents that genuinely
      // want the same URL is an authoring problem, but losing one of them
      // silently — or failing the entire build — is worse than publishing both
      // at distinct, stable addresses and reporting it.
      routeSegments = [...routeSegments, contentHash(relFromRoot)];
      route = "/" + routeSegments.join("/");
      diagnostics.push({
        file: relFromRoot,
        code: "unusable-slug",
        message: `route collided with an earlier document; published at ${route}`,
      });
    }
    usedRoutes.add(route);

    const authoredTitle = typeof data.title === "string" ? titleLabel(data.title) : "";
    const title = authoredTitle || firstHeading(content) || titleCase(slugTail);
    const description =
      (typeof data.description === "string" && data.description) ||
      extractLede(content);
    const displayDate =
      (typeof data.publishedAt === "string" && data.publishedAt) || extractDate(content);
    const topics = Array.isArray(data.topics)
      ? data.topics.map((t: unknown) => String(t))
      : [];
    const articleType: ArticleType =
      (typeof data.articleType === "string" && (data.articleType as ArticleType)) ||
      inferType(section);
    const hero = resolveHero(abs, title, content, articlesPerFolder.get(path.dirname(abs)) ?? 1);
    const wordCountEstimate = countProseWords(content);

    articles.push({
      documentId: relFromRoot,
      sourcePath: abs,
      route,
      routeSegments,
      folderSegments,
      folderLabels,
      section,
      sectionLabel,
      title,
      description,
      articleType,
      displayDate,
      topics,
      hero,
      wordCountEstimate,
      readingMinutes: estimateReadingMinutes(wordCountEstimate),
    });
  }

  // Deterministic navigation order (plan §18.4): section, then documentId.
  articles.sort(
    (a, b) =>
      a.section.localeCompare(b.section, "en") ||
      a.documentId.localeCompare(b.documentId, "en"),
  );

  cache = articles;
  cacheSignature = signature;
  return articles;
}

export function getArticleByRoute(routeSegments: string[]): ArticleMeta | null {
  const route = "/" + routeSegments.map((s) => s.toLowerCase()).join("/");
  return getAllArticles().find((a) => a.route === route) ?? null;
}

export interface ContentFolder {
  /** Stable key for maps and React lists; never exposed as a URL. */
  key: string;
  route: string;
  routeSegments: string[];
  labels: string[];
  label: string;
  depth: number;
  parentRoute: string;
  directArticleCount: number;
  articleCount: number;
  readingMinutes: number;
  childFolderCount: number;
}

export interface FolderContents {
  folder: ContentFolder;
  childFolders: readonly ContentFolder[];
  articles: readonly ArticleMeta[];
}

interface MutableFolder extends Omit<ContentFolder, "childFolderCount"> {
  childFolderCount: number;
}

interface FolderIndex {
  source: ArticleMeta[];
  folders: ContentFolder[];
  byKey: Map<string, ContentFolder>;
  childrenByKey: Map<string, ContentFolder[]>;
  articlesByKey: Map<string, ArticleMeta[]>;
}

let folderIndexCache: FolderIndex | null = null;

function folderKey(routeSegments: readonly string[]): string {
  return routeSegments.join("/");
}

function getFolderIndex(): FolderIndex {
  const articles = getAllArticles();
  if (folderIndexCache?.source === articles) return folderIndexCache;

  const mutableByKey = new Map<string, MutableFolder>();
  const articlesByKey = new Map<string, ArticleMeta[]>();

  for (const article of articles) {
    for (let depth = 1; depth <= article.folderSegments.length; depth++) {
      const routeSegments = article.folderSegments.slice(0, depth);
      const labels = article.folderLabels.slice(0, depth);
      const key = folderKey(routeSegments);
      const existing = mutableByKey.get(key);

      if (existing) {
        existing.articleCount++;
        existing.readingMinutes += article.readingMinutes;
      } else {
        mutableByKey.set(key, {
          key,
          route: `/library/${key}`,
          routeSegments,
          labels,
          label: labels.at(-1) ?? titleCase(routeSegments.at(-1) ?? ""),
          depth,
          parentRoute:
            depth === 1
              ? "/library"
              : `/library/${folderKey(routeSegments.slice(0, -1))}`,
          directArticleCount: 0,
          articleCount: 1,
          readingMinutes: article.readingMinutes,
          childFolderCount: 0,
        });
      }
    }

    const directKey = folderKey(article.folderSegments);
    const directFolder = mutableByKey.get(directKey);
    if (directFolder) directFolder.directArticleCount++;
    const directArticles = articlesByKey.get(directKey);
    if (directArticles) directArticles.push(article);
    else articlesByKey.set(directKey, [article]);
  }

  const orderedMutable = [...mutableByKey.values()].sort(
    (a, b) =>
      a.depth - b.depth ||
      a.key.localeCompare(b.key, "en"),
  );
  for (const folder of orderedMutable) {
    if (folder.depth === 1) continue;
    const parentKey = folderKey(folder.routeSegments.slice(0, -1));
    const parent = mutableByKey.get(parentKey);
    if (parent) parent.childFolderCount++;
  }

  const folders: ContentFolder[] = orderedMutable.map((folder) => ({ ...folder }));
  const byKey = new Map(folders.map((folder) => [folder.key, folder]));
  const childrenByKey = new Map<string, ContentFolder[]>();
  for (const folder of folders) {
    const parentKey =
      folder.depth === 1 ? "" : folderKey(folder.routeSegments.slice(0, -1));
    const siblings = childrenByKey.get(parentKey);
    if (siblings) siblings.push(folder);
    else childrenByKey.set(parentKey, [folder]);
  }
  for (const children of childrenByKey.values()) {
    children.sort((a, b) => a.label.localeCompare(b.label, "en"));
  }

  folderIndexCache = { source: articles, folders, byKey, childrenByKey, articlesByKey };
  return folderIndexCache;
}

export function getContentFolders(): readonly ContentFolder[] {
  return getFolderIndex().folders;
}

export function getRootFolders(): readonly ContentFolder[] {
  return getFolderIndex().childrenByKey.get("") ?? [];
}

export function getFolderContents(routeSegments: readonly string[]): FolderContents | null {
  const normalized = routeSegments.map((segment) => segment.toLowerCase());
  const key = folderKey(normalized);
  const index = getFolderIndex();
  const folder = index.byKey.get(key);
  if (!folder) return null;
  return {
    folder,
    childFolders: index.childrenByKey.get(key) ?? [],
    articles: index.articlesByKey.get(key) ?? [],
  };
}

export function getSections(): { section: string; label: string; count: number }[] {
  return getRootFolders().map((folder) => ({
    section: folder.routeSegments[0],
    label: folder.label,
    count: folder.articleCount,
  }));
}

export function getPrevNext(route: string): { prev: ArticleMeta | null; next: ArticleMeta | null } {
  const all = getAllArticles();
  const i = all.findIndex((a) => a.route === route);
  if (i === -1) return { prev: null, next: null };
  return {
    prev: i > 0 ? all[i - 1] : null,
    next: i < all.length - 1 ? all[i + 1] : null,
  };
}

export function readSource(sourcePath: string): string {
  return fs.readFileSync(sourcePath, "utf8");
}

/**
 * URL-safe identifier for an authored topic label. Exported so link builders
 * and `getArticlesByTopic` cannot disagree about what a topic's route is.
 */
export function topicSlug(label: string): string {
  return slugify(label);
}

export interface TopicSummary {
  /** URL-safe identifier used in `/topics/[topic]`. */
  slug: string;
  /** Authored label, preserved as written (plan §4.4). */
  label: string;
  count: number;
}

/**
 * Topics declared in front matter, deduplicated by slug.
 *
 * Topics are never inferred from body text: a derived topic would be presented
 * with the same authority as an authored one while carrying none of the
 * author's judgement. A corpus with no declared topics correctly yields none,
 * and the topics page falls back to a full listing.
 */
export function getTopics(): TopicSummary[] {
  const bySlug = new Map<string, TopicSummary>();
  for (const article of getAllArticles()) {
    for (const label of article.topics) {
      const slug = slugify(label);
      if (!slug) continue;
      const existing = bySlug.get(slug);
      if (existing) existing.count++;
      else bySlug.set(slug, { slug, label, count: 1 });
    }
  }
  return [...bySlug.values()].sort((a, b) => a.label.localeCompare(b.label, "en"));
}

export function getArticlesByTopic(slug: string): ArticleMeta[] {
  const target = slug.toLowerCase();
  return getAllArticles().filter((article) =>
    article.topics.some((topic) => slugify(topic) === target),
  );
}

/** Relative weights for related-article selection. */
const RELATED_WEIGHT = { sharedTopic: 3, sameSection: 2 } as const;

/**
 * Articles a reader is most likely to want next (plan §6.5).
 *
 * Ranked by shared topics, then by shared section, with a deterministic
 * documentId tiebreak so the selection is stable across builds. Returns fewer
 * than `limit` — possibly none — rather than padding with unrelated material.
 */
export function getRelatedArticles(route: string, limit = 3): ArticleMeta[] {
  const all = getAllArticles();
  const current = all.find((article) => article.route === route);
  if (!current) return [];

  const currentTopics = new Set(current.topics.map((topic) => slugify(topic)));

  return all
    .filter((article) => article.route !== route)
    .map((article) => {
      const shared = article.topics.filter((topic) => currentTopics.has(slugify(topic))).length;
      const score =
        shared * RELATED_WEIGHT.sharedTopic +
        (article.section === current.section ? RELATED_WEIGHT.sameSection : 0);
      return { article, score };
    })
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.article.documentId.localeCompare(b.article.documentId, "en"),
    )
    .slice(0, limit)
    .map((entry) => entry.article);
}
