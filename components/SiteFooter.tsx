import Link from "next/link";
import { getSections } from "@/lib/content/corpus";
import { LLMS_TXT_PATH } from "@/lib/content/llms";
import { site, staticNav, withBasePath } from "@/lib/site";

/**
 * Site footer (plan §6.3).
 *
 * Provides real secondary navigation at the bottom of every long article,
 * which matters most on mobile where the header has scrolled far away.
 */
export function SiteFooter() {
  const sections = getSections();

  return (
    <footer className="site-footer">
      <div className="shell">
        <div className="site-footer__grid">
          <div className="site-footer__about">
            <p className="site-footer__wordmark">{site.name}</p>
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
              <li>
                <a href={withBasePath(LLMS_TXT_PATH)}>llms.txt</a>
              </li>
            </ul>
          </nav>
        </div>

        {/* No generated year: the build must be reproducible from source alone
            (plan §3.2), and a clock reading would make two builds differ. */}
        <p className="site-footer__legal">
          © {site.name}. AI architecture, training, inference, and systems-engineering
          analysis.
        </p>
      </div>
    </footer>
  );
}
