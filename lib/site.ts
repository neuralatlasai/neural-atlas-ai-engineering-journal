/**
 * Site-level configuration — the single source of truth for publication
 * identity, canonical origin, and global navigation.
 *
 * Everything that needs the site name, description, or absolute URL reads it
 * from here rather than re-declaring a string literal. That keeps metadata,
 * structured data, the sitemap, and the RSS feed consistent by construction
 * instead of by convention.
 *
 * This module is environment-agnostic: it imports nothing from Next.js, React,
 * or the filesystem, so it is safe to use from server components, client
 * islands, route handlers, and tests alike.
 */

/** A navigation destination. `href` is always site-relative and absolute-rooted. */
export interface NavItem {
  readonly href: string;
  readonly label: string;
  /** Longer form used for footer/landmark descriptions where space allows. */
  readonly description?: string;
}

const FALLBACK_ORIGIN = "https://neural-atlas.example";

/**
 * Resolve the canonical origin.
 *
 * Deployment supplies `NEXT_PUBLIC_SITE_URL`; builds without it fall back to a
 * documented placeholder so the build stays deterministic and offline rather
 * than failing. A trailing slash is stripped so `absoluteUrl` can concatenate
 * without producing `//`.
 */
function resolveOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return FALLBACK_ORIGIN;
  try {
    return new URL(raw).origin;
  } catch {
    // An unparseable value is a configuration mistake, not a reason to emit
    // broken canonical URLs into every page.
    return FALLBACK_ORIGIN;
  }
}

/**
 * Path prefix the site is served under, without a trailing slash.
 *
 * GitHub Pages serves a project repository from `/<repo>/`, so every
 * root-relative URL has to carry that prefix or it resolves against the domain
 * root and 404s.
 *
 * Next.js applies `basePath` to what it controls — `next/link`, the router, and
 * the `_next/*` asset URLs — and nothing else. A raw `<a href>`, a form
 * `action`, `location.assign`, `fetch`, and any URL baked into HTML by the
 * content compiler are invisible to it. Those are what this helper exists for,
 * and the rule for using it is exactly that: apply it wherever the browser gets
 * the URL from something other than `next/link`, and nowhere else, or the
 * prefix lands twice.
 *
 * It is empty when the site is served from a domain root, so every call site
 * is safe to wrap unconditionally.
 */
export const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/+$/, "");

/** Prefix a site-relative path with {@link basePath}. */
export function withBasePath(path: string): string {
  return `${basePath}${path.startsWith("/") ? path : `/${path}`}`;
}

export const site = {
  name: "Neural Atlas",
  tagline: "AI Engineering Journal",
  shortDescription:
    "Evidence-grounded research and engineering analysis of frontier AI systems.",
  longDescription:
    "Neural Atlas reconstructs and audits modern model architectures, inference systems, and training methods — grounded in primary source material, preserved losslessly from Markdown, and rendered for careful reading.",
  origin: resolveOrigin(),
  locale: "en",
  /** Used as both author and publisher in structured data. */
  publisher: "Neural Atlas",
} as const;

/** Routes that exist independently of the discovered corpus. */
export const staticNav: readonly NavItem[] = [
  { href: "/library", label: "Research", description: "Browse research by subject area" },
  { href: "/topics", label: "Topics", description: "Analysis grouped by subject area" },
  { href: "/about", label: "About", description: "Method, scope, and editorial standards" },
] as const;

/**
 * Build an absolute URL for a site-relative path.
 *
 * The site is exported with `trailingSlash: true`, so directory-style paths are
 * normalized to match what the CDN actually serves. Paths that carry a file
 * extension (`/feed.xml`) are left alone.
 */
export function absoluteUrl(pathname: string): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${site.origin}${withBasePath(withTrailingSlash(path))}`;
}

/**
 * Absolute URL for a path that already carries the base path.
 *
 * Image URLs reach the renderer from the content manifest with the prefix
 * applied, so they must not go through {@link absoluteUrl} — that applies the
 * prefix itself, and the result would carry it twice. Kept as a separate
 * function rather than a flag so the distinction is visible at the call site.
 */
export function absoluteAssetUrl(rootedUrl: string): string {
  return `${site.origin}${rootedUrl}`;
}

/**
 * The search page, in the trailing-slash form the export actually serves.
 *
 * `next/link` normalizes hrefs for `trailingSlash: true` automatically, but a
 * hand-written `<a href>`, a form `action`, or `location.assign` does not — and
 * a CDN serving `out/` has no `/search` file to answer with, only
 * `/search/index.html`. Every non-`Link` reference goes through this helper so
 * the two cannot drift apart.
 */
export const SEARCH_PATH = withBasePath("/search/");

export function searchUrl(query?: string): string {
  const trimmed = query?.trim();
  return trimmed ? `${SEARCH_PATH}?q=${encodeURIComponent(trimmed)}` : SEARCH_PATH;
}

/**
 * Normalize an internal href — which may carry a query string, a fragment, or
 * both — to the trailing-slash form the export serves.
 *
 * `next/link` does this itself; a hand-written `<a href>` does not, and `/x`
 * has no file in the export (only `/x/index.html`).
 */
export function internalHref(href: string): string {
  const [, path, suffix] = /^([^?#]*)(.*)$/.exec(href) ?? [, href, ""];
  return `${withBasePath(withTrailingSlash(path ?? href))}${suffix ?? ""}`;
}

/** Normalize a site-relative path to the trailing-slash form the export emits. */
export function withTrailingSlash(path: string): string {
  if (path === "/") return "/";
  if (path.endsWith("/")) return path;
  // A dot in the last segment means a real file (feed.xml, search-index.json).
  const lastSegment = path.slice(path.lastIndexOf("/") + 1);
  if (lastSegment.includes(".")) return path;
  return `${path}/`;
}
