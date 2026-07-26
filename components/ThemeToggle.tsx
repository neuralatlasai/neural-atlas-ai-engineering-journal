"use client";

import { useCallback, useEffect, useState } from "react";

/** `system` defers to the OS; the other two pin an explicit preference. */
export type ThemeMode = "system" | "light" | "dark";

const STORAGE_KEY = "na-theme";
const CYCLE: readonly ThemeMode[] = ["system", "light", "dark"];

const LABEL: Record<ThemeMode, string> = {
  system: "System theme",
  light: "Light theme",
  dark: "Dark theme",
};

/** Read the mode the inline boot script recorded on `<html>`. */
function readMode(): ThemeMode {
  const attribute = document.documentElement.getAttribute("data-theme-mode");
  return attribute === "light" || attribute === "dark" ? attribute : "system";
}

function applyMode(mode: ThemeMode): void {
  const root = document.documentElement;
  root.setAttribute("data-theme-mode", mode);
  if (mode === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", mode);
  try {
    if (mode === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Storage can be unavailable (private mode, blocked cookies). The theme
    // still applies for this session; only persistence is lost.
  }
}

/**
 * Three-state theme control: System → Light → Dark (plan §18.1).
 *
 * The icon is chosen by CSS from `data-theme-mode`, which the inline boot
 * script sets before first paint. That means the correct glyph is painted on
 * the server-rendered HTML — there is no hydration flash of the wrong icon, and
 * no icon state to reconcile between server and client.
 *
 * "System" is a real option rather than an implicit default: once a reader
 * pins a theme they must be able to hand control back to the OS.
 */
export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMode(readMode());
    setMounted(true);
  }, []);

  const cycle = useCallback(() => {
    setMode((current) => {
      const next = CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length];
      applyMode(next);
      return next;
    });
  }, []);

  return (
    <>
      <button
        type="button"
        className="icon-button theme-toggle"
        onClick={cycle}
        // Before hydration the pinned mode is unknown to React, so the label
        // stays generic rather than asserting something possibly wrong.
        aria-label={mounted ? `Color theme: ${LABEL[mode]}. Change theme.` : "Change color theme"}
        title="Change color theme"
      >
        <span className="theme-toggle__icon theme-toggle__icon--system" aria-hidden="true">
          <MonitorIcon />
        </span>
        <span className="theme-toggle__icon theme-toggle__icon--light" aria-hidden="true">
          <SunIcon />
        </span>
        <span className="theme-toggle__icon theme-toggle__icon--dark" aria-hidden="true">
          <MoonIcon />
        </span>
      </button>
      {/* Announce the change: the control's only visual feedback is a colour
          shift, which conveys nothing to a screen-reader user. */}
      <span className="visually-hidden" role="status" aria-live="polite">
        {mounted ? LABEL[mode] : ""}
      </span>
    </>
  );
}

const ICON_PROPS = {
  viewBox: "0 0 20 20",
  width: 17,
  height: 17,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  focusable: false,
} as const;

function SunIcon() {
  return (
    <svg {...ICON_PROPS}>
      <circle cx="10" cy="10" r="3.6" />
      <path d="M10 1.6v1.8M10 16.6v1.8M18.4 10h-1.8M3.4 10H1.6M15.9 4.1l-1.3 1.3M5.4 14.6l-1.3 1.3M15.9 15.9l-1.3-1.3M5.4 5.4 4.1 4.1" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M16.5 12.4A7 7 0 0 1 7.6 3.5a7 7 0 1 0 8.9 8.9Z" />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg {...ICON_PROPS}>
      <rect x="2.2" y="3.6" width="15.6" height="10.4" rx="1.6" />
      <path d="M7 17.2h6M10 14v3.2" />
    </svg>
  );
}
