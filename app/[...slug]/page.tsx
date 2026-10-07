import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import {
  getAllArticles,
  getArticleByRoute,
  getFolderContents,
  getSections,
  getPrevNext,
  getRelatedArticles,
  formatArticleType,
  topicSlug,
  readSource,
  assetResolverFor,
  type ArticleMeta,
} from "@/lib/content/corpus";
import { compileArticle, type HeadingRecord } from "@/lib/content/compile";
import { markdownPathFor } from "@/lib/content/llms";
import { absoluteAssetUrl, absoluteUrl, site } from "@/lib/site";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/structured-data";
import { ArticleList } from "@/components/ArticleList";
import { ArticleLink } from "@/components/ArticleLink";
import { ArticleOutline } from "@/components/ArticleOutline";
import { ArticleEnhancements } from "@/components/ArticleEnhancements";
import { HeroFigure } from "@/components/HeroFigure";
import { FolderPage } from "@/components/FolderPage";
import { JsonLd } from "@/components/JsonLd";
import { ReadingProgress } from "@/components/ReadingProgress";
import { ArticleVisualFigure } from "@/components/visuals/ArticleVisualFigure";
import { getArticleVisual } from "@/lib/visuals/catalog";
import { explorersForArticle } from "@/lib/explorers/catalog";
import { ExplorerLinks } from "@/components/ExplorerLinks";
import articleAtmosphere from "@/app/assets/article-atmosphere.webp";

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
/**
 * Only the routes `generateStaticParams` produced are served; anything else is
 * a 404. `resolve()` also calls `notFound()` for a path that matches no
 * document, so an unknown slug is a 404 by both routes.
 *
 * This must be a literal. Next parses these exports statically and rejects any
 * expression — `process.env.NODE_ENV !== "production"` fails the build with
 * `Unsupported node type "BinaryExpression" at "dynamicParams"` — so it cannot
 * be relaxed for development only. Newly added Markdown appears in listings
 * immediately (the corpus cache is mtime-keyed), but its own page needs the dev
 * server to re-evaluate this route.
 */
export const dynamicParams = false;

export function generateStaticParams(): { slug: string[] }[] {
  const params: { slug: string[] }[] = [];
  for (const section of getSections()) params.push({ slug: [section.section] });
  for (const article of getAllArticles())
    params.push({ slug: article.routeSegments });
  return params;
}

type Resolved =
  | { kind: "section"; section: string; label: string }
  | { kind: "article"; article: ArticleMeta }
  | { kind: "none" };

function resolve(slug: string[]): Resolved {
  if (slug.length === 1) {
    const section = getSections().find(
      (s) => s.section === slug[0].toLowerCase(),
    );
    if (section)
      return {
        kind: "section",
        section: section.section,
        label: section.label,
      };
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
    // `hero.src` already carries the base path, so it must not be re-prefixed.
    const images = article.hero
      ? [absoluteAssetUrl(article.hero.src)]
      : undefined;
    return {
      title: article.title,
      description,
      alternates: {
        canonical: absoluteUrl(article.route),
        // The document's Markdown twin, so an agent that lands on the page can
        // fetch the source instead of parsing the rendering.
        types: {
          "text/markdown": [
            { url: absoluteUrl(markdownPathFor(article)), title: `${article.title} (Markdown)` },
          ],
        },
      },
      keywords: article.topics.length > 0 ? article.topics : undefined,
      openGraph: {
        type: "article",
        title: article.title,
        description,
        url: absoluteUrl(article.route),
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
      alternates: { canonical: absoluteUrl(`/${resolved.section}`) },
      openGraph: {
        title: resolved.label,
        description,
        url: absoluteUrl(`/${resolved.section}`),
      },
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
  if (resolved.kind === "section")
    return <SectionIndex section={resolved.section} />;

  return <ArticlePage article={resolved.article} />;
}

/** Section index (plan §6.4): scope sentence, then a chronological list. */
function SectionIndex({ section }: { section: string }) {
  const contents = getFolderContents([section]);
  if (!contents) notFound();
  return (
    <FolderPage
      contents={contents}
      canonicalRoute={`/${section}`}
      eyebrow="Section"
    />
  );
}

async function ArticlePage({ article }: { article: ArticleMeta }) {
  const visual = getArticleVisual(article.sourcePath);
  const compiled = await compileArticle(
    readSource(article.sourcePath),
    article.title,
    assetResolverFor(article.sourcePath),
  );
  const { prev, next } = getPrevNext(article.route);
  const related = getRelatedArticles(article.route);
  const folderBreadcrumbs = article.folderLabels.map((name, index) => ({
    name,
    href:
      index === 0
        ? `/${article.folderSegments[0]}`
        : `/library/${article.folderSegments.slice(0, index + 1).join("/")}`,
  }));
  // An outline of one or two entries is navigation overhead, not a map. The
  // rail and the collapsible mobile block use the same threshold so a reader
  // never sees one form of the outline appear where the other did not.
  const showOutline = compiled.headings.length > 2;
  const isEditorialBlog = article.section === "blogs";
  // Editorial blogs expose their compact section index in the masthead. A
  // second desktop rail duplicates that navigation, leaves an empty column,
  // and can degrade into a stack of unexplained ticks when its labels are
  // visually hidden. Non-blog articles retain the full outline rail.
  const showRailOutline = showOutline && !isEditorialBlog;
  // A blog's own resolved lead figure is its masthead identity. The shared
  // atmosphere is intentionally only a fallback for sources with no image, so
  // newly added illustrated blogs do not inherit a repeated global cover.
  const articleAtmosphereSrc = article.hero?.src ?? articleAtmosphere.src;
  const articleStyle = isEditorialBlog
    ? ({
        "--article-atmosphere-image": `url("${articleAtmosphereSrc}")`,
      } as CSSProperties)
    : undefined;

  return (
    <div
      className={`shell article-shell${
        isEditorialBlog ? " article-shell--anthropic" : ""
      }`}
      style={articleStyle}
    >
      <ReadingProgress />
      <ArticleEnhancements />
      <JsonLd data={articleJsonLd(article)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          ...folderBreadcrumbs,
          { name: article.title, href: article.route },
        ])}
      />

      <article
        className={`article-page${
          isEditorialBlog ? " article-page--anthropic" : ""
        }`}
      >
        <header className="article-header">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            {folderBreadcrumbs.map((breadcrumb) => (
              <span key={breadcrumb.href}>
                <span aria-hidden="true"> / </span>
                <Link href={breadcrumb.href}>{breadcrumb.name}</Link>
              </span>
            ))}
          </nav>

          <p className="article-kicker">
            {formatArticleType(article.articleType)}
          </p>
          <h1 className="article-title">{article.title}</h1>
          {article.description && (
            <p className="article-deck">{article.description}</p>
          )}

          <div className="article-meta">
            {article.displayDate && (
              <span className="article-meta__item">
                Published {article.displayDate}
              </span>
            )}
            <span className="article-meta__item">
              {article.readingMinutes} min read
            </span>
            {article.topics.length > 0 && (
              <span className="article-meta__item article-meta__topics">
                {article.topics.map((topic) => (
                  <Link
                    key={topic}
                    className="article-meta__topic"
                    href={`/topics#${topicSlug(topic)}`}
                  >
                    {topic}
                  </Link>
                ))}
              </span>
            )}
          </div>

          {isEditorialBlog && showOutline && (
            <ArticleHeroContents headings={compiled.headings} />
          )}
        </header>

        {/* A lead figure belongs to the centred editorial opening. If the body
            already contains that asset, it stays in its authored technical
            context instead of being published twice. */}
        {article.hero && !compiled.images.includes(article.hero.src) && (
          <HeroFigure
            hero={article.hero}
            className="article-hero"
            priority
            caption={`Lead figure · ${article.title}`}
          />
        )}

        <div
          className={`article-layout article-layout--${
            showRailOutline ? "with-outline" : "without-outline"
          }`}
        >
          <div className="article-main">
            {/* Graphical abstracts introduce the central mechanism before the
                technical body. Existing authored figures retain their context. */}
            <ExplorerLinks items={explorersForArticle(article.sourcePath)} />
            {visual && <ArticleVisualFigure visual={visual} />}
            {/* Outline lives before the body on narrow viewports, where the sticky
              rail cannot fit (plan §18.2). */}
            {showOutline && !isEditorialBlog && (
              <div className="only-narrow">
                <ArticleOutline headings={compiled.headings} variant="inline" />
              </div>
            )}

            <div
              className="article-body"
              dangerouslySetInnerHTML={{ __html: compiled.html }}
            />

            {compiled.references.length > 0 && (
              <section
                className="article-references"
                aria-labelledby="references-heading"
              >
                <h2 id="references-heading">References</h2>
                <ol>
                  {compiled.references.map((reference) => (
                    <li key={reference.id} id={`ref-${reference.id}`}>
                      <a
                        href={reference.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {reference.title || reference.url}
                      </a>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {related.length > 0 && (
              <section
                className="article-related"
                aria-labelledby="related-heading"
              >
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
                    <span className="ctx">{prev.folderLabels.join(" / ")}</span>
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
                    <span className="ctx">{next.folderLabels.join(" / ")}</span>
                  </ArticleLink>
                ) : (
                  <span aria-hidden="true" />
                )}
              </nav>
            )}
          </div>

          {showRailOutline && (
            <aside className="article-rail" aria-label="Article outline">
              <ArticleOutline headings={compiled.headings} variant="rail" />
            </aside>
          )}
        </div>
      </article>
    </div>
  );
}

/**
 * A short, scan-first contents index for the editorial blog masthead.
 *
 * The complete document remains addressable through its heading anchors. Blogs
 * intentionally use this one index instead of repeating the same navigation in
 * a desktop rail or labelled mobile disclosure. Limiting it to five entries
 * keeps the masthead bounded while preserving deterministic O(n) selection.
 */
function ArticleHeroContents({ headings }: { headings: HeadingRecord[] }) {
  const entries = headings.filter((heading) => heading.depth === 2).slice(0, 5);
  if (entries.length === 0) return null;

  return (
    <nav className="article-hero-contents" aria-label="Article contents">
      <ol>
        {entries.map((heading, index) => (
          <li key={heading.id}>
            <span className="article-hero-contents__index" aria-hidden="true">
              [{index + 1}]
            </span>
            <span className="article-hero-contents__leader" aria-hidden="true" />
            <a href={`#${heading.id}`}>{heading.text}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
