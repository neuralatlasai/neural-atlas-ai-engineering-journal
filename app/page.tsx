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
  const rest = articles.filter((article) => article.route !== featured?.route);

  return (
    <div className="shell">
      <JsonLd data={websiteJsonLd()} />

      <section className="home-hero">
        <div className="home-hero__copy">
          <p className="eyebrow">{site.tagline}</p>
          <h1>Evidence-grounded analysis of frontier AI systems.</h1>
          <p>{site.longDescription}</p>
          <p className="home-hero__actions">
            {sections[0] && (
              <Link className="button button--primary" href={`/${sections[0].section}`}>
                Start reading
              </Link>
            )}
            <Link className="button" href="/about">
              How this is written
            </Link>
          </p>
        </div>
        <AtlasWorkflowFigure />
      </section>

      {featured && (
        <section className="featured" aria-labelledby="featured-heading">
          <p className="eyebrow" id="featured-heading">
            Featured
          </p>
          {featured.hero && (
            <HeroFigure
              hero={featured.hero}
              className="featured__hero"
              sizes="(max-width: 48rem) 100vw, (max-width: 75rem) 92vw, 60rem"
              priority
            />
          )}
          <div className="featured__body">
            <h2 className="featured__title">
              <ArticleLink href={featured.route}>{featured.title}</ArticleLink>
            </h2>
            {featured.description && (
              <p className="featured__desc">{featured.description}</p>
            )}
            <p className="article-row__meta">
              <span className="pill">{formatArticleType(featured.articleType)}</span>
              {featured.displayDate && <span>{featured.displayDate}</span>}
              <span>{featured.sectionLabel}</span>
              <span>{featured.readingMinutes} min read</span>
            </p>
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <section className="section-block" aria-labelledby="latest-heading">
          <div className="section-block__head">
            <h2 id="latest-heading">Latest</h2>
            <Link className="section-block__more" href="/search">
              Browse all →
            </Link>
          </div>
          <ArticleList articles={rest} headingLevel="h3" />
        </section>
      )}

      <section className="section-block" aria-labelledby="sections-heading">
        <div className="section-block__head">
          <h2 id="sections-heading">Sections</h2>
        </div>
        <ul className="section-grid">
          {sections.map((section) => (
            <li key={section.section}>
              <Link href={`/${section.section}`}>
                <span className="section-grid__label">{section.label}</span>
                <span className="section-grid__count">
                  {section.count} {section.count === 1 ? "article" : "articles"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
