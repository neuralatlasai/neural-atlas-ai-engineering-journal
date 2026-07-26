"use client";

import { useEffect, useState } from "react";
import type { HeadingRecord } from "@/lib/content/compile";

/**
 * Outline built from AST heading records (plan §18.2). All entries are real
 * anchors that work without JavaScript; the active-section highlight is a
 * progressive enhancement using a single shared IntersectionObserver.
 */
export function ArticleOutline({
  headings,
  variant,
}: {
  headings: HeadingRecord[];
  variant: "rail" | "inline";
}) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (variant !== "rail") return;
    const targets = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        // Highlight the first heading currently in view, in document order.
        const firstVisible = headings.find((h) => visible.has(h.id));
        if (firstVisible) setActiveId(firstVisible.id);
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [headings, variant]);

  if (headings.length === 0) return null;

  // Both variants live in the DOM (CSS shows one per breakpoint), so only the
  // rail carries the aria-label — otherwise the raw document contains two
  // identically-labelled navigation landmarks. The inline variant is already
  // named by its <summary>.
  const list = (
    <nav aria-label={variant === "rail" ? "On this page" : undefined}>
      <ol>
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              data-depth={h.depth}
              aria-current={variant === "rail" && activeId === h.id ? "true" : undefined}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );

  if (variant === "inline") {
    return (
      <details className="outline outline--inline">
        <summary>On this page</summary>
        <div style={{ marginTop: "0.75rem" }}>{list}</div>
      </details>
    );
  }

  return (
    <div className="outline">
      <div className="outline__label">On this page</div>
      {list}
    </div>
  );
}
