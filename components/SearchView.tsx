"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { search } from "@/lib/search/query";
import { SEARCH_PATH, searchUrl } from "@/lib/site";
import { SearchResultList } from "./SearchResultList";
import { useSearchIndex } from "./useSearchIndex";

const MAX_RESULTS = 40;
const URL_SYNC_DELAY_MS = 250;

/** Read `?q=` from the address bar. Returns "" during server rendering. */
function queryFromLocation(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("q") ?? "";
}

/**
 * The `/search` results surface (plan §18.5).
 *
 * Progressive enhancement throughout:
 *  - the field is a real `GET` form targeting `/search`, so submitting it
 *    without JavaScript performs an ordinary navigation;
 *  - the query lives in the URL, so results are linkable and shareable;
 *  - with no query — including in the statically exported HTML — the full
 *    browse list passed as `children` is shown, so the page is never a dead end.
 *
 * The query is read from `window.location` rather than `useSearchParams`
 * deliberately. Under `output: export` that hook forces its whole Suspense
 * boundary to bail out to client rendering, which stripped `children` from the
 * exported HTML and left a JavaScript-less visitor with an empty page. Reading
 * `location` directly keeps every byte of the fallback in the static document.
 */
export function SearchView({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const hasQuery = query.trim().length > 0;

  const { index, status } = useSearchIndex(true);
  const hits = useMemo(() => search(index, query, { limit: MAX_RESULTS }), [index, query]);

  // Adopt the URL on mount and on every back/forward navigation.
  useEffect(() => {
    const sync = () => setQuery(queryFromLocation());
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  // Mirror typing into the URL without stacking a history entry per keystroke.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === queryFromLocation().trim()) return;
    const timer = window.setTimeout(() => {
      window.history.replaceState(null, "", searchUrl(trimmed));
    }, URL_SYNC_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  const clear = useCallback(() => {
    setQuery("");
    inputRef.current?.focus();
  }, []);

  const resultsLabel = hasQuery
    ? `${hits.length} ${hits.length === 1 ? "result" : "results"} for “${query.trim()}”`
    : "";

  const showBrowseList = status === "error" || !hasQuery;

  return (
    <>
      <form
        className="search-form"
        role="search"
        action={SEARCH_PATH}
        method="get"
        onSubmit={(event) => {
          // With JavaScript the URL is already in sync and the index is loaded;
          // a full navigation would only discard both.
          event.preventDefault();
          inputRef.current?.blur();
        }}
      >
        <label className="visually-hidden" htmlFor="site-search">
          Search the journal
        </label>
        <input
          ref={inputRef}
          id="site-search"
          name="q"
          type="search"
          className="search-form__input"
          placeholder="Search articles, sections, and code…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
        />
        <button type="submit" className="button button--primary">
          Search
        </button>
      </form>

      {/* Result counts are announced, not only shown. */}
      <p className="search-status" role="status" aria-live="polite">
        {status === "error"
          ? "The search index could not be loaded. The full list of articles is below."
          : hasQuery && status === "loading"
            ? "Searching…"
            : resultsLabel}
      </p>

      {!showBrowseList &&
        (hits.length > 0 ? (
          <SearchResultList hits={hits} query={query} />
        ) : status === "ready" ? (
          <div className="search-empty">
            <p>
              No results for <strong>{query.trim()}</strong>.
            </p>
            <p>
              Try a broader term, a single identifier, or{" "}
              <button type="button" className="link-button" onClick={clear}>
                browse everything
              </button>
              .
            </p>
          </div>
        ) : null)}

      {/* Always present in the DOM and in the exported HTML; hidden only once a
          query has produced a result set to replace it. */}
      <section
        className="section-block"
        aria-label="All articles"
        hidden={!showBrowseList}
      >
        {children}
      </section>
    </>
  );
}
