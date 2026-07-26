import Link from "next/link";
import { getSections } from "@/lib/content/corpus";
import { staticNav, type NavItem } from "@/lib/site";
import { SiteNav } from "./SiteNav";
import { SearchPalette } from "./SearchPalette";
import { ThemeToggle } from "./ThemeToggle";

/**
 * Navigation is derived from the discovered corpus plus the routes that exist
 * independently of it, so adding a content folder adds a nav entry with no
 * edit here (plan §6.1).
 */
export function navItems(): NavItem[] {
  const sections = getSections().map((section) => ({
    href: `/${section.section}`,
    label: section.label,
    description: `${section.count} ${section.count === 1 ? "article" : "articles"}`,
  }));
  return [...sections, ...staticNav];
}

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell site-header__inner">
        <Link href="/" className="wordmark">
          <AtlasMark />
          <span className="wordmark__text">Neural Atlas</span>
        </Link>
        <SiteNav items={navItems()} />
        <div className="header-spacer" />
        <div className="header-actions">
          <SearchPalette />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

/**
 * Wordmark glyph: three stacked layers with a traced path, referencing the
 * layer-by-layer architecture analysis the journal publishes. Inline SVG so it
 * costs no request and inherits the current text color in both themes.
 */
function AtlasMark() {
  return (
    <svg
      className="wordmark__mark"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 3 20.5 7.5 12 12 3.5 7.5Z" />
      <path d="M3.5 12 12 16.5 20.5 12" />
      <path d="M3.5 16.5 12 21 20.5 16.5" opacity="0.55" />
    </svg>
  );
}
