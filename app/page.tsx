import Link from "next/link";
import {
  formatArticleType,
  getAllArticles,
  getSections,
  type ArticleMeta,
} from "@/lib/content/corpus";
import { site } from "@/lib/site";
import { websiteJsonLd } from "@/lib/structured-data";
import { ArticleLink } from "@/components/ArticleLink";
import { HomeArtwork } from "@/components/HomeArtwork";
import { JsonLd } from "@/components/JsonLd";
import { getArticleVisual } from "@/lib/visuals/catalog";

type SectionSummary = ReturnType<typeof getSections>[number];

const SECTION_SCOPE: Readonly<Record<string, string>> = {
  blogs: "Technical field notes, system reconstructions, and applied analysis",
  components: "Building blocks, layers, modules, and interfaces",
  engineering: "Systems methods, tooling, and implementation",
  models: "Architectures, scaling laws, and design patterns",
  research: "Papers, reports, benchmarks, and datasets",
  training: "Data, optimization, infrastructure, and evaluation",
};

function sectionScope(section: SectionSummary): string {
  return SECTION_SCOPE[section.section] ?? `Technical analyses in ${section.label}`;
}

/** Prefer the authored field note, then fall back to the strongest described item. */
function pickFeatured(articles: readonly ArticleMeta[]): ArticleMeta | undefined {
  return (
    articles.find((article) => article.section === "blogs" && article.description) ??
    articles.find((article) => article.description && article.hero) ??
    articles.find((article) => article.description) ??
    articles[0]
  );
}

/**
 * Take the first article from each section before filling the remaining slots.
 * The two linear arrays keep selection O(n) and avoid an unbounded nested scan.
 */
function selectAcrossSections(
  articles: readonly ArticleMeta[],
  excludedRoute: string | undefined,
  limit: number,
): ArticleMeta[] {
  const firstBySection: ArticleMeta[] = [];
  const remainder: ArticleMeta[] = [];
  const representedSections = new Set<string>();

  for (const article of articles) {
    if (article.route === excludedRoute) continue;
    if (representedSections.has(article.section)) remainder.push(article);
    else {
      representedSections.add(article.section);
      firstBySection.push(article);
    }
  }

  return [...firstBySection, ...remainder].slice(0, limit);
}

export default function HomePage() {
  const articles = getAllArticles();
  const sections = getSections();
  const featured = pickFeatured(articles);
  const selected = selectAcrossSections(articles, featured?.route, 6);

  return (
    <div className="home-page">
      <JsonLd data={websiteJsonLd()} />

      <section className="home-hero" aria-labelledby="home-hero-title">
        <div className="shell home-hero__inner">
          <p className="home-eyebrow">{site.tagline}</p>
          <h1 id="home-hero-title">Reconstruct the system. Audit the mechanism.</h1>
          <p className="home-hero__deck">{site.longDescription}</p>
          <div className="home-hero__actions">
            <Link className="home-action home-action--primary" href="/library">
              Explore the library <span aria-hidden="true">&rarr;</span>
            </Link>
            <Link className="home-action" href="/about">
              Review the method
            </Link>
          </div>
        </div>
      </section>

      <section className="shell home-section" aria-labelledby="research-domains-heading">
        <div className="home-section__head">
          <div>
            <p className="home-eyebrow">Technical index</p>
            <h2 id="research-domains-heading">Research domains</h2>
          </div>
          <Link className="home-section__more" href="/library">
            View all analysis <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        <ol className="home-domain-grid">
          {sections.map((section, index) => (
            <li key={section.section}>
              <Link className="home-domain-card" href={`/${section.section}`}>
                <HomeArtwork
                  section={section.section}
                  className="home-domain-card__visual"
                  priority={index < 3}
                />
                <span className="home-domain-card__body">
                  <span className="home-domain-card__meta">
                    {String(index + 1).padStart(2, "0")} / {section.count}{" "}
                    {section.count === 1 ? "analysis" : "analyses"}
                  </span>
                  <span className="home-domain-card__title">{section.label}</span>
                  <span className="home-domain-card__scope">{sectionScope(section)}</span>
                  <span className="home-domain-card__link">
                    Open domain <span aria-hidden="true">&rarr;</span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {featured && (
        <section
          id="featured-analysis"
          className="shell home-section home-feature-section"
          aria-labelledby="featured-heading"
        >
          <div className="home-section__head">
            <div>
              <p className="home-eyebrow">Featured analysis</p>
              <h2 id="featured-heading">Current field note</h2>
            </div>
          </div>

          <article className="home-feature-card">
            <HomeArtwork
              section={featured.section}
              articleRoute={featured.route}
              className="home-feature-card__visual"
              variant="featured"
              visual={getArticleVisual(featured.sourcePath)}
            />
            <div className="home-feature-card__body">
              <p className="home-card-meta">
                {featured.sectionLabel} <span aria-hidden="true">&middot;</span>{" "}
                {formatArticleType(featured.articleType)}{" "}
                <span aria-hidden="true">&middot;</span> {featured.readingMinutes} min
              </p>
              <h3>
                <ArticleLink href={featured.route}>{featured.title}</ArticleLink>
              </h3>
              {featured.description && <p>{featured.description}</p>}
              <ArticleLink className="home-card-link" href={featured.route}>
                Read analysis <span aria-hidden="true">&rarr;</span>
              </ArticleLink>
            </div>
          </article>
        </section>
      )}

      {selected.length > 0 && (
        <section
          id="selected-analysis"
          className="shell home-section home-latest"
          aria-labelledby="latest-heading"
        >
          <div className="home-section__head">
            <div>
              <p className="home-eyebrow">Across the stack</p>
              <h2 id="latest-heading">Latest technical analyses</h2>
            </div>
            <Link className="home-section__more" href="/library">
              Research library <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>

          <ul className="home-analysis-grid">
            {selected.map((article) => (
              <li key={article.documentId}>
                <article className="home-analysis-card">
                  <HomeArtwork
                    section={article.section}
                    articleRoute={article.route}
                    hero={article.hero}
                    visual={getArticleVisual(article.sourcePath)}
                    className="home-analysis-card__visual"
                  />
                  <div className="home-analysis-card__body">
                    <p className="home-card-meta">
                      {article.sectionLabel} <span aria-hidden="true">&middot;</span>{" "}
                      {article.readingMinutes} min
                    </p>
                    <h3>
                      <ArticleLink href={article.route}>{article.title}</ArticleLink>
                    </h3>
                    {article.description && <p>{article.description}</p>}
                    <ArticleLink className="home-card-link" href={article.route}>
                      Open analysis <span aria-hidden="true">&rarr;</span>
                    </ArticleLink>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
