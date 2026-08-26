"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { NavItem } from "@/lib/site";
import { useDialogBehavior } from "./useDialogBehavior";

/** True when `pathname` is `href` or a descendant of it. */
export function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/" || pathname === "";
  const normalized = pathname.replace(/\/+$/, "");
  const target = href.replace(/\/+$/, "");
  return normalized === target || normalized.startsWith(`${target}/`);
}

/**
 * Primary navigation (plan §18.1).
 *
 * Desktop renders an inline list. Below the breakpoint the same destinations
 * move into a sheet behind a menu button, which is what makes the header usable
 * on a 320px viewport — the previous inline list simply shrank until the links
 * were unreadable and below the 44px touch-target minimum.
 *
 * Both variants render real anchors to the same routes, so navigation degrades
 * to a plain list of links without JavaScript.
 */
export function SiteNav({ items }: { items: readonly NavItem[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const close = useCallback(() => setOpen(false), []);

  // A committed route change dismisses the sheet.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  /* Responsive state must follow responsive geometry. A sheet opened below the
     navigation breakpoint can otherwise remain mounted after rotation,
     docking, or desktop resize even though its trigger has disappeared and
     the inline navigation is visible again. */
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 76.01rem)");
    const closeWhenInlineNavigationReturns = (event: MediaQueryListEvent | MediaQueryList) => {
      if (event.matches) setOpen(false);
    };

    closeWhenInlineNavigationReturns(desktop);
    desktop.addEventListener("change", closeWhenInlineNavigationReturns);
    return () => desktop.removeEventListener("change", closeWhenInlineNavigationReturns);
  }, []);

  useDialogBehavior({ open, onClose: close, panelRef, returnFocusRef: triggerRef });

  return (
    <>
      <nav className="primary-nav" aria-label="Primary">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(pathname, item.href) ? "page" : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <button
        ref={triggerRef}
        type="button"
        className="icon-button nav-trigger"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="nav-trigger__glyph" data-open={open || undefined} aria-hidden="true">
          <span />
          <span />
        </span>
      </button>

      {/* Mounted only while open, so a closed sheet contributes no duplicate
          links or landmarks to the accessibility tree. */}
      {open && (
        <div className="overlay" role="presentation" onClick={close}>
          <div
            ref={panelRef}
            id={panelId}
            className="nav-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="nav-sheet__head">
              <span className="nav-sheet__title">Menu</span>
              <button
                type="button"
                className="icon-button nav-sheet__close"
                onClick={close}
                aria-label="Close navigation menu"
              >
                <span className="nav-sheet__close-label" aria-hidden="true">
                  Close
                </span>
                <span className="nav-sheet__close-glyph" aria-hidden="true">
                  ✕
                </span>
              </button>
            </div>
            <nav aria-label="Site sections">
              <ul>
                {items.map((item, index) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive(pathname, item.href) ? "page" : undefined}
                    >
                      <span className="nav-sheet__index" aria-hidden="true">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="nav-sheet__copy">
                        <span className="nav-sheet__label">{item.label}</span>
                        {item.description && (
                          <span className="nav-sheet__desc">{item.description}</span>
                        )}
                      </span>
                      <span className="nav-sheet__arrow" aria-hidden="true">
                        ↗
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
