import { plainTextFromTeX } from "./tex-text";

/**
 * Lede extraction — the one-sentence summary shown under an article title in
 * listings, search results, and `<meta name="description">`.
 *
 * The corpus has no front matter, so the deck has to be derived. The naive
 * "first paragraph after the first heading" produced garbage on maths-first
 * documents: `attention.md` opens with an image and a display-math block, so
 * its listing read `![](./assets/MHA_flow.png) [ X \in \mathbb{R}^{...} ]`.
 *
 * The rules here are deliberately conservative. A block is a candidate only if
 * it is genuinely prose, and if the opening of a document contains no prose the
 * result is empty — an article with no deck reads fine, an article with a deck
 * full of TeX does not. Nothing is ever invented.
 *
 * Pure and dependency-free, so it is directly unit-testable.
 */

/**
 * How far into the body to look, counted in non-blank source lines.
 *
 * A summary lives near the top; prose found a thousand lines down is a
 * mid-article aside, not a description of the work. The count deliberately
 * includes maths, tables, and other skipped blocks — counting only prose lines
 * let a maths-first document such as `attention.md` scan to line 1,572 and
 * present an incidental footnote about notation as its deck.
 */
const SEARCH_WINDOW_LINES = 90;

/** Below this a "paragraph" is a caption or a fragment, not a summary. */
const MIN_LETTERS = 60;

/** Descriptions are truncated on a word boundary beyond this. */
const MAX_CHARS = 260;

/** Prefer a real paragraph; fall back to a list item only if nothing better. */
const RANK = { paragraph: 0, listItem: 1 } as const;

interface Candidate {
  rank: number;
  text: string;
}

/**
 * Strip inline Markdown down to the words a reader would actually see.
 *
 * The deck is rendered as plain text — it never goes through the Markdown
 * compiler — so any mathematics in it must be reduced here. This corpus writes
 * inline maths as a parenthesised TeX group, and a sentence such as "a maximum
 * context length of (2^{20}=1{,}048{,}576) tokens" was reaching the reader
 * verbatim: in the article deck, in every listing row, in `<meta description>`,
 * in the Open Graph tags, and in the search index.
 */
function toPlainText(markdown: string): string {
  return plainTextFromTeX(
    markdown
      .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // inline links keep their label
      .replace(/\[([^\]]*)\]\[[^\]]*\]/g, "$1") // reference links keep their label
      .replace(/`([^`]*)`/g, "$1") // inline code
      .replace(/\*\*|__|\*|_~~/g, "")
      .replace(/^\s*\d+[.)]\s+/, "") // leading list marker
      .replace(/^\s*[-*+]\s+/, ""),
  )
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * A candidate is prose when it reads as sentences rather than notation.
 *
 * Backslashes and `$` are the tell for TeX that escaped the display-math
 * detection; a low letter ratio catches tables of symbols and numeric dumps.
 */
function isProse(text: string): boolean {
  if (text.length < MIN_LETTERS) return false;
  const letters = (text.match(/[A-Za-z]/g) ?? []).length;
  if (letters < MIN_LETTERS) return false;
  if (text.includes("$")) return false;
  if ((text.match(/\\/g) ?? []).length > 1) return false;
  return letters / text.length > 0.55;
}

/** Truncate on a word boundary, with an ellipsis only when text was removed. */
function truncate(text: string): string {
  if (text.length <= MAX_CHARS) return text;
  const cut = text.slice(0, MAX_CHARS);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > MAX_CHARS * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/** Lines that can never begin a summary. */
const STRUCTURAL =
  /^(?:#{1,6}\s|>|\||!\[|<|-{3,}$|={3,}$|\*{3,}$|\|)/;

/** `**Target checkpoint:** zai-org/GLM-5.2` — front matter written as prose. */
const METADATA_LINE = /^\*\*[^*]+:\*\*/;

/** `[1]: https://…` — a link reference definition. */
const LINK_DEFINITION = /^\s{0,3}\[[^\]]+\]:\s/;

const LIST_ITEM = /^\s*(?:\d+[.)]|[-*+])\s+\S/;

/**
 * Extract a deck from a Markdown body, or `""` when the document opens with no
 * usable prose.
 */
export function extractLede(body: string): string {
  const lines = body.split(/\r?\n/);
  const candidates: Candidate[] = [];

  let inFence = false;
  let fenceMarker = "";
  let inDisplayMath = false;
  let paragraph: string[] = [];
  let contentLines = 0;

  const considerParagraph = () => {
    if (paragraph.length === 0) return;
    const text = toPlainText(paragraph.join(" "));
    paragraph = [];
    if (isProse(text)) candidates.push({ rank: RANK.paragraph, text });
  };

  for (const raw of lines) {
    if (contentLines > SEARCH_WINDOW_LINES) break;
    const line = raw.trim();
    if (line) contentLines++;

    // Fenced code is opaque.
    const fence = /^(```+|~~~+)/.exec(line);
    if (fence) {
      if (!inFence) {
        inFence = true;
        fenceMarker = fence[1][0];
      } else if (line.startsWith(fenceMarker)) {
        inFence = false;
      }
      paragraph = [];
      continue;
    }
    if (inFence) continue;

    // Display maths, in both the authored bare-bracket convention (including
    // the `# [` scar) and standard `$$` delimiters.
    if (!inDisplayMath && (/^(?:#{1,6}\s*)?\[$/.test(line) || line === "$$")) {
      inDisplayMath = true;
      paragraph = [];
      continue;
    }
    if (inDisplayMath) {
      if (line === "]" || line === "$$") inDisplayMath = false;
      continue;
    }

    if (!line) {
      considerParagraph();
      continue;
    }

    if (STRUCTURAL.test(line) || METADATA_LINE.test(line) || LINK_DEFINITION.test(line)) {
      considerParagraph();
      paragraph = [];
      continue;
    }

    if (LIST_ITEM.test(line)) {
      considerParagraph();
      const text = toPlainText(line);
      if (isProse(text)) candidates.push({ rank: RANK.listItem, text });
      continue;
    }

    paragraph.push(line);
  }
  considerParagraph();

  if (candidates.length === 0) return "";
  // Stable: the best-ranked candidate, earliest wins within a rank.
  const best = candidates.reduce((a, b) => (b.rank < a.rank ? b : a));
  return truncate(best.text);
}
