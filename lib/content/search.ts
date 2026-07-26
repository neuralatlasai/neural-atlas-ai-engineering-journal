/**
 * Build-time search-index producer (plan §18.5).
 *
 * Runs on the server during the static export and consumes the *same* compiled
 * artifacts the article pages render, so heading anchors in a search result are
 * guaranteed to exist on the page it links to. The compiler memoizes per
 * source, so building the index costs no extra parsing.
 */
import { getAllArticles, readSource } from "./corpus";
import { extractArticleIndex, type SearchSegment } from "./compile";
import {
  SEARCH_INDEX_VERSION,
  type SearchDocument,
  type SearchIndex,
  type SearchSection,
} from "../search/types";

/**
 * Code is indexed so identifiers are findable, but a long listing should not
 * dominate the payload; only the leading characters of each section's code are
 * kept. Prose is never truncated.
 */
const CODE_CHARS_PER_SECTION = 1_200;

/** Collapse a compiled article's segments into heading-anchored sections. */
function toSections(segments: SearchSegment[], leadTitle: string): SearchSection[] {
  const order: string[] = [];
  const byHeading = new Map<string, SearchSection>();

  const ensure = (id: string, title: string): SearchSection => {
    const existing = byHeading.get(id);
    if (existing) return existing;
    const created: SearchSection = { id, title, text: "", code: "" };
    byHeading.set(id, created);
    order.push(id);
    return created;
  };

  for (const segment of segments) {
    const id = segment.headingId ?? "";
    const section = ensure(id, segment.headingText ?? leadTitle);
    if (segment.kind === "heading") continue; // the heading is the section title
    if (segment.kind === "code") {
      if (section.code.length < CODE_CHARS_PER_SECTION) {
        section.code = `${section.code} ${segment.text}`.slice(0, CODE_CHARS_PER_SECTION).trim();
      }
      continue;
    }
    section.text = section.text ? `${section.text} ${segment.text}` : segment.text;
  }

  return order
    .map((id) => byHeading.get(id))
    .filter((s): s is SearchSection => s !== undefined && (s.text !== "" || s.code !== ""));
}

/** Compile every published article and emit the complete static index. */
export async function buildSearchIndex(): Promise<SearchIndex> {
  const articles = getAllArticles();

  const documents = await Promise.all(
    articles.map(async (article): Promise<SearchDocument> => {
      const indexed = await extractArticleIndex(readSource(article.sourcePath), article.title);
      return {
        route: article.route,
        title: article.title,
        description: article.description,
        section: article.section,
        sectionLabel: article.sectionLabel,
        articleType: article.articleType,
        topics: article.topics,
        displayDate: article.displayDate,
        readingMinutes: article.readingMinutes,
        sections: toSections(indexed.searchSegments, article.title),
      };
    }),
  );

  // `getAllArticles` is already deterministically ordered; preserve it so the
  // emitted JSON is byte-identical across builds (plan §3.2).
  return { version: SEARCH_INDEX_VERSION, documents };
}
