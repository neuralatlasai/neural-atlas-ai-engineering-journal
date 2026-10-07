import type { ArticleMeta } from "./content/corpus";

/** Prefer the authored field note, then fall back to the strongest described item. */
export function pickFeatured(articles: readonly ArticleMeta[]): ArticleMeta | undefined {
  return (
    articles.find((article) => article.section === "blogs" && article.description) ??
    articles.find((article) => article.description && article.hero) ??
    articles.find((article) => article.description) ??
    articles[0]
  );
}

/** A linear partition preserves section coverage without unbounded nested scans. */
export function selectAcrossSections(
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
