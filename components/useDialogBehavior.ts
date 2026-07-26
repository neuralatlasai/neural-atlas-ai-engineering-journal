"use client";

import { useEffect, type RefObject } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

export interface DialogBehaviorOptions {
  open: boolean;
  onClose: () => void;
  /** The element that owns the modal surface; focus is trapped inside it. */
  panelRef: RefObject<HTMLElement | null>;
  /** Receives focus on open. Defaults to the first focusable node in the panel. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Receives focus on close. Defaults to whatever was focused before opening. */
  returnFocusRef?: RefObject<HTMLElement | null>;
}

/**
 * The modal-surface contract shared by the navigation sheet and the search
 * palette (plan §18.1, §20): scroll lock, focus containment, Escape to dismiss,
 * and focus restoration.
 *
 * Extracted so both surfaces behave identically — divergence between two
 * hand-rolled focus traps is a classic source of keyboard-accessibility bugs.
 * Native `<dialog>` is deliberately not used: its top-layer rendering and
 * backdrop cannot be styled consistently across the browsers in scope, and it
 * would still need most of this logic for scroll lock and focus restoration.
 */
export function useDialogBehavior({
  open,
  onClose,
  panelRef,
  initialFocusRef,
  returnFocusRef,
}: DialogBehaviorOptions): void {
  // Lock background scroll, compensating for the scrollbar so the page behind
  // the overlay does not shift sideways when it disappears.
  useEffect(() => {
    if (!open) return;
    const { body, documentElement } = document;
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
    };
  }, [open]);

  // Focus in on open, trap Tab, Escape to close, focus back out on close.
  useEffect(() => {
    if (!open) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const panel = panelRef.current;
    const target =
      initialFocusRef?.current ?? panel?.querySelector<HTMLElement>(FOCUSABLE) ?? panel;
    target?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const current = panelRef.current;
      if (!current) return;
      const focusable = [...current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      const restore = returnFocusRef?.current ?? previouslyFocused;
      // Only reclaim focus if the dismissed surface still held it; the user may
      // have moved on (e.g. followed a link) while it was open.
      if (restore && restore.isConnected) restore.focus();
    };
  }, [open, onClose, panelRef, initialFocusRef, returnFocusRef]);
}
