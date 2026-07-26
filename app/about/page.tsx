import Link from "next/link";
import type { Metadata } from "next";
import { getAllArticles, getSections } from "@/lib/content/corpus";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "How Neural Atlas is written, what its evidence standards are, and how the publication is built.",
  alternates: { canonical: "/about" },
};

/**
 * Editorial statement (plan §6.1).
 *
 * Everything quantitative on this page is derived from the corpus rather than
 * written down, so it cannot go stale as articles are added.
 */
export default function AboutPage() {
  const articles = getAllArticles();
  const sections = getSections();
  const totalWords = articles.reduce((sum, article) => sum + article.wordCountEstimate, 0);

  return (
    <div className="shell">
      <section className="page-intro">
        <p className="eyebrow">About</p>
        <h1>Method, scope, and standards</h1>
        <p>{site.longDescription}</p>
      </section>

      <div className="prose-page">
        <h2>What this publication is</h2>
        <p>
          {site.name} publishes mechanism-level analysis of modern AI systems:
          model architectures, attention and memory design, training systems, and
          inference infrastructure. Each article reconstructs how a system works
          from public material — papers, technical reports, model cards, and
          released code — and states plainly which parts are documented, which are
          inferred, and which remain unknown.
        </p>

        <h2>Evidence standards</h2>
        <ul>
          <li>
            <strong>Claims are labelled by their basis.</strong> Documented
            behaviour, reconstruction, and informed estimate are distinguished
            rather than blended into a single confident voice.
          </li>
          <li>
            <strong>Sources are linked, not summarized away.</strong> Every article
            ends with the reference list its citations resolve to.
          </li>
          <li>
            <strong>Numbers carry their units and their provenance.</strong> A
            benchmark figure without a stated configuration is not evidence.
          </li>
          <li>
            <strong>Uncertainty is stated, not smoothed.</strong> Where the public
            record does not settle a question, the article says so.
          </li>
        </ul>

        <h2>How the site is built</h2>
        <p>
          The corpus is plain Markdown. A build-time compiler parses it into a
          typed representation and renders static HTML: mathematics through KaTeX
          (with MathML for assistive technology), code through Shiki, and figures
          into responsive AVIF and WebP variants. No Markdown parser, syntax
          highlighter, or math renderer is shipped to the browser.
        </p>
        <p>
          Every article, section index, and topic page is prerendered. The result
          is a static bundle with no server runtime, so an article reads correctly
          before any JavaScript executes — headings, links, tables, equations,
          code, and figures all work with scripting disabled. Search, the copy
          affordances, and the outline highlight are enhancements layered on top.
        </p>

        <h2>Current corpus</h2>
        <p>
          {articles.length} {articles.length === 1 ? "article" : "articles"} across{" "}
          {sections.length} {sections.length === 1 ? "section" : "sections"}, about{" "}
          {new Intl.NumberFormat("en-US").format(totalWords)} words of prose.
        </p>
        <ul>
          {sections.map((section) => (
            <li key={section.section}>
              <Link href={`/${section.section}`}>{section.label}</Link> —{" "}
              {section.count} {section.count === 1 ? "article" : "articles"}
            </li>
          ))}
        </ul>

        <h2>Corrections</h2>
        <p>
          Analysis of systems that are still being documented ages quickly. Where
          an article is superseded by primary material, it is corrected rather
          than quietly deleted, and the correction is stated in the text.
        </p>
      </div>
    </div>
  );
}
