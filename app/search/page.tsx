import type { Metadata } from "next";
import { getAllArticles } from "@/lib/content/corpus";
import { SearchView } from "@/components/SearchView";
import { ArticleList } from "@/components/ArticleList";

export const metadata: Metadata = {
  title: "Search",
  description: "Search every article, section heading, and code listing in the journal.",
  alternates: { canonical: "/search" },
  // A query-parameter surface has nothing stable to index.
  robots: { index: false, follow: true },
};

/**
 * Static search page (plan §18.5).
 *
 * The route is prerendered and the browse list is real server-rendered HTML, so
 * the page is complete and useful with JavaScript disabled. It is also the
 * documented fallback when the client index fails to load.
 */
export default function SearchPage() {
  const articles = getAllArticles();

  return (
    <div className="shell">
      <section className="page-intro">
        <p className="eyebrow">Search</p>
        <h1>Search the journal</h1>
        <p>
          Queries run against article titles, section headings, prose, and code
          listings. Results link directly to the matching section.
        </p>
      </section>

      <SearchView>
        <h2 className="section-heading">All articles</h2>
        <ArticleList articles={articles} headingLevel="h3" />
      </SearchView>
    </div>
  );
}
