import { buildLlmsTxt } from "@/lib/content/llms";

/**
 * `/llms.txt` — the llmstxt.org index (plan §23).
 *
 * `force-static` writes it into the export as a real file at the site root, so
 * the hosted site serves it with no runtime, exactly like `robots.txt` and
 * `sitemap.xml`.
 */
export const dynamic = "force-static";

export function GET(): Response {
  return new Response(buildLlmsTxt(), {
    headers: {
      // The convention is a `.txt` file whose body is Markdown; `text/plain` is
      // what static hosts serve it as, and what agents expect to receive.
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}
