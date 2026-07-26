/**
 * Wire format for the static search index (plan §18.5).
 *
 * Kept in its own module with no Node or React imports so the build-time
 * producer (`lib/content/search.ts`), the browser-side consumer
 * (`lib/search/query.ts`), and the tests all agree on one shape.
 *
 * The index is structured, not a flattened text blob: each article keeps its
 * heading sections so a result can deep-link to the exact section that matched.
 */

/** Bumped whenever the shape changes so a stale cached index is detectable. */
export const SEARCH_INDEX_VERSION = 1;

/** Public path of the generated index. */
export const SEARCH_INDEX_PATH = "/search-index.json";

export interface SearchSection {
  /** Heading anchor within the article. Empty for text before the first heading. */
  id: string;
  /** Heading text, or the article title for the lead section. */
  title: string;
  /** Readable prose under this heading: paragraphs, lists, captions, tables. */
  text: string;
  /** Source code under this heading, indexed separately at a lower weight. */
  code: string;
}

export interface SearchDocument {
  route: string;
  title: string;
  description: string;
  /** Section slug, e.g. `models`. */
  section: string;
  sectionLabel: string;
  articleType: string;
  topics: string[];
  displayDate: string | null;
  readingMinutes: number;
  sections: SearchSection[];
}

export interface SearchIndex {
  version: typeof SEARCH_INDEX_VERSION;
  documents: SearchDocument[];
}
