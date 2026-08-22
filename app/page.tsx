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
import { ArticleList } from "@/components/ArticleList";
import { AtlasWorkflowFigure } from "@/components/AtlasWorkflowFigure";
import { HeroFigure } from "@/components/HeroFigure";
import { JsonLd } from "@/components/JsonLd";

type SectionSummary = ReturnType<typeof getSections>[number];

const SECTION_SCOPE: Readonly<Record<string, string>> = {
  components: "Building blocks, layers, modules, and interfaces",
  engineering: "Systems methods, tooling, and implementation",
  models: "Architectures, scaling laws, and design patterns",
  research: "Papers, reports, benchmarks, and datasets",
  training: "Data, optimization, infrastructure, and evaluation",
};

function sectionScope(section: SectionSummary): string {
  return SECTION_SCOPE[section.section] ?? `Technical analyses in ${section.label}`;
}

/** Choose a stable feature with enough authored material to carry the wide row. */
function pickFeatured(articles: readonly ArticleMeta[]): ArticleMeta | undefined {
  return (
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

      <section className="home-intro" aria-labelledby="home-hero-title">
        <div className="shell home-intro__grid">
          <div className="home-intro__copy">
            <p className="home-label">Technical field guide</p>
            <h1 id="home-hero-title">
              <span>Trace the evidence.</span>
              <span>Understand the system.</span>
            </h1>
            <p className="home-intro__deck">{site.longDescription}</p>
          </div>
        </div>
      </section>

      <section className="home-atlas" aria-labelledby="research-index-heading">
        <div className="shell home-atlas__grid">
          <div className="home-research-index">
            <div className="home-research-index__head">
              <h2 id="research-index-heading">Research index</h2>
              <span>Scope</span>
              <span>Analyses</span>
            </div>
            <ol>
              {sections.map((section) => (
                <li key={section.section}>
                  <Link href={`/${section.section}`}>
                    <span className="home-research-index__label">{section.label}</span>
                    <span className="home-research-index__scope">
                      {sectionScope(section)}
                    </span>
                    <span className="home-research-index__count">
                      {String(section.count).padStart(2, "0")}
                    </span>
                    <span className="home-research-index__arrow" aria-hidden="true">
                      &rarr;
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>

          <div className="home-topology">
            <AtlasWorkflowFigure />
          </div>
        </div>
      </section>

      {featured && (
        <section
          id="featured-analysis"
          className="home-featured"
          aria-labelledby="featured-heading"
        >
          <div
            className={`shell home-featured__grid${
              featured.hero ? "" : " home-featured__grid--without-hero"
            }`}
          >
            <p className="home-label home-featured__label">Featured analysis</p>
            {featured.hero && (
              <HeroFigure
                hero={featured.hero}
                className="home-featured__hero"
                sizes="(max-width: 48rem) calc(100vw - 2rem), 18rem"
                priority
              />
            )}
            <div className="home-featured__body">
              <p className="home-featured__kicker">
                {featured.sectionLabel} <span aria-hidden="true">/</span>{" "}
                {formatArticleType(featured.articleType)}
              </p>
              <h2 id="featured-heading">
                <ArticleLink href={featured.route}>{featured.title}</ArticleLink>
              </h2>
              {featured.description && (
                <p className="home-featured__desc">{featured.description}</p>
              )}
            </div>
            <dl className="home-featured__meta">
              <div>
                <dt>Read time</dt>
                <dd>{featured.readingMinutes} min</dd>
              </div>
              <div>
                <dt>Section</dt>
                <dd>{featured.sectionLabel}</dd>
              </div>
              <div>
                <dt>Format</dt>
                <dd>{formatArticleType(featured.articleType)}</dd>
              </div>
            </dl>
            <ArticleLink className="button home-featured__action" href={featured.route}>
              Read analysis <span aria-hidden="true">&rarr;</span>
            </ArticleLink>
          </div>
        </section>
      )}

      {selected.length > 0 && (
        <section
          id="selected-analysis"
          className="shell section-block home-index"
          aria-labelledby="latest-heading"
        >
          <div className="section-block__head">
            <div>
              <p className="home-label">Across the stack</p>
              <h2 id="latest-heading">Selected analysis</h2>
            </div>
            <Link className="section-block__more" href="/library">
              Research library <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
          <ArticleList articles={selected} headingLevel="h3" />
        </section>
      )}
    </div>
  );
}
