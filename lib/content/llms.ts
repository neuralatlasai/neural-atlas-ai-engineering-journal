/**
 * `/llms.txt` and `/llms-full.txt` producers.
 *
 * `llms.txt` (llmstxt.org) is a curated, machine-first index a language model
 * can read in one fetch instead of crawling and de-chroming HTML. The format is
 * strict about structure, and that structure is what the two builders below
 * guarantee by construction:
 *
 *   # Title                     — exactly one H1, the publication's name
 *   > Summary                   — one blockquote, immediately after the H1
 *   Free prose                  — any non-heading blocks, no links required
 *   ## Section                  — H2s, each holding a Markdown list of links
 *   - [name](url): detail       — one link per list item
 *   ## Optional                 — the one reserved heading: skippable links
 *
 * Two properties matter beyond the shape:
 *
 * 1. Every URL is absolute. The file is read out of context — fetched by an
 *    agent that has no page to resolve `/models/glm-5-2/` against — so a
 *    site-relative href is a dead link. `absoluteUrl` also applies the
 *    deployment base path, which is what keeps the index correct on a GitHub
 *    Pages project site served from a sub-path.
 * 2. The corpus is the only source. Both files are derived from the same
 *    `getAllArticles()` the sitemap, the feed, and the search index read, so an
 *    added document appears in all four without anyone editing a list. Nothing
 *    here reads a clock, so repeated builds are byte-identical (plan §3.2).
 *
 * `llms-full.txt` is the companion the spec anticipates but does not define: the
 * whole corpus as one Markdown stream, so a model can ingest the publication
 * without one request per document. It carries the *normalized* source — the
 * same `preprocess` pass the rendered pages go through — so mathematics arrives
 * in standard `$`/`$$` delimiters rather than the corpus's lossy authored
 * convention, and image references are rewritten to absolute URLs that resolve
 * from anywhere.
 */
import matter from "gray-matter";
import {
  assetResolverFor,
  formatArticleType,
  getAllArticles,
  getSections,
  readSource,
  type ArticleMeta,
} from "./corpus";
import { preprocess } from "./preprocess";
import { titleLabel } from "./tex-text";
import { absoluteAssetUrl, absoluteUrl, site, staticNav } from "../site";

/** Served paths. Exported so links and tests cannot disagree with the routes. */
export const LLMS_TXT_PATH = "/llms.txt";
export const LLMS_FULL_TXT_PATH = "/llms-full.txt";

/**
 * The Markdown twin of a document's page: `/components/rl-grpo` is published as
 * a page at `/components/rl-grpo/` and as source at `/components/rl-grpo.md`.
 *
 * Appending the extension to the route — rather than nesting an `index.md` — is
 * what makes the pair guessable in both directions: an agent holding either URL
 * derives the other by adding or dropping `.md`. Slugs are `[a-z0-9-]` only, so
 * the extension is always the first dot in the final segment.
 */
export function markdownPathFor(article: ArticleMeta): string {
  return `${article.route}.md`;
}

/**
 * A list item is one line by definition, so a description that runs long turns
 * the index into prose. Entries are trimmed at a sentence boundary where one is
 * available and hard-truncated otherwise.
 */
const DETAIL_MAX_CHARS = 200;

/** Collapse authored whitespace so a detail can never break its list item. */
function oneLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function clamp(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const sentenceEnd = cut.lastIndexOf(". ");
  if (sentenceEnd > max * 0.5) return cut.slice(0, sentenceEnd + 1);
  const wordEnd = cut.lastIndexOf(" ");
  return `${(wordEnd > 0 ? cut.slice(0, wordEnd) : cut).replace(/[,;:—-]$/, "")}…`;
}

/**
 * Escape the characters that would terminate a Markdown link's label early.
 * Titles come from the corpus, which means from arbitrary author input.
 */
function escapeLinkText(text: string): string {
  return oneLine(text).replace(/([[\]])/g, "\\$1");
}

/** `- [name](url): detail` — the one item shape the format defines. */
function linkItem(name: string, url: string, detail?: string): string {
  const suffix = detail ? `: ${oneLine(detail)}` : "";
  return `- [${escapeLinkText(name)}](${url})${suffix}`;
}

/**
 * What an agent needs in order to decide whether to fetch a document: what kind
 * of writing it is, how long it is, and what it covers.
 */
function articleDetail(article: ArticleMeta): string {
  const facts = [formatArticleType(article.articleType), `${article.readingMinutes} min read`];
  if (article.displayDate) facts.push(article.displayDate);
  if (article.topics.length > 0) facts.push(article.topics.join(", "));

  const description = clamp(oneLine(article.description), DETAIL_MAX_CHARS);
  return description ? `${facts.join(" · ")} — ${description}` : facts.join(" · ");
}

/**
 * The path from the section root down to the document's folder, so entries in a
 * large section stay distinguishable when several share a title stem.
 */
function folderTrail(article: ArticleMeta): string {
  return article.folderLabels.slice(1).join(" / ");
}

/** The llms.txt index. */
export function buildLlmsTxt(): string {
  const articles = getAllArticles();
  const sections = getSections();
  const bySection = new Map<string, ArticleMeta[]>();
  for (const article of articles) {
    const bucket = bySection.get(article.section);
    if (bucket) bucket.push(article);
    else bySection.set(article.section, [article]);
  }

  const documentCount = `${articles.length} ${articles.length === 1 ? "document" : "documents"}`;
  const sectionCount = `${sections.length} ${sections.length === 1 ? "section" : "sections"}`;

  const blocks: string[] = [];

  blocks.push(`# ${site.name}`);
  blocks.push(`> ${oneLine(`${site.tagline}. ${site.longDescription}`)}`);
  blocks.push(
    oneLine(`Every document below is linked as Markdown source rather than as a
      rendered page, so no HTML parsing is required to read one. Documents are
      grouped by the section they are published under, in the same order as the
      site's own navigation.`),
  );
  blocks.push(
    [
      `- Corpus: ${documentCount} across ${sectionCount}.`,
      "- Each `.md` URL has a rendered page at the same path without the extension: `/components/rl-grpo.md` is the source of `/components/rl-grpo/`. Every document names its own page URL in its header; cite that one.",
      `- Full text: [${site.name} — complete corpus](${absoluteUrl(LLMS_FULL_TXT_PATH)}) concatenates all ${documentCount} into one file; prefer it over fetching them one at a time.`,
      "- Mathematics is preserved as TeX in `$`/`$$` delimiters, so equations survive extraction intact.",
    ].join("\n"),
  );

  for (const section of sections) {
    const items = bySection.get(section.section) ?? [];
    if (items.length === 0) continue;
    blocks.push(
      [
        `## ${section.label}`,
        "",
        ...items.map((article) => {
          const trail = folderTrail(article);
          const name = trail ? `${article.title} (${trail})` : article.title;
          return linkItem(name, absoluteUrl(markdownPathFor(article)), articleDetail(article));
        }),
      ].join("\n"),
    );
  }

  blocks.push(
    [
      "## Site",
      "",
      linkItem(site.name, absoluteUrl("/"), "Publication home and complete document index."),
      ...staticNav.map((item) => linkItem(item.label, absoluteUrl(item.href), item.description)),
    ].join("\n"),
  );

  // The one heading the format reserves: everything here may be skipped when
  // context is short. No document of the corpus itself appears in this section.
  blocks.push(
    [
      "## Optional",
      "",
      linkItem(
        `${site.name} — complete corpus`,
        absoluteUrl(LLMS_FULL_TXT_PATH),
        `Markdown source of all ${documentCount} in one file. Large; fetch only when the whole corpus is wanted.`,
      ),
      linkItem(
        "RSS feed",
        absoluteUrl("/feed.xml"),
        "Every document as RSS 2.0, for change detection.",
      ),
      linkItem("Sitemap", absoluteUrl("/sitemap.xml"), "Every indexable URL the site publishes."),
      linkItem(
        "Search index",
        absoluteUrl("/search-index.json"),
        "Pre-built JSON index of headings, prose, and code for every document.",
      ),
    ].join("\n"),
  );

  return `${blocks.join("\n\n")}\n`;
}

/** A URL that already resolves on its own and must be left alone. */
const ABSOLUTE_TARGET = /^(?:[a-z][a-z0-9+.-]*:|\/\/|\/|#)/i;

/**
 * Rewrite one document-relative asset reference to an absolute URL.
 *
 * A target may carry a Markdown title (`(src "caption")`); only the URL part is
 * touched. References the image manifest does not know — a missing file, or an
 * asset that was never optimized — are left exactly as authored rather than
 * pointed at a URL that would 404.
 */
function absolutizeTarget(
  target: string,
  resolve: (relativeSrc: string) => { src: string } | null,
): string {
  const match = /^(\S+)(\s[\s\S]*)?$/.exec(target.trim());
  if (!match) return target;
  const [, url, title = ""] = match;
  if (ABSOLUTE_TARGET.test(url)) return target;
  const resolved = resolve(url);
  return resolved ? `${absoluteAssetUrl(resolved.src)}${title}` : target;
}

/**
 * Rewrite the image targets on a single line.
 *
 * Scanned rather than matched with a regular expression because the corpus
 * contains URLs with parentheses in them (`GQA_%20(2).png`), which any
 * `\(([^)]*)\)` pattern truncates. Depth counting finds the real closer.
 */
function rewriteImageLine(
  line: string,
  resolve: (relativeSrc: string) => { src: string } | null,
): string {
  let out = "";
  let cursor = 0;

  while (cursor < line.length) {
    const open = line.indexOf("![", cursor);
    if (open === -1) break;
    const labelEnd = line.indexOf("](", open);
    if (labelEnd === -1) break;

    let depth = 1;
    let end = labelEnd + 2;
    while (end < line.length) {
      const ch = line[end];
      if (ch === "(") depth++;
      else if (ch === ")" && --depth === 0) break;
      end++;
    }
    if (depth !== 0) break; // unterminated — leave the rest of the line alone

    const target = line.slice(labelEnd + 2, end);
    out += `${line.slice(cursor, labelEnd + 2)}${absolutizeTarget(target, resolve)})`;
    cursor = end + 1;
  }

  return out + line.slice(cursor);
}

/**
 * Point every document-relative image at its published URL.
 *
 * Fenced code is skipped: a listing that happens to contain Markdown image
 * syntax is source being quoted, not a reference to rewrite.
 */
function absolutizeAssets(markdown: string, sourcePath: string): string {
  const resolve = assetResolverFor(sourcePath);
  const lines = markdown.split("\n");
  let inFence = false;
  let fenceMarker = "";

  for (let i = 0; i < lines.length; i++) {
    const fence = lines[i].match(/^\s*(```+|~~~+)/);
    if (fence) {
      if (!inFence) {
        inFence = true;
        fenceMarker = fence[1][0];
      } else if (lines[i].trim().startsWith(fenceMarker)) {
        inFence = false;
      }
      continue;
    }
    if (inFence) continue;
    if (lines[i].includes("![")) lines[i] = rewriteImageLine(lines[i], resolve);
  }

  return lines.join("\n");
}

/**
 * Drop a leading heading that only repeats the title printed above it. Titles
 * are frequently *derived* from that heading, so keeping both would open a
 * document with the same line twice.
 */
function dropRedundantLeadHeading(markdown: string, title: string): string {
  const lines = markdown.split("\n");
  const first = lines.findIndex((line) => line.trim() !== "");
  if (first === -1) return markdown;
  const heading = /^\s{0,3}#{1,6}\s+(.*?)\s*#*\s*$/.exec(lines[first]);
  if (!heading) return markdown;
  if (titleLabel(heading[1]).toLowerCase() !== title.toLowerCase()) return markdown;
  return lines.slice(first + 1).join("\n");
}

/**
 * One document as standalone Markdown: a heading, a metadata block, then its
 * normalized source.
 *
 * This is the single renderer behind both surfaces — the `.md` file published
 * beside each page and the entry embedded in `llms-full.txt` — so the two can
 * never drift. The metadata block names the rendered page, which is what a
 * reader of an extracted passage needs in order to cite it.
 */
export function buildArticleMarkdown(article: ArticleMeta): string {
  const { content } = matter(readSource(article.sourcePath));
  const normalized = preprocess(content).markdown;
  const body = dropRedundantLeadHeading(
    absolutizeAssets(normalized, article.sourcePath),
    article.title,
  ).trim();

  const facts = [
    `Page: ${absoluteUrl(article.route)}`,
    `Markdown: ${absoluteUrl(markdownPathFor(article))}`,
    `Section: ${[article.sectionLabel, folderTrail(article)].filter(Boolean).join(" / ")}`,
    `Type: ${formatArticleType(article.articleType)}`,
    `Reading time: ${article.readingMinutes} min`,
  ];
  if (article.topics.length > 0) facts.push(`Topics: ${article.topics.join(", ")}`);
  if (article.displayDate) facts.push(`Published: ${article.displayDate}`);
  facts.push(`Source: ${article.documentId}`);
  facts.push(`Publication: ${site.name} — ${site.tagline}`);

  return [`# ${oneLine(article.title)}`, "", ...facts.map((fact) => `> ${fact}`), "", body].join(
    "\n",
  );
}

/** Every document's Markdown, keyed by the path it is published at. */
export function buildArticleMarkdownFiles(): { path: string; content: string }[] {
  return getAllArticles().map((article) => ({
    path: markdownPathFor(article),
    content: `${buildArticleMarkdown(article)}\n`,
  }));
}

/** The whole corpus as one Markdown stream. */
export function buildLlmsFullTxt(): string {
  const articles = getAllArticles();

  const header = [
    `# ${site.name} — Complete Corpus`,
    "",
    `> ${oneLine(`${site.tagline}. ${site.longDescription}`)}`,
    "",
    oneLine(`This file is the full Markdown source of all ${articles.length} documents published
      at ${absoluteUrl("/")}, in the same order as the index at ${absoluteUrl(LLMS_TXT_PATH)}.
      Each document is also served on its own, at its page URL with a \`.md\`
      extension, byte for byte as it appears here. Documents are separated by a
      horizontal rule and introduced by an H1 followed by a metadata block; every
      heading below that belongs to the document itself. Mathematics is normalized to
      standard $-delimited TeX and image references are absolute, so any passage can
      be quoted or fetched without resolving it against a page.`),
  ].join("\n");

  return `${[header, ...articles.map(buildArticleMarkdown)].join("\n\n---\n\n")}\n`;
}
