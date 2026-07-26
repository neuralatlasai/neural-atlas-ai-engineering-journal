"use client";

import { highlightParts, tokenize, type SearchHit } from "@/lib/search/query";
import { ArticleLink } from "./ArticleLink";

/**
 * Render matched runs as `<mark>` without constructing HTML from user input
 * (plan §18.5, §22) — the query is split into plain-text parts and React
 * escapes each one.
 */
export function Highlight({ text, terms }: { text: string; terms: string[] }) {
  return (
    <>
      {highlightParts(text, terms).map((part, i) =>
        part.match ? <mark key={i}>{part.text}</mark> : <span key={i}>{part.text}</span>,
      )}
    </>
  );
}

/**
 * Shared result presentation for the `/search` page and the command palette, so
 * a result reads the same wherever it appears.
 */
export function SearchResultList({
  hits,
  query,
  activeIndex,
  onNavigate,
  idPrefix,
}: {
  hits: SearchHit[];
  query: string;
  /** Index of the keyboard-highlighted row; `-1` when the list is not active. */
  activeIndex?: number;
  onNavigate?: () => void;
  idPrefix?: string;
}) {
  const terms = tokenize(query);
  const interactive = activeIndex !== undefined;

  return (
    <ul className="search-results" role={interactive ? "listbox" : undefined}>
      {hits.map((hit, index) => (
        <li
          key={hit.href}
          id={idPrefix ? `${idPrefix}-${index}` : undefined}
          role={interactive ? "option" : undefined}
          aria-selected={interactive ? index === activeIndex : undefined}
          data-active={interactive && index === activeIndex ? "true" : undefined}
        >
          <ArticleLink href={hit.href} onClick={onNavigate}>
            <span className="search-result__crumb">
              {hit.document.sectionLabel}
              {hit.section?.id && hit.section.title !== hit.document.title && (
                <>
                  <span aria-hidden="true"> › </span>
                  <Highlight text={hit.section.title} terms={terms} />
                </>
              )}
            </span>
            <span className="search-result__title">
              <Highlight text={hit.document.title} terms={terms} />
            </span>
            {hit.snippet && (
              <span className="search-result__snippet">
                <Highlight text={hit.snippet} terms={terms} />
              </span>
            )}
          </ArticleLink>
        </li>
      ))}
    </ul>
  );
}
