import Link from "next/link";
import { getSections } from "@/lib/content/corpus";
import { staticNav } from "@/lib/site";

/**
 * 404 page (plan §26.4).
 *
 * A dead end is the worst possible outcome for a mistyped or moved URL, so the
 * page offers the full set of real destinations rather than a bare apology.
 */
export default function NotFound() {
  const sections = getSections();

  return (
    <div className="shell">
      <section className="page-intro">
        <p className="eyebrow">404</p>
        <h1>That page does not exist</h1>
        <p>
          The address may be mistyped, or the article may have moved. Everything
          published is reachable from the routes below.
        </p>
      </section>

      <section className="section-block" aria-labelledby="not-found-nav">
        <div className="section-block__head">
          <h2 id="not-found-nav">Go somewhere useful</h2>
        </div>
        <ul className="section-grid">
          <li>
            <Link href="/">
              <span className="section-grid__label">Home</span>
              <span className="section-grid__count">Featured and latest analysis</span>
            </Link>
          </li>
          {sections.map((section) => (
            <li key={section.section}>
              <Link href={`/${section.section}`}>
                <span className="section-grid__label">{section.label}</span>
                <span className="section-grid__count">
                  {section.count} {section.count === 1 ? "article" : "articles"}
                </span>
              </Link>
            </li>
          ))}
          {staticNav.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>
                <span className="section-grid__label">{item.label}</span>
                <span className="section-grid__count">{item.description}</span>
              </Link>
            </li>
          ))}
          <li>
            <Link href="/search">
              <span className="section-grid__label">Search</span>
              <span className="section-grid__count">Find an article by name or content</span>
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
