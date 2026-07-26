import type { MetadataRoute } from "next";
import { getAllArticles, getSections } from "@/lib/content/corpus";
import { absoluteUrl, staticNav } from "@/lib/site";

/**
 * Sitemap covering every prerendered route (plan §23).
 *
 * `/search` is deliberately excluded: it is a query-parameter surface with no
 * stable indexable content, and it declares `robots: noindex` for the same
 * reason.
 *
 * No `lastModified` is emitted. The corpus carries no reliable modification
 * metadata, and a build clock reading would change the file on every build,
 * defeating both the determinism gate (plan §3.2) and the signal's purpose.
 */
/** Metadata routes must opt into static generation under `output: export`. */
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
  ];

  for (const item of staticNav) {
    entries.push({ url: absoluteUrl(item.href), changeFrequency: "monthly", priority: 0.5 });
  }
  for (const section of getSections()) {
    entries.push({
      url: absoluteUrl(`/${section.section}`),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }
  // Topics are anchored sections of `/topics`, not separate documents, so they
  // carry no sitemap entries of their own.
  for (const article of getAllArticles()) {
    entries.push({
      url: absoluteUrl(article.route),
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  return entries;
}
