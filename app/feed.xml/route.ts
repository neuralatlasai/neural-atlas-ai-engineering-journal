import { getAllArticles } from "@/lib/content/corpus";
import { toRfc822 } from "@/lib/content/dates";
import { absoluteUrl, site } from "@/lib/site";

/**
 * RSS 2.0 feed for the whole journal (plan §23).
 *
 * Generated statically at build time, so the export still needs no server.
 */
export const dynamic = "force-static";

/** Escape the five XML predefined entities. Never interpolate raw text. */
function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function GET(): Response {
  const articles = getAllArticles();

  const items = articles
    .map((article) => {
      const url = absoluteUrl(article.route);
      const pubDate = toRfc822(article.displayDate);
      return [
        "    <item>",
        `      <title>${xmlEscape(article.title)}</title>`,
        `      <link>${xmlEscape(url)}</link>`,
        `      <guid isPermaLink="true">${xmlEscape(url)}</guid>`,
        `      <category>${xmlEscape(article.sectionLabel)}</category>`,
        article.description
          ? `      <description>${xmlEscape(article.description)}</description>`
          : null,
        pubDate ? `      <pubDate>${pubDate}</pubDate>` : null,
        "    </item>",
      ]
        .filter((line): line is string => line !== null)
        .join("\n");
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(`${site.name} — ${site.tagline}`)}</title>
    <link>${xmlEscape(absoluteUrl("/"))}</link>
    <description>${xmlEscape(site.shortDescription)}</description>
    <language>${site.locale}</language>
    <atom:link href="${xmlEscape(absoluteUrl("/feed.xml"))}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}
