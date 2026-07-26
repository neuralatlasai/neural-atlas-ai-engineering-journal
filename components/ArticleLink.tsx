import type { ReactNode } from "react";
import { internalHref } from "@/lib/site";

/**
 * Link to an article — deliberately a plain anchor, not `next/link`.
 *
 * Articles in this corpus are very large documents: 2–5 MB of rendered HTML and
 * 0.8–2 MB of React Server Component payload each, dominated by tens of
 * thousands of KaTeX nodes. Client-side routing handles that badly in two
 * compounding ways:
 *
 *  - **Prefetch.** `next/link` prefetches every link that enters the viewport.
 *    A listing page with five article rows pulled ~6 MB of payload before the
 *    reader clicked anything.
 *  - **Router cache.** Every visited route stays in the client router cache, so
 *    React keeps each multi-megabyte tree alive for the life of the tab. After
 *    four or five article visits the tab was holding tens of megabytes and
 *    every subsequent navigation had to reconcile against it — the site got
 *    progressively slower the more it was used.
 *
 * A real navigation makes the browser discard the previous document entirely,
 * so memory is flat no matter how long the session runs, and the HTML parser
 * handles a large static document far better than React reconciliation does.
 * The pages are prerendered and CDN-cached, so the load itself is cheap.
 *
 * Light pages — section indexes, topics, about, search, all 12–18 KB — keep
 * using `next/link`, where client-side navigation is genuinely instant.
 */
export function ArticleLink({
  href,
  className,
  children,
  onClick,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <a href={internalHref(href)} className={className} onClick={onClick}>
      {children}
    </a>
  );
}
