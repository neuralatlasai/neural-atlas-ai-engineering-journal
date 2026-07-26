import { buildSearchIndex } from "@/lib/content/search";

/**
 * The static search index (plan §18.5).
 *
 * `force-static` makes this a build-time artifact written into the export as a
 * plain JSON file, so the site still needs no server runtime. It is fetched
 * lazily — only when a reader actually opens search.
 */
export const dynamic = "force-static";

export async function GET(): Promise<Response> {
  const index = await buildSearchIndex();
  return new Response(JSON.stringify(index), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      // Content-addressed by deployment rather than by filename, so revalidate
      // instead of caching indefinitely.
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}
