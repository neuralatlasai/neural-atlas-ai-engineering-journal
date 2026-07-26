import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getAllArticles,
  getArticleByRoute,
  getSections,
  getPrevNext,
  getRelatedArticles,
  formatArticleType,
  topicSlug,
  readSource,
  assetResolverFor,
  type ArticleMeta,
} from "@/lib/content/corpus";
import { compileArticle } from "@/lib/content/compile";
import { absoluteUrl, site } from "@/lib/site";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/structured-data";
import { ArticleList } from "@/components/ArticleList";
import { ArticleLink } from "@/components/ArticleLink";
import { ArticleOutline } from "@/components/ArticleOutline";
import { ArticleEnhancements } from "@/components/ArticleEnhancements";
import { HeroFigure } from "@/components/HeroFigure";
import { JsonLd } from "@/components/JsonLd";
import { ReadingProgress } from "@/components/ReadingProgress";

/**
 * Fully static: every section index and article route is prerendered, and a
 * path that is not in `generateStaticParams` is a 404.
 *
 * `dynamic = "error"` is deliberately *not* set here. It is redundant —
 * `output: export` already fails the build if a page cannot be rendered
 * statically — and it is actively harmful on a root-level catch-all: it made
 * every unmatched URL throw, so `/anything-wrong` returned a 500 error page in
 * development instead of rendering `not-found.tsx`. Requests the router should
 * simply miss (`/apple-touch-icon.png`, `/site.webmanifest`, HMR probes) all
 * land on this route, and each one produced a server error.
 */
export const dynamicParams = false;

export function generateStaticParams(): { slug: string[] }[] {
  const params: { slug: string[] }[] = [];
  for (const section of getSections()) params.push({ slug: [section.section] });
  for (const article of getAllArticles()) params.push({ slug: article.routeSegments });
  return params;
}

type Resolved =
  | { kind: "section"; section: string; label: string }
  | { kind: "article"; article: ArticleMeta }
  | { kind: "none" };

function resolve(slug: string[]): Resolved {
  if (slug.length === 1) {
    const section = getSections().find((s) => s.section === slug[0].toLowerCase());
    if (section) return { kind: "section", section: section.section, label: section.label };
  }
  const article = getArticleByRoute(slug);
  if (article) return { kind: "article", article };
  return { kind: "none" };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resolved = resolve(slug);

  if (resolved.kind === "article") {
    const { article } = resolved;
    const description = article.description || site.shortDescription;
    const images = article.hero ? [absoluteUrl(article.hero.src)] : undefined;
    return {
      title: article.title,
      description,
      alternates: { canonical: article.route },
      keywords: article.topics.length > 0 ? article.topics : undefined,
      openGraph: {
        type: "article",
        title: article.title,
        description,
        url: article.route,
        siteName: site.name,
        section: article.sectionLabel,
        tags: article.topics,
        images,
      },
      twitter: {
        card: images ? "summary_large_image" : "summary",
        title: article.title,
        description,
        images,
      },
    };
  }

  if (resolved.kind === "section") {
    const description = `${resolved.label} — research and engineering analysis from ${site.name}.`;
    return {
      title: resolved.label,
      description,
      alternates: { canonical: `/${resolved.section}` },
      openGraph: { title: resolved.label, description, url: `/${resolved.section}` },
    };
  }

  return {};
}

export default async function CatchAllPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const resolved = resolve(slug);

  if (resolved.kind === "none") notFound();
  if (resolved.kind === "section") return <SectionIndex section={resolved.section} label={resolved.label} />;

  return <ArticlePage article={resolved.article} />;
}

/** Section index (plan §6.4): scope sentence, then a chronological list. */
function SectionIndex({ section, label }: { section: string; label: string }) {
  const items = getAllArticles().filter((article) => article.section === section);
  const totalMinutes = items.reduce((sum, article) => sum + article.readingMinutes, 0);

  return (
    <div className="shell">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: label, href: `/${section}` },
        ])}
      />
      <section className="page-intro">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
        </nav>
        <p className="eyebrow">Section</p>
        <h1>{label}</h1>
        <p>
          {items.length} {items.length === 1 ? "article" : "articles"}, about{" "}
          {totalMinutes} minutes of reading.
        </p>
      </section>
      <section className="section-block" aria-label={`Articles in ${label}`}>
        <ArticleList articles={items} headingLevel="h2" showSection={false} />
      </section>
    </div>
  );
}

async function ArticlePage({ article }: { article: ArticleMeta }) {
  const compiled = await compileArticle(
    readSource(article.sourcePath),
    article.title,
    assetResolverFor(article.sourcePath),
  );
  const { prev, next } = getPrevNext(article.route);
  const related = getRelatedArticles(article.route);
  // An outline of one or two entries is navigation overhead, not a map. The
  // rail and the collapsible mobile block use the same threshold so a reader
  // never sees one form of the outline appear where the other did not.
  const showOutline = compiled.headings.length > 2;

  return (
    <div className="shell article-shell">
      <ReadingProgress />
      <ArticleEnhancements />
      <JsonLd data={articleJsonLd(article)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: article.sectionLabel, href: `/${article.section}` },
          { name: article.title, href: article.route },
        ])}
      />

      <div className="article-layout">
        <article className="article-main">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true"> / </span>
            <Link href={`/${article.section}`}>{article.sectionLabel}</Link>
          </nav>

          <h1 className="article-title">{article.title}</h1>
          {article.description && <p className="article-deck">{article.description}</p>}

          <div className="article-meta">
            <span className="article-meta__item">
              <span className="pill">{formatArticleType(article.articleType)}</span>
            </span>
            {article.displayDate && (
              <span className="article-meta__item">Published {article.displayDate}</span>
            )}
            <span className="article-meta__item">{article.readingMinutes} min read</span>
            {article.topics.length > 0 && (
              <span className="article-meta__item article-meta__topics">
                {article.topics.map((topic) => (
                  <Link
                    key={topic}
                    className="pill pill--link"
                    href={`/topics#${topicSlug(topic)}`}
                  >
                    {topic}
                  </Link>
                ))}
              </span>
            )}
          </div>

          {/* The hero is chosen from the same `assets/` folder the body draws
              on, so it is often an image the article already renders — and the
              reader then saw the same figure twice, once without its caption or
              surrounding context. Show it only when the body does not. */}
          {article.hero && !compiled.images.includes(article.hero.src) && (
            <HeroFigure hero={article.hero} className="article-hero" priority />
          )}

          {/* Outline lives before the body on narrow viewports, where the sticky
              rail cannot fit (plan §18.2). */}
          {showOutline && (
            <div className="only-narrow">
              <ArticleOutline headings={compiled.headings} variant="inline" />
            </div>
          )}

          <div className="article-body" dangerouslySetInnerHTML={{ __html: compiled.html }} />

          {compiled.references.length > 0 && (
            <section className="article-references" aria-labelledby="references-heading">
              <h2 id="references-heading">References</h2>
              <ol>
                {compiled.references.map((reference) => (
                  <li key={reference.id} id={`ref-${reference.id}`}>
                    <a href={reference.url} target="_blank" rel="noopener noreferrer">
                      {reference.title || reference.url}
                    </a>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {related.length > 0 && (
            <section className="article-related" aria-labelledby="related-heading">
              <h2 id="related-heading">Related analysis</h2>
              <ArticleList articles={related} headingLevel="h3" />
            </section>
          )}

          {(prev || next) && (
            <nav className="prev-next" aria-label="Article navigation">
              {prev ? (
                <ArticleLink href={prev.route} className="prev-next__link">
                  <span className="dir">← Previous</span>
                  <span className="t">{prev.title}</span>
                  <span className="ctx">{prev.sectionLabel}</span>
                </ArticleLink>
              ) : (
                <span aria-hidden="true" />
              )}
              {next ? (
                <ArticleLink
                  href={next.route}
                  className="prev-next__link prev-next__link--next"
                >
                  <span className="dir">Next →</span>
                  <span className="t">{next.title}</span>
                  <span className="ctx">{next.sectionLabel}</span>
                </ArticleLink>
              ) : (
                <span aria-hidden="true" />
              )}
            </nav>
          )}
        </article>

        {showOutline && (
          <aside className="article-rail" aria-label="Article outline">
            <ArticleOutline headings={compiled.headings} variant="rail" />
          </aside>
        )}
      </div>
    </div>
  );
}
