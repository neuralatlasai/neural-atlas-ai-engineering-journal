"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { search } from "@/lib/search/query";
import { internalHref, SEARCH_PATH, searchUrl } from "@/lib/site";
import { SearchResultList } from "./SearchResultList";
import { useDialogBehavior } from "./useDialogBehavior";
import { useSearchIndex } from "./useSearchIndex";

const MAX_RESULTS = 8;

/** True when a keystroke is being typed into an editable field. */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}

/**
 * Header search affordance and command palette (plan §18.5).
 *
 * The index is fetched only on first open, so pages a reader never searches
 * from pay nothing for it. Full results always remain reachable at `/search`,
 * which works without JavaScript — the palette is an accelerator, not the only
 * way in.
 *
 * Implements the ARIA combobox pattern: the input keeps focus and owns
 * `aria-activedescendant` while ↑/↓ move the highlight through the listbox.
 */
export function SearchPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();
  const optionPrefix = `${listboxId}-option`;

  const { index, status } = useSearchIndex(open);
  const hits = useMemo(
    () => search(index, query, { limit: MAX_RESULTS }),
    [index, query],
  );

  const close = useCallback(() => setOpen(false), []);

  useDialogBehavior({
    open,
    onClose: close,
    panelRef,
    initialFocusRef: inputRef,
    returnFocusRef: triggerRef,
  });

  // Global shortcuts: ⌘K / Ctrl-K anywhere, and "/" outside a text field.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isCommandK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      const isSlash = event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey;
      if (!isCommandK && !isSlash) return;
      if (isSlash && isEditableTarget(event.target)) return;
      event.preventDefault();
      setOpen(true);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // A new result set invalidates the previous highlight position.
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  /**
   * Open a result. A real navigation rather than `router.push` for the same
   * reason `ArticleLink` uses a plain anchor: article routes are multi-megabyte
   * documents that must not accumulate in the client router cache.
   */
  const go = useCallback((href: string) => {
    setOpen(false);
    setQuery("");
    window.location.assign(internalHref(href));
  }, []);

  /**
   * Hand off to the full results page.
   *
   * A real navigation, not `router.push`: `/search` reads its query from
   * `window.location`, and a client-side push to the route the reader may
   * already be on would change the URL without the page noticing.
   */
  const openFullResults = useCallback((searchQuery: string) => {
    window.location.assign(searchUrl(searchQuery));
  }, []);

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (hits.length === 0) return;
      event.preventDefault();
      const delta = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((current) => (current + delta + hits.length) % hits.length);
      return;
    }
    if (event.key === "Home" && hits.length > 0) {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }
    if (event.key === "End" && hits.length > 0) {
      event.preventDefault();
      setActiveIndex(hits.length - 1);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const hit = hits[activeIndex];
      if (hit) go(hit.href);
      else if (query.trim()) openFullResults(query.trim());
    }
  };

  // Keep the highlighted option scrolled into view during keyboard traversal.
  useEffect(() => {
    if (!open) return;
    document
      .getElementById(`${optionPrefix}-${activeIndex}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open, optionPrefix]);

  const trimmed = query.trim();

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="search-trigger"
        onClick={() => setOpen(true)}
        aria-label="Search the journal"
      >
        <SearchIcon />
        <span className="search-trigger__text">Search</span>
        <kbd className="search-trigger__kbd" aria-hidden="true">
          /
        </kbd>
      </button>

      {open && (
        <div className="overlay overlay--top" role="presentation" onClick={close}>
          <div
            ref={panelRef}
            className="palette"
            role="dialog"
            aria-modal="true"
            aria-label="Search the journal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="palette__field">
              <SearchIcon />
              <input
                ref={inputRef}
                type="search"
                className="palette__input"
                placeholder="Search articles, sections, and code…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onInputKeyDown}
                role="combobox"
                aria-expanded={hits.length > 0}
                aria-controls={listboxId}
                aria-autocomplete="list"
                aria-activedescendant={
                  hits.length > 0 ? `${optionPrefix}-${activeIndex}` : undefined
                }
                autoComplete="off"
                spellCheck={false}
                enterKeyHint="search"
              />
              <button type="button" className="icon-button" onClick={close} aria-label="Close search">
                <span aria-hidden="true">✕</span>
              </button>
            </div>

            <div className="palette__body" id={listboxId}>
              {status === "loading" && trimmed === "" && (
                <p className="palette__hint">Loading the search index…</p>
              )}
              {status === "error" && (
                <p className="palette__hint palette__hint--error" role="alert">
                  The search index could not be loaded.{" "}
                  <a href={SEARCH_PATH}>Browse everything instead</a>.
                </p>
              )}
              {status !== "error" && trimmed === "" && (
                <p className="palette__hint">
                  Type to search titles, section headings, prose, and code.
                </p>
              )}
              {status === "ready" && trimmed !== "" && hits.length === 0 && (
                <p className="palette__hint">
                  No matches for <strong>{trimmed}</strong>.
                </p>
              )}
              {hits.length > 0 && (
                <SearchResultList
                  hits={hits}
                  query={query}
                  activeIndex={activeIndex}
                  idPrefix={optionPrefix}
                  onNavigate={() => {
                    setOpen(false);
                    setQuery("");
                  }}
                />
              )}
            </div>

            <div className="palette__foot">
              <span>
                <kbd>↑</kbd> <kbd>↓</kbd> to navigate · <kbd>↵</kbd> to open ·{" "}
                <kbd>Esc</kbd> to close
              </span>
              {trimmed !== "" && (
                <a href={searchUrl(trimmed)}>All results →</a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SearchIcon() {
  return (
    <svg
      className="search-icon"
      viewBox="0 0 20 20"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="8.5" cy="8.5" r="5.5" />
      <path d="M12.8 12.8 L17 17" />
    </svg>
  );
}
