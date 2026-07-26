import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

/**
 * Crawler directives (plan §23). Everything public is crawlable; the
 * query-parameter search surface is not, since it produces unbounded URLs with
 * no unique content of their own.
 */
/** Metadata routes must opt into static generation under `output: export`. */
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/search"] }],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
