/**
 * schema.org structured data (plan §23).
 *
 * Built from the same corpus metadata the page renders, so the machine-readable
 * description cannot drift from the human-readable one.
 */
import type { ArticleMeta, ArticleType } from "./content/corpus";
import { toIsoDate } from "./content/dates";
import { absoluteAssetUrl, absoluteUrl, site } from "./site";

/**
 * Article type governs the schema type — the plan explicitly forbids marking
 * every page `ScholarlyArticle`. Scholarly is reserved for work presented as
 * research; engineering and release material is `TechArticle`.
 */
const SCHEMA_TYPE: Record<ArticleType, "ScholarlyArticle" | "TechArticle"> = {
  "research-explainer": "ScholarlyArticle",
  survey: "ScholarlyArticle",
  "model-report": "TechArticle",
  "benchmark-report": "TechArticle",
  "engineering-deep-dive": "TechArticle",
  "system-design": "TechArticle",
  "release-note": "TechArticle",
};

const publisher = {
  "@type": "Organization",
  name: site.publisher,
  url: absoluteUrl("/"),
} as const;

export function articleJsonLd(article: ArticleMeta): Record<string, unknown> {
  const url = absoluteUrl(article.route);
  const datePublished = toIsoDate(article.displayDate);

  return {
    "@context": "https://schema.org",
    "@type": SCHEMA_TYPE[article.articleType],
    headline: article.title,
    name: article.title,
    ...(article.description ? { description: article.description } : {}),
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    inLanguage: site.locale,
    isPartOf: { "@type": "Periodical", name: site.name, url: absoluteUrl("/") },
    author: publisher,
    publisher,
    ...(datePublished ? { datePublished } : {}),
    ...(article.topics.length > 0 ? { keywords: article.topics.join(", ") } : {}),
    ...(article.hero ? { image: [absoluteAssetUrl(article.hero.src)] } : {}),
    articleSection: article.sectionLabel,
    wordCount: article.wordCountEstimate,
  };
}

export function breadcrumbJsonLd(
  trail: readonly { name: string; href: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.href),
    })),
  };
}

export function websiteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    alternateName: `${site.name} — ${site.tagline}`,
    description: site.shortDescription,
    url: absoluteUrl("/"),
    inLanguage: site.locale,
    publisher,
  };
}
