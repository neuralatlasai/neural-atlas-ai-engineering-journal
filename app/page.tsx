import Link from "next/link";
import {
  getAllArticles,
  getSections,
  formatArticleType,
  type ArticleMeta,
} from "@/lib/content/corpus";
import { site } from "@/lib/site";
import { websiteJsonLd } from "@/lib/structured-data";
import { ArticleList } from "@/components/ArticleList";
import { ArticleLink } from "@/components/ArticleLink";
import { HeroFigure } from "@/components/HeroFigure";
import { JsonLd } from "@/components/JsonLd";
import { AtlasWorkflowFigure } from "@/components/AtlasWorkflowFigure";

/**
 * Editorial home page (plan §6.3): one featured article, then the latest work,
 * then the section index. No dashboard metrics, no activity feed, no carousel —
 * the corpus is the content.
 */
/**
 * Choose the featured article.
 *
 * The feature block presents a title, a deck, and a hero, so it needs an
 * article that actually has them — leading the home page with a bare title
 * reads as an empty slot. Preference order is deck-and-hero, then deck, then
 * the first article; within each tier the corpus's deterministic order decides,
 * so the choice is stable across builds.
 */
function pickFeatured(articles: readonly ArticleMeta[]): ArticleMeta | undefined {
  return (
    articles.find((article) => article.description && article.hero) ??
    articles.find((article) => article.description) ??
    articles[0]
  );
}

export default function HomePage() {
  const articles = getAllArticles();
  const sections = getSections();
  const featured = pickFeatured(articles);
  const selected = articles
    .filter((article) => article.route !== featured?.route)
    .slice(0, 6);
  const heroSections = sections.slice(0, 3);

  return (
    <div className="home-page">
      <JsonLd data={websiteJsonLd()} />

      <section className="home-hero" aria-labelledby="home-hero-title">
        <nav className="home-hero__rail" aria-label="Homepage sections">
          <span className="home-hero__rail-label">Explore</span>
          <span className="home-hero__rail-line" aria-hidden="true" />
          {featured && <a href="#featured-analysis">01</a>}
          {selected.length > 0 && <a href="#selected-analysis">02</a>}
          <a href="#research-index">03</a>
        </nav>

        <div className="shell home-hero__stage">
          <div className="home-hero__copy">
            <p className="home-hero__trail">
              <span>Home</span>
              <span aria-hidden="true">/</span>
              <span>{site.tagline}</span>
            </p>
            {heroSections.length > 0 && (
              <nav className="home-hero__topics" aria-label="Featured research domains">
                {heroSections.map((section) => (
                  <Link href={`/${section.section}`} key={section.section}>
                    {section.label}
                  </Link>
                ))}
              </nav>
            )}
            <h1 id="home-hero-title">
              <span>Trace the evidence.</span>
              <span>Understand the system.</span>
            </h1>
            <p className="home-hero__deck">{site.longDescription}</p>
            <div className="home-hero__actions">
              {featured ? (
                <ArticleLink className="button button--primary" href={featured.route}>
                  Read the featured analysis
                  <span aria-hidden="true">↗</span>
                </ArticleLink>
              ) : (
                <Link className="button button--primary" href="/library">
                  Explore the research library
                  <span aria-hidden="true">↗</span>
                </Link>
              )}
              <Link className="button home-hero__secondary-action" href="/about">
                Read the method
              </Link>
            </div>
          </div>

          <AtlasWorkflowFigure />

          <dl className="home-hero__facts" aria-label="Publication overview">
            <div>
              <dt>Corpus</dt>
              <dd>{articles.length} long-form analyses</dd>
            </div>
            <div>
              <dt>Coverage</dt>
              <dd>{sections.length} system domains</dd>
            </div>
            <div>
              <dt>Standard</dt>
              <dd>Source-linked and provenance-labelled</dd>
            </div>
          </dl>
        </div>
      </section>

      <div className="shell home-page__body">
        {featured && (
          <section
            id="featured-analysis"
            className="featured featured--home"
            aria-labelledby="featured-heading"
          >
            <div className="home-section-heading">
              <p className="eyebrow">01 / Featured analysis</p>
              <Link className="section-block__more" href="/library">
                Research library <span aria-hidden="true">↗</span>
              </Link>
            </div>
            <div
              className={`featured__grid${featured.hero ? "" : " featured__grid--without-hero"}`}
            >
              {featured.hero && (
                <HeroFigure
                  hero={featured.hero}
                  className="featured__hero"
                  sizes="(max-width: 64rem) calc(100vw - 2rem), (min-width: 100rem) 48rem, 42rem"
                  priority
                />
              )}
              <div className="featured__body">
                <p className="article-row__meta">
                  <span className="pill">{formatArticleType(featured.articleType)}</span>
                  {featured.displayDate && <span>{featured.displayDate}</span>}
                  <span>{featured.sectionLabel}</span>
                  <span>{featured.readingMinutes} min read</span>
                </p>
                <h2 className="featured__title" id="featured-heading">
                  <ArticleLink href={featured.route}>{featured.title}</ArticleLink>
                </h2>
                {featured.description && (
                  <p className="featured__desc">{featured.description}</p>
                )}
                <ArticleLink className="featured__link" href={featured.route}>
                  Open analysis <span aria-hidden="true">→</span>
                </ArticleLink>
              </div>
            </div>
          </section>
        )}

        {selected.length > 0 && (
          <section
            id="selected-analysis"
            className="section-block home-index"
            aria-labelledby="latest-heading"
          >
            <div className="section-block__head">
              <div>
                <p className="eyebrow">02 / Selected analysis</p>
                <h2 id="latest-heading">Read across the stack.</h2>
              </div>
              <Link className="section-block__more" href="/search">
                Browse all <span aria-hidden="true">↗</span>
              </Link>
            </div>
            <ArticleList articles={selected} headingLevel="h3" />
          </section>
        )}

        <section
          id="research-index"
          className="section-block home-sections"
          aria-labelledby="sections-heading"
        >
          <div className="section-block__head">
            <div>
              <p className="eyebrow">03 / Research index</p>
              <h2 id="sections-heading">Choose a system layer.</h2>
            </div>
            <Link className="section-block__more" href="/topics">
              View topics <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <ol className="section-grid">
            {sections.map((section, index) => (
              <li key={section.section}>
                <Link href={`/${section.section}`}>
                  <span className="section-grid__index" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="section-grid__label">{section.label}</span>
                  <span className="section-grid__count">
                    {section.count} {section.count === 1 ? "analysis" : "analyses"}
                  </span>
                  <span className="section-grid__arrow" aria-hidden="true">
                    ↗
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
