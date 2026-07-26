"use client";

import { useEffect, useState } from "react";
import {
  SEARCH_INDEX_PATH,
  SEARCH_INDEX_VERSION,
  type SearchIndex,
} from "@/lib/search/types";

export type SearchIndexStatus = "idle" | "loading" | "ready" | "error";

/** Shared across every consumer so the index is fetched at most once per page. */
let inFlight: Promise<SearchIndex> | null = null;
let resolved: SearchIndex | null = null;

function isSearchIndex(value: unknown): value is SearchIndex {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<SearchIndex>;
  return candidate.version === SEARCH_INDEX_VERSION && Array.isArray(candidate.documents);
}

/**
 * Fetch the static index, validating its shape before use.
 *
 * A version mismatch or malformed payload is treated as a failure rather than
 * being coerced — a stale cached index from a previous deployment should
 * degrade to "search unavailable", not to silently wrong results.
 */
export function loadSearchIndex(): Promise<SearchIndex> {
  if (resolved) return Promise.resolve(resolved);
  if (inFlight) return inFlight;

  inFlight = fetch(SEARCH_INDEX_PATH, { credentials: "same-origin" })
    .then(async (response) => {
      if (!response.ok) throw new Error(`Search index request failed: ${response.status}`);
      const payload: unknown = await response.json();
      if (!isSearchIndex(payload)) throw new Error("Search index payload is not recognized");
      resolved = payload;
      return payload;
    })
    .catch((error: unknown) => {
      // Clear the memo so a later attempt can retry a transient failure.
      inFlight = null;
      throw error;
    });

  return inFlight;
}

/**
 * Load the search index once `enabled` becomes true — search costs nothing on
 * pages where the reader never opens it (plan §18.5, §21.4).
 */
export function useSearchIndex(enabled: boolean): {
  index: SearchIndex | null;
  status: SearchIndexStatus;
} {
  const [index, setIndex] = useState<SearchIndex | null>(resolved);
  const [status, setStatus] = useState<SearchIndexStatus>(resolved ? "ready" : "idle");

  useEffect(() => {
    if (!enabled || resolved) {
      if (resolved && status !== "ready") {
        setIndex(resolved);
        setStatus("ready");
      }
      return;
    }

    let cancelled = false;
    setStatus("loading");
    loadSearchIndex().then(
      (loaded) => {
        if (cancelled) return;
        setIndex(loaded);
        setStatus("ready");
      },
      () => {
        if (!cancelled) setStatus("error");
      },
    );
    return () => {
      cancelled = true;
    };
    // `status` is read only to reconcile an already-resolved index; including it
    // would re-run the effect on every transition it sets.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { index, status };
}
