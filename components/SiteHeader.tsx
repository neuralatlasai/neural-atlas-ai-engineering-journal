import Link from "next/link";
import { getSections } from "@/lib/content/corpus";
import { composePrimaryNav, staticNav, type NavItem } from "@/lib/site";
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
  return composePrimaryNav(sections, staticNav);
}

export function SiteHeader() {
  const items = navItems();

  return (
    <header className="site-header">
      <div className="shell site-header__inner">
        <Link href="/" className="wordmark">
          <span className="wordmark__text">Neural Atlas</span>
        </Link>
        <SiteNav items={items} primaryItems={staticNav} />
        <div className="header-spacer" />
        <div className="header-actions">
          <SearchPalette />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
