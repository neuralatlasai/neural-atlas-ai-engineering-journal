/**
 * Content compiler (plan §5). Markdown source becomes static HTML with:
 *   - GFM tables, task lists, autolinks, footnotes
 *   - build-time KaTeX (HTML + MathML) — no client math runtime (plan §11.2)
 *   - build-time Shiki highlighting — no client highlighter (plan §13.2)
 *   - deterministic, collision-checked heading IDs (plan §10.3)
 *   - an outline record built from the AST, never DOM scraping (plan §18.2)
 *
 * The compiler imports no Next.js, React, or DOM APIs (plan §2.2): it consumes
 * source and emits typed artifacts through a stable interface.
 */
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import GithubSlugger from "github-slugger";
import rehypeKatex from "rehype-katex";
import rehypeShiki from "@shikijs/rehype";
import { bundledLanguages, type BundledLanguage } from "shiki";
import rehypeStringify from "rehype-stringify";
import { visit, SKIP } from "unist-util-visit";
import { toString as hastToString } from "hast-util-to-string";
import type { Root, Element } from "hast";
import type { Root as MdastRoot } from "mdast";
import katex from "katex";
import { preprocess } from "./preprocess";
import { headingLabel } from "./tex-text";

export interface HeadingRecord {
  id: string;
  text: string;
  depth: 2 | 3;
}

export interface ReferenceRecord {
  id: string;
  url: string;
  title: string;
}

/** Field classes carried into the search index (plan §18.5). */
export type SearchFieldKind = "heading" | "body" | "code" | "caption" | "table";

/**
 * One indexable unit of an article, anchored to the heading it sits under.
 * Emitted by the compiler so the search index and the rendered page are built
 * from the same tree — heading IDs cannot drift between them.
 */
export interface SearchSegment {
  kind: SearchFieldKind;
  /** Nearest preceding heading with an ID; `null` before the first heading. */
  headingId: string | null;
  headingText: string | null;
  text: string;
}

export interface CompiledArticle {
  html: string;
  headings: HeadingRecord[];
  references: ReferenceRecord[];
  searchSegments: SearchSegment[];
  /** Words of readable prose — excludes code, math, and markup. */
  wordCount: number;
  /**
   * Resolved `src` of every image the body renders, in document order.
   *
   * The hero is chosen from the same `assets/` folder the body draws on, so it
   * is regularly the very image the article already shows — and the page then
   * published it twice. Reporting what the body actually rendered lets the
   * caller tell the two cases apart instead of guessing from the filename.
   */
  images: string[];
  diagnostics: { displayBlocks: number; inlineSpans: number };
}

/**
 * Extract Markdown link-reference definitions (`[1]: url "title"`) so they can
 * be rendered as a visible, semantic reference list (plan §10.6). Definitions
 * are invisible in normal Markdown output, so without this the citations would
 * link out but never list their sources.
 */
function extractReferences(source: string): ReferenceRecord[] {
  const refs: ReferenceRecord[] = [];
  const seen = new Set<string>();
  const re = /^\s{0,3}\[([^\]^]+)\]:\s+(\S+)(?:\s+["'(]([^"')]*)["')])?\s*$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    const id = m[1].trim();
    if (seen.has(id)) continue;
    seen.add(id);
    refs.push({ id, url: m[2].trim(), title: (m[3] || "").trim() });
  }
  // Numeric ids first in numeric order, then the rest lexically.
  return refs.sort((a, b) => {
    const na = Number(a.id);
    const nb = Number(b.id);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
    return a.id.localeCompare(b.id, "en");
  });
}

/**
 * rehype plugin: assign deterministic, collision-checked heading ids
 * (plan §10.3).
 *
 * This replaces `rehype-slug` so the slug is derived from the heading's
 * *readable* label rather than its raw source. Several headings in this corpus
 * are written entirely in TeX, and slugging the source produced anchors like
 * `#boxedtextalgorithm-1-manifold-constrained-hyper-connection`.
 *
 * A single `GithubSlugger` for the whole document guarantees uniqueness by
 * construction — mixing pre-assigned ids with a second slugger's output is
 * exactly how duplicate anchors appear.
 */
function slugHeadings() {
  return (tree: Root) => {
    const slugger = new GithubSlugger();
    visit(tree, "element", (node: Element) => {
      if (!/^h[1-6]$/.test(node.tagName)) return;
      node.properties ??= {};
      // An explicitly authored id is authoritative; only reserve it.
      if (typeof node.properties.id === "string" && node.properties.id) {
        slugger.slug(node.properties.id);
        return;
      }
      node.properties.id = slugger.slug(headingLabel(hastToString(node)));
    });
  };
}

/** rehype plugin: collect h2/h3 into `sink` in document order for the outline. */
function collectHeadings(sink: HeadingRecord[]) {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "h2" && node.tagName !== "h3") return;
      const id = typeof node.properties?.id === "string" ? node.properties.id : "";
      if (!id) return;
      sink.push({
        id,
        // The outline is built before KaTeX runs, so raw TeX would otherwise
        // reach the reader as a sidebar full of backslashes.
        text: headingLabel(hastToString(node)),
        depth: node.tagName === "h2" ? 2 : 3,
      });
    });
  };
}

function normalizeHeading(s: string): string {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

/** Elements whose text is markup noise rather than readable content. */
const NON_TEXT_TAGS = new Set(["script", "style", "svg", "annotation"]);

/**
 * Extract readable text, skipping rendered mathematics.
 *
 * Math nodes still carry their raw TeX at this stage; including it would fill
 * the search index with backslash soup that matches nothing a reader would
 * type. The equation's prose context is indexed instead.
 */
function readableText(node: Element): string {
  let out = "";
  const walk = (current: Element) => {
    for (const child of current.children) {
      if (child.type === "text") {
        out += child.value;
      } else if (child.type === "element") {
        if (NON_TEXT_TAGS.has(child.tagName)) continue;
        const classes = child.properties?.className;
        if (Array.isArray(classes) && classes.some((c) => String(c).startsWith("math"))) {
          continue;
        }
        walk(child);
      }
    }
  };
  walk(node);
  return out.replace(/\s+/g, " ").trim();
}

/** Block elements captured as one segment each; their children are not revisited. */
const SEGMENT_TAGS: ReadonlyMap<string, SearchFieldKind> = new Map([
  ["p", "body"],
  ["li", "body"],
  ["blockquote", "body"],
  ["figcaption", "caption"],
  ["table", "table"],
  ["pre", "code"],
]);

/**
 * rehype plugin: collect indexable segments in document order, each anchored to
 * the heading that precedes it (plan §18.5).
 *
 * Must run before autolinking (so the injected `#` anchor text is not indexed),
 * before KaTeX (so `readableText` can still recognize and skip math wrappers),
 * and before Shiki (so code is plain text rather than per-token spans).
 */
function collectSearchText(sink: SearchSegment[]) {
  return (tree: Root) => {
    let headingId: string | null = null;
    let headingText: string | null = null;

    visit(tree, "element", (node: Element) => {
      if (/^h[1-6]$/.test(node.tagName)) {
        const id = typeof node.properties?.id === "string" ? node.properties.id : null;
        // `readableText` drops math, which would leave an all-TeX heading with
        // no label at all; the plain-text reduction keeps it findable.
        const text = headingLabel(hastToString(node));
        headingId = id;
        headingText = text || null;
        if (text) sink.push({ kind: "heading", headingId: id, headingText: text, text });
        return;
      }
      const kind = SEGMENT_TAGS.get(node.tagName);
      if (!kind) return;
      const text = readableText(node);
      if (text) sink.push({ kind, headingId, headingText, text });
      // Nested blocks are already covered by the text just captured.
      return SKIP;
    });
  };
}

/** The page renders the article title as `<h1>`, so body headings start at 2. */
const BODY_TOP_LEVEL = 2;
const MAX_HEADING_LEVEL = 6;

/**
 * rehype plugin: renumber the document's headings into a valid outline.
 *
 * Authors write `#` for top-level sections, but the page already renders the
 * article title as the single `<h1>`. Left alone that yields dozens of `<h1>`
 * elements (invalid, and bad for assistive tech) and — because the outline
 * collects h2/h3 — those sections never appear in the table of contents.
 *
 * A flat "demote everything by one" is not enough: a document whose shallowest
 * heading is `##` would start at `<h3>`, leaving an h1 → h3 jump straight after
 * the title. WCAG 2.2 (plan §20) requires headings to descend one level at a
 * time, and the build's HTML audit gates on it.
 *
 * So levels are recomputed from *nesting depth* rather than from the authored
 * number. A stack tracks which authored levels are still open; a heading's
 * rendered level is its depth in that stack. Document order, relative nesting,
 * and heading text are all preserved — only the tag number changes, which is
 * exactly what plan §7.6 asks for ("heading levels reflect semantics, not
 * desired size").
 *
 *   authored  ##  ###  ####  ##  ###      (no `#` at all)
 *   rendered  h2  h3   h4    h2  h3       (no jump from the page h1)
 */
function fitHeadingLevels(options: { title: string }) {
  return (tree: Root) => {
    let droppedTitle = false;
    /** Authored levels of the currently-open ancestor headings. */
    const openLevels: number[] = [];

    visit(tree, "element", (node: Element, index, parent) => {
      const match = /^h([1-6])$/.exec(node.tagName);
      if (!match) return;
      const authoredLevel = Number(match[1]);

      // A leading `#` that merely restates the title is redundant on a page
      // that already renders the title — drop it rather than duplicate it.
      if (
        authoredLevel === 1 &&
        !droppedTitle &&
        parent &&
        index !== undefined &&
        normalizeHeading(hastToString(node)) === normalizeHeading(options.title)
      ) {
        parent.children.splice(index, 1);
        droppedTitle = true;
        return [SKIP, index];
      }

      while (openLevels.length > 0 && openLevels[openLevels.length - 1] >= authoredLevel) {
        openLevels.pop();
      }
      openLevels.push(authoredLevel);

      node.tagName = `h${Math.min(MAX_HEADING_LEVEL, BODY_TOP_LEVEL + openLevels.length - 1)}`;
    });
  };
}

/** rehype plugin: wrap every table in a horizontal scroll container so wide
 *  technical tables scroll locally instead of breaking page layout (plan §14.2). */
function wrapTables() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName !== "table" || !parent || index === undefined) return;
      const wrapper: Element = {
        type: "element",
        tagName: "div",
        properties: { className: ["table-scroll"], role: "region", "aria-label": "Table", tabIndex: 0 },
        children: [node],
      };
      (parent.children as unknown[])[index] = wrapper;
      return [SKIP, index + 1];
    });
  };
}

const LANGUAGE_CLASS_PREFIX = "language-";

/**
 * Read the fence language from a highlighted `<code>` element.
 *
 * The class list has to be read defensively: `mdast-util-to-hast` emits
 * `properties.className` as an array, while the Shiki transformer that replaces
 * the node emits a `class` string. Assuming the array form silently produced
 * `text` for every block — a `json` listing was labelled "TEXT" in the UI even
 * though it was correctly highlighted.
 */
function languageOf(code: Element | undefined): string {
  const properties = code?.properties;
  if (!properties) return "text";
  const raw = properties.className ?? properties.class;
  const classes = Array.isArray(raw)
    ? raw.map(String)
    : typeof raw === "string"
      ? raw.split(/\s+/)
      : [];
  const match = classes.find((name) => name.startsWith(LANGUAGE_CLASS_PREFIX));
  return match ? match.slice(LANGUAGE_CLASS_PREFIX.length) : "text";
}

/** rehype plugin: wrap each highlighted code block in a figure carrying its
 *  language, so the UI can render a header bar and copy affordance (plan §13.3). */
function frameCodeBlocks() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName !== "pre" || !parent || index === undefined) return;
      const code = node.children.find(
        (c): c is Element => c.type === "element" && c.tagName === "code",
      );
      const lang = languageOf(code);
      const figure: Element = {
        type: "element",
        tagName: "figure",
        properties: { className: ["code-block"], "data-lang": lang },
        children: [
          {
            type: "element",
            tagName: "figcaption",
            properties: { className: ["code-block__bar"] },
            children: [
              { type: "element", tagName: "span", properties: { className: ["code-block__lang"] }, children: [{ type: "text", value: lang }] },
            ],
          },
          node,
        ],
      };
      (parent.children as unknown[])[index] = figure;
      return [SKIP, index + 1];
    });
  };
}

export interface AssetVariants {
  src: string;
  width: number | null;
  height: number | null;
  avif: { w: number; src: string }[];
  webp: { w: number; src: string }[];
}
export type AssetResolver = (relativeSrc: string) => AssetVariants | null;

/**
 * rehype plugin: rewrite document-relative body images to their optimized,
 * publicly-served variants (plan §15.2).
 *
 * Authors write `![](./assets/foo.png)`, which is relative to the Markdown file
 * and does not survive routing — the browser would request it under the article
 * URL and 404. This resolves each reference through the build manifest and
 * emits `<picture>` with AVIF/WebP sources, a fallback, and intrinsic
 * width/height so the image box is reserved before decode.
 */
function resolveBodyImages(resolve: AssetResolver | undefined, rendered: string[]) {
  return (tree: Root) => {
    if (!resolve) return;
    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName !== "img" || !parent || index === undefined) return;
      const src = node.properties?.src;
      if (typeof src !== "string") return;
      if (/^(?:[a-z]+:)?\/\//i.test(src) || src.startsWith("/") || src.startsWith("data:")) return;

      const v = resolve(src);
      if (!v) return;
      rendered.push(v.src);

      const alt = typeof node.properties.alt === "string" ? node.properties.alt : "";
      const sizes = "(max-width: 1024px) 100vw, 608px";
      const srcset = (list: { w: number; src: string }[]) =>
        list.map((x) => `${x.src} ${x.w}w`).join(", ");

      const sources: Element[] = [];
      if (v.avif.length) {
        sources.push({
          type: "element",
          tagName: "source",
          properties: { type: "image/avif", srcSet: srcset(v.avif), sizes },
          children: [],
        });
      }
      if (v.webp.length) {
        sources.push({
          type: "element",
          tagName: "source",
          properties: { type: "image/webp", srcSet: srcset(v.webp), sizes },
          children: [],
        });
      }

      const img: Element = {
        type: "element",
        tagName: "img",
        properties: {
          src: v.src,
          alt,
          ...(v.width ? { width: v.width } : {}),
          ...(v.height ? { height: v.height } : {}),
          loading: "lazy",
          decoding: "async",
        },
        children: [],
      };

      (parent.children as unknown[])[index] = {
        type: "element",
        tagName: "picture",
        properties: { className: ["content-image"] },
        children: [...sources, img],
      } as Element;
      return [SKIP, index + 1];
    });
  };
}

/**
 * A one-letter control sequence — `\d`, `\q` — which is almost always a row
 * separator whose second backslash was lost in Markdown conversion. Genuine
 * multi-letter commands (`\top`, `\begin`) never match, because the letter must
 * not be followed by another letter.
 *
 * Used only as a cheap prefilter: a match makes an equation *worth checking*,
 * never wrong by itself. A few one-letter commands really do exist.
 */
const SUSPECT_CONTROL_SEQUENCE = /(?<!\\)\\(?!\\)[a-zA-Z](?![a-zA-Z])/;

const UNDEFINED_SEQUENCE = /Undefined control sequence: \\(\w+)/;

/**
 * Repair row separators that a Markdown conversion collapsed from `\\` to `\`.
 *
 * `\begin{bmatrix}q'_{2i}\q'_{2i+1}\end{bmatrix}` should have `\\` between the
 * rows; with one backslash it reads as an undefined command `\q` and the
 * equation fails to render. Two such equations were live on the site,
 * undetected because the maths gate only ever scanned one section.
 *
 * KaTeX is the oracle rather than a heuristic: the equation is repaired only if
 * it currently fails to parse, only for the exact control sequence KaTeX names
 * in its error, and only if the repair makes it parse. Anything that already
 * renders is untouched, and an equation that cannot be repaired is returned
 * unchanged so the original source still reaches the fallback path (plan §11.4).
 */
function repairCollapsedRowBreaks(tex: string, displayMode: boolean): string {
  if (!SUSPECT_CONTROL_SEQUENCE.test(tex)) return tex;

  let candidate = tex;
  for (let pass = 0; pass < 4; pass++) {
    try {
      katex.renderToString(candidate, { displayMode, throwOnError: true });
      return candidate; // parses — either it always did, or the repair worked
    } catch (error) {
      const named = UNDEFINED_SEQUENCE.exec(
        error instanceof Error ? error.message : String(error),
      );
      if (!named) return tex; // a different problem; do not touch the source
      const sequence = named[1];
      // Match a single (not already doubled) backslash before the named
      // sequence, and replace it with two — `\q` becomes `\\q`, a row break.
      const single = new RegExp(String.raw`(?<!\\)\\${sequence}(?![a-zA-Z])`, "g");
      const next = candidate.replace(single, String.raw`\\${sequence}`);
      if (next === candidate) return tex; // nothing to repair
      candidate = next;
    }
  }
  return tex;
}

/**
 * remark plugin: apply the row-break repair to every maths node.
 *
 * `remark-math` contributes `math` and `inlineMath` node types that are not in
 * the base mdast type definitions, so they are narrowed structurally.
 */
function isMathNode(node: unknown): node is { type: "math" | "inlineMath"; value: string } {
  if (typeof node !== "object" || node === null) return false;
  const candidate = node as { type?: unknown; value?: unknown };
  return (
    (candidate.type === "math" || candidate.type === "inlineMath") &&
    typeof candidate.value === "string"
  );
}

/**
 * Rewrite the TeX a maths node will actually render.
 *
 * `remark-math` precomputes the node's hast representation into
 * `data.hChildren` while parsing, and `remark-rehype` emits that verbatim.
 * Assigning to `node.value` alone therefore changes nothing downstream — the
 * repaired equation was silently discarded and the broken TeX still reached
 * KaTeX. Both representations have to be kept in step.
 */
function setMathValue(node: { value: string; data?: unknown }, tex: string): void {
  node.value = tex;

  const data = node.data as { hChildren?: unknown } | undefined;
  if (!data || !Array.isArray(data.hChildren)) return;

  const rewrite = (nodes: unknown[]): void => {
    for (const child of nodes) {
      if (typeof child !== "object" || child === null) continue;
      const candidate = child as { type?: unknown; value?: unknown; children?: unknown };
      if (candidate.type === "text" && typeof candidate.value === "string") {
        candidate.value = tex;
      } else if (Array.isArray(candidate.children)) {
        rewrite(candidate.children);
      }
    }
  };
  rewrite(data.hChildren);
}

function repairMathNodes() {
  return (tree: MdastRoot) => {
    visit(tree, (node) => {
      if (!isMathNode(node)) return;
      const repaired = repairCollapsedRowBreaks(node.value, node.type === "math");
      if (repaired !== node.value) setMathValue(node, repaired);
    });
  };
}

/** Opening fence of a code block, capturing its info-string language. */
const CODE_FENCE = /^[ \t]{0,3}(?:```+|~~~+)[ \t]*([A-Za-z0-9_+#.-]*)/gm;

/**
 * Languages that actually appear in a document, lowercased and deduplicated.
 *
 * Used to decide whether the syntax highlighter is needed at all, and to load
 * only the grammars the document uses (plan §13.2: "Load only languages
 * discovered in the corpus").
 *
 * Initialising Shiki costs roughly ten seconds — it loads a regex engine, two
 * themes, and grammar definitions — and it was being paid on *every* document.
 * Four of the five articles in this corpus contain no code at all, so that was
 * ten seconds of pure waste per page render, which is what made article routes
 * take ten seconds to serve in development.
 *
 * Fences are counted in pairs: only every other match opens a block, so a
 * closing fence cannot be mistaken for an unlabelled language.
 */
function isBundledLanguage(language: string): language is BundledLanguage {
  return Object.hasOwn(bundledLanguages, language);
}

function codeLanguages(markdown: string): BundledLanguage[] {
  const languages = new Set<BundledLanguage>();
  CODE_FENCE.lastIndex = 0;
  let match: RegExpExecArray | null;
  let open = false;
  while ((match = CODE_FENCE.exec(markdown)) !== null) {
    open = !open;
    if (!open) continue; // this match closed the block
    const language = match[1].toLowerCase();
    // An unrecognized info-string is not an error: the block renders as plain
    // code (plan §13.2), and asking Shiki to load a grammar that does not exist
    // would fail the build over a typo in a fence.
    if (language && isBundledLanguage(language)) languages.add(language);
  }
  return [...languages].sort();
}

/** rehype plugin: mark external links accessible + safe (plan §10.3). */
function hardenLinks() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "a") return;
      const href = node.properties?.href;
      if (typeof href !== "string") return;
      if (/^https?:\/\//i.test(href)) {
        node.properties.target = "_blank";
        node.properties.rel = ["noopener", "noreferrer"];
        node.properties["data-external"] = "true";
      }
    });
  };
}

/**
 * Compilation is pure in its inputs, so identical sources yield identical
 * artifacts (plan §3.2) and can be memoized. During a build the same article is
 * compiled by both the page renderer and the search-index builder; without this
 * the corpus would be parsed, KaTeX-rendered, and highlighted twice.
 *
 * The key includes the title and asset-resolver identity because both change
 * the output. Entries live for the lifetime of the build process only.
 */
const compileCache = new Map<string, Promise<CompiledArticle>>();
const resolverIds = new WeakMap<AssetResolver, number>();
let nextResolverId = 0;

function cacheKey(source: string, title: string, resolveAsset?: AssetResolver): string {
  let resolverId = 0;
  if (resolveAsset) {
    resolverId = resolverIds.get(resolveAsset) ?? ++nextResolverId;
    resolverIds.set(resolveAsset, resolverId);
  }
  return `${resolverId}\u0000${title}\u0000${source}`;
}

export function compileArticle(
  source: string,
  title = "",
  resolveAsset?: AssetResolver,
): Promise<CompiledArticle> {
  const key = cacheKey(source, title, resolveAsset);
  const cached = compileCache.get(key);
  if (cached) return cached;
  const pending = compileArticleUncached(source, title, resolveAsset);
  compileCache.set(key, pending);
  // A failed compile must not poison the cache for a later retry.
  pending.catch(() => compileCache.delete(key));
  return pending;
}

/**
 * The stages that establish document *structure*: heading levels, heading ids,
 * the outline, and the indexable text.
 *
 * Shared verbatim by the renderer and by the search-index extractor, so a
 * heading's id cannot differ between the page a reader lands on and the search
 * result that linked them there. Everything after this point is presentation.
 */
function structuralStages(
  title: string,
  headings: HeadingRecord[],
  searchSegments: SearchSegment[],
  /**
   * Enabled only on the render path. The repair changes how an equation *draws*
   * and cannot affect heading ids or indexable text, so the search-index
   * extractor skips it and avoids invoking KaTeX at all.
   */
  { repairMath = false }: { repairMath?: boolean } = {},
) {
  const processor = unified().use(remarkParse).use(remarkGfm).use(remarkMath);
  if (repairMath) processor.use(repairMathNodes);
  return processor
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(fitHeadingLevels, { title })
    .use(slugHeadings)
    .use(collectHeadings, headings) // capture clean outline text before anchors
    // Index before anchors/KaTeX/Shiki rewrite the tree into presentation markup.
    .use(collectSearchText, searchSegments);
}

/** Prose words in the collected segments; code, tables, and maths excluded. */
function countSegmentWords(segments: SearchSegment[]): number {
  return segments
    .filter((s) => s.kind === "heading" || s.kind === "body" || s.kind === "caption")
    .reduce((total, s) => total + s.text.split(/\s+/).filter(Boolean).length, 0);
}

export interface ArticleIndexData {
  headings: HeadingRecord[];
  searchSegments: SearchSegment[];
  wordCount: number;
}

const indexCache = new Map<string, Promise<ArticleIndexData>>();

/**
 * Extract only what the search index needs, without rendering the document.
 *
 * Building the index by calling `compileArticle` meant rendering 508 equations
 * through KaTeX, running the highlighter, and serialising several megabytes of
 * HTML — for output that is then thrown away, since the index stores plain
 * text. `/search-index.json` took 8–12 seconds to produce as a result.
 *
 * Running the structural stages alone, and stopping before the compiler, keeps
 * heading ids identical while skipping all of that work.
 */
export function extractArticleIndex(source: string, title = ""): Promise<ArticleIndexData> {
  const key = `${title}\u0000${source}`;
  const cached = indexCache.get(key);
  if (cached) return cached;
  const pending = extractArticleIndexUncached(source, title);
  indexCache.set(key, pending);
  pending.catch(() => indexCache.delete(key));
  return pending;
}

async function extractArticleIndexUncached(
  source: string,
  title: string,
): Promise<ArticleIndexData> {
  const { markdown } = preprocess(source);
  const headings: HeadingRecord[] = [];
  const searchSegments: SearchSegment[] = [];

  const processor = structuralStages(title, headings, searchSegments);
  // `run` applies the transformers without invoking a compiler, so no HTML is
  // ever produced.
  await processor.run(processor.parse(markdown));

  return { headings, searchSegments, wordCount: countSegmentWords(searchSegments) };
}

async function compileArticleUncached(
  source: string,
  title: string,
  resolveAsset?: AssetResolver,
): Promise<CompiledArticle> {
  const { markdown, displayBlocks, inlineSpans } = preprocess(source);
  const headings: HeadingRecord[] = [];
  const searchSegments: SearchSegment[] = [];
  const images: string[] = [];
  const languages = codeLanguages(markdown);

  const processor = structuralStages(title, headings, searchSegments, { repairMath: true })
    .use(rehypeAutolinkHeadings, {
      behavior: "append",
      properties: { className: ["heading-anchor"], "aria-label": "Link to this section", tabIndex: -1 },
      content: { type: "text", value: "#" },
    })
    .use(hardenLinks)
    .use(resolveBodyImages, resolveAsset, images)
    .use(wrapTables)
    // Build-time render; on malformed TeX, emit the source in a styled span
    // rather than throwing (plan §11.4). rehype-katex defaults output to
    // htmlAndMathml for accessibility.
    .use(rehypeKatex, { throwOnError: false, errorColor: "var(--color-danger)" });

  // Only pay for the highlighter when the document has code to highlight, and
  // load only the grammars it actually uses. A block with no info-string is
  // still framed by `frameCodeBlocks` below; it just renders as plain code.
  if (languages.length > 0) {
    processor.use(rehypeShiki, {
      themes: { light: "github-light", dark: "github-dark" },
      langs: languages,
      defaultColor: false,
      addLanguageClass: true,
    });
  }

  const file = await processor
    .use(frameCodeBlocks)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);

  return {
    html: String(file),
    headings,
    references: extractReferences(source),
    searchSegments,
    // Compiler-side prose measurement, used for diagnostics. The reading time
    // shown to readers comes from `lib/content/reading.ts`, which listing pages
    // can compute without a full compile — one estimate, shown consistently.
    wordCount: countSegmentWords(searchSegments),
    images,
    diagnostics: { displayBlocks, inlineSpans },
  };
}
