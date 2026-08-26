import { buildLlmsFullTxt } from "@/lib/content/llms";

/**
 * `/llms-full.txt` — the whole corpus as one Markdown stream (plan §23).
 *
 * The companion to `/llms.txt`: an agent that wants the publication rather than
 * one document fetches this instead of crawling every page. Built statically for
 * the same reason as the index.
 */
export const dynamic = "force-static";

export function GET(): Response {
  return new Response(buildLlmsFullTxt(), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}
