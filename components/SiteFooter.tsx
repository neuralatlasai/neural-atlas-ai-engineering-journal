import Link from "next/link";
import { getSections } from "@/lib/content/corpus";
import { site, staticNav, withBasePath } from "@/lib/site";

/**
 * Site footer (plan §6.3).
 *
 * Carries the publication statement plus a real secondary navigation — the
 * previous single paragraph left the bottom of every long article as a dead
 * end, which matters most on mobile where the header has scrolled far away.
 */
export function SiteFooter() {
  const sections = getSections();

  return (
    <footer className="site-footer">
      <div className="shell">
        <div className="site-footer__grid">
          <div className="site-footer__about">
            <p className="site-footer__wordmark">{site.name}</p>
            <p>
              An evidence-grounded AI engineering journal, built as a static-first
              research publication. Content is preserved from source Markdown; every
              figure and equation is traceable to its origin.
            </p>
          </div>

          <nav className="site-footer__nav" aria-label="Sections">
            <h2>Sections</h2>
            <ul>
              {sections.map((section) => (
                <li key={section.section}>
                  <Link href={`/${section.section}`}>{section.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="site-footer__nav" aria-label="Browse">
            <h2>Browse</h2>
            <ul>
              {staticNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
              <li>
                <Link href="/search">Search</Link>
              </li>
              <li>
                {/* A raw anchor, so the base path is not applied for us. */}
                <a href={withBasePath("/feed.xml")}>RSS feed</a>
              </li>
            </ul>
          </nav>
        </div>

        {/* No generated year: the build must be reproducible from source alone
            (plan §3.2), and a clock reading would make two builds differ. */}
        <p className="site-footer__legal">
          © {site.name}. Analysis is reconstructed from public material and labelled
          with its evidence basis.
        </p>
      </div>
    </footer>
  );
}
