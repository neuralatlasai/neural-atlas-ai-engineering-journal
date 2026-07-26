/**
 * Query evaluation for the static search index.
 *
 * Pure and isomorphic — no DOM, no Node, no framework — so the `/search` page,
 * the command palette, and the unit tests all share one ranking implementation.
 *
 * The ranking is deliberately simple and explainable rather than a black box:
 * a term contributes a per-field weight, scaled by how completely it matches
 * (whole word > prefix > substring). A document must contain *every* query term
 * somewhere to be returned, which keeps multi-word queries precise on a corpus
 * of long technical documents.
 */
import type { SearchDocument, SearchIndex, SearchSection } from "./types";

/** Per-field contribution of a single matched term. */
const FIELD_WEIGHT = {
  title: 12,
  description: 5,
  topic: 5,
  /**
   * The route slug is an authored signal and sometimes the *only* one: this
   * corpus has no front matter, so titles are derived from the first heading
   * and `/components/attention` is titled "MHA". Without this, searching
   * "attention" ranked that article below passing mentions elsewhere.
   */
  slug: 4,
  sectionLabel: 3,
  headingTitle: 6,
  text: 1,
  code: 0.4,
} as const;

/** Route as searchable words: `/components/attention` → `components attention`. */
function slugWords(route: string): string {
  return route.replace(/[/-]+/g, " ").trim();
}

/** How much of a term matched, as a multiplier on the field weight. */
const MATCH_QUALITY = { word: 1, prefix: 0.6, substring: 0.3 } as const;

export interface SearchHit {
  document: SearchDocument;
  score: number;
  /** Best-matching section; the article's lead section when nothing deeper matched. */
  section: SearchSection | null;
  /** Deep link to the matched section, or the article route. */
  href: string;
  /** Contiguous excerpt around the first match, for display. */
  snippet: string;
}

/** Split a query into lowercase terms, dropping punctuation-only fragments. */
export function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^\p{L}\p{N}_+#.-]+/u)
    .map((t) => t.replace(/^[.\-]+|[.\-]+$/g, ""))
    .filter((t) => t.length > 0);
}

/**
 * Score one term against one haystack. Returns 0 when absent.
 *
 * Repeat occurrences add a damped bonus so a section that discusses a term
 * throughout outranks one that mentions it once, without letting long sections
 * dominate purely by length.
 */
function scoreTerm(term: string, haystack: string): number {
  if (!term || !haystack) return 0;
  const text = haystack.toLowerCase();
  const first = text.indexOf(term);
  if (first === -1) return 0;

  const before = first === 0 ? "" : text[first - 1];
  const afterIndex = first + term.length;
  const after = afterIndex >= text.length ? "" : text[afterIndex];
  const isWordStart = before === "" || !/[\p{L}\p{N}]/u.test(before);
  const isWordEnd = after === "" || !/[\p{L}\p{N}]/u.test(after);

  const quality = isWordStart && isWordEnd
    ? MATCH_QUALITY.word
    : isWordStart
      ? MATCH_QUALITY.prefix
      : MATCH_QUALITY.substring;

  // Count occurrences with diminishing returns: 1 + log2(n).
  let occurrences = 0;
  let cursor = first;
  while (cursor !== -1 && occurrences < 64) {
    occurrences++;
    cursor = text.indexOf(term, cursor + term.length);
  }
  return quality * (1 + Math.log2(occurrences));
}

interface SectionScore {
  section: SearchSection;
  score: number;
}

function scoreSection(section: SearchSection, terms: string[]): SectionScore {
  let score = 0;
  for (const term of terms) {
    score += FIELD_WEIGHT.headingTitle * scoreTerm(term, section.title);
    score += FIELD_WEIGHT.text * scoreTerm(term, section.text);
    score += FIELD_WEIGHT.code * scoreTerm(term, section.code);
  }
  return { section, score };
}

function scoreDocument(doc: SearchDocument, terms: string[]): SearchHit | null {
  let documentScore = 0;
  const slug = slugWords(doc.route);
  const haystacks = [
    doc.title,
    doc.description,
    doc.sectionLabel,
    doc.articleType,
    doc.topics.join(" "),
    slug,
  ].join("\n");

  for (const term of terms) {
    documentScore += FIELD_WEIGHT.title * scoreTerm(term, doc.title);
    documentScore += FIELD_WEIGHT.description * scoreTerm(term, doc.description);
    documentScore += FIELD_WEIGHT.slug * scoreTerm(term, slug);
    documentScore += FIELD_WEIGHT.sectionLabel * scoreTerm(term, doc.sectionLabel);
    documentScore += FIELD_WEIGHT.topic * scoreTerm(term, doc.topics.join(" "));
  }

  const scoredSections = doc.sections
    .map((s) => scoreSection(s, terms))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  // Every term must appear somewhere in the document.
  const corpus = `${haystacks}\n${doc.sections
    .map((s) => `${s.title}\n${s.text}\n${s.code}`)
    .join("\n")}`.toLowerCase();
  if (!terms.every((term) => corpus.includes(term))) return null;

  const best = scoredSections[0] ?? null;
  const total = documentScore + (best?.score ?? 0);
  if (total <= 0) return null;

  const section = best?.section ?? doc.sections[0] ?? null;
  const href =
    section && section.id ? `${doc.route}#${section.id}` : doc.route;

  return {
    document: doc,
    score: total,
    section,
    href,
    snippet: buildSnippet(section?.text || doc.description, terms),
  };
}

/**
 * Extract a readable excerpt centred on the earliest matching term, with word
 * boundaries respected so the snippet never begins or ends mid-word.
 */
export function buildSnippet(text: string, terms: string[], radius = 90): string {
  if (!text) return "";
  const lower = text.toLowerCase();
  let position = -1;
  for (const term of terms) {
    const at = lower.indexOf(term);
    if (at !== -1 && (position === -1 || at < position)) position = at;
  }
  if (position === -1) {
    return text.length <= radius * 2 ? text : `${text.slice(0, radius * 2).trimEnd()}…`;
  }

  let start = Math.max(0, position - radius);
  let end = Math.min(text.length, position + radius);
  if (start > 0) {
    const space = text.indexOf(" ", start);
    if (space !== -1 && space < position) start = space + 1;
  }
  if (end < text.length) {
    const space = text.lastIndexOf(" ", end);
    if (space > position) end = space;
  }
  return `${start > 0 ? "…" : ""}${text.slice(start, end).trim()}${end < text.length ? "…" : ""}`;
}

/**
 * Split `text` into alternating non-matching / matching runs so a renderer can
 * mark hits without ever injecting HTML (plan §22: escape unknown content).
 */
export function highlightParts(
  text: string,
  terms: string[],
): { text: string; match: boolean }[] {
  if (!text || terms.length === 0) return [{ text, match: false }];
  const lower = text.toLowerCase();
  const ranges: [number, number][] = [];
  for (const term of terms) {
    let at = lower.indexOf(term);
    while (at !== -1) {
      ranges.push([at, at + term.length]);
      at = lower.indexOf(term, at + term.length);
    }
  }
  if (ranges.length === 0) return [{ text, match: false }];

  ranges.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const merged: [number, number][] = [];
  for (const range of ranges) {
    const last = merged[merged.length - 1];
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else merged.push([...range]);
  }

  const parts: { text: string; match: boolean }[] = [];
  let cursor = 0;
  for (const [start, end] of merged) {
    if (start > cursor) parts.push({ text: text.slice(cursor, start), match: false });
    parts.push({ text: text.slice(start, end), match: true });
    cursor = end;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), match: false });
  return parts;
}

export interface SearchOptions {
  /** Maximum hits to return. */
  limit?: number;
}

/** Rank every document in the index against `query`, best first. */
export function search(
  index: SearchIndex | null,
  query: string,
  { limit = 20 }: SearchOptions = {},
): SearchHit[] {
  const terms = tokenize(query);
  if (!index || terms.length === 0) return [];
  return index.documents
    .map((doc) => scoreDocument(doc, terms))
    .filter((hit): hit is SearchHit => hit !== null)
    .sort((a, b) => b.score - a.score || a.document.title.localeCompare(b.document.title, "en"))
    .slice(0, limit);
}
