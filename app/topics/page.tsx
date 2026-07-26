import type { Metadata } from "next";
import { getAllArticles, getArticlesByTopic, getTopics } from "@/lib/content/corpus";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { ArticleList } from "@/components/ArticleList";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Topics",
  description: "Browse analysis by subject area.",
  alternates: { canonical: "/topics" },
};

/**
 * Topic index (plan §6.2).
 *
 * Topics come from authored front matter and are never inferred from body text:
 * a derived topic would be presented with the same authority as an authored one
 * while carrying none of the author's judgement. A corpus that declares none
 * therefore yields none, and the page degrades to a complete listing.
 *
 * Deviation from plan §6.2, which specifies `/topics/[topic]` routes: a dynamic
 * segment whose `generateStaticParams` can legitimately return an empty set
 * cannot be statically exported — Next.js fails the build rather than emitting
 * zero pages. Each topic is an anchored section here instead, so `/topics#slug`
 * deep-links exactly as a dedicated route would and the build stays valid for
 * *any* corpus, including one with no topics at all. Promoting these to real
 * routes is a one-file change once topics are a guaranteed part of the schema.
 */
export default function TopicsPage() {
  const topics = getTopics();
  const articles = getAllArticles();

  return (
    <div className="shell">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Topics", href: "/topics" },
        ])}
      />

      <section className="page-intro">
        <p className="eyebrow">Index</p>
        <h1>Topics</h1>
        <p>
          {topics.length > 0
            ? "Analysis grouped by subject area. A topic is declared by the author in an article’s front matter."
            : "No topics have been declared in article front matter yet, so the full corpus is listed below."}
        </p>
      </section>

      {topics.length > 0 ? (
        <>
          <nav className="section-block" aria-label="Jump to a topic">
            <ul className="topic-cloud">
              {topics.map((topic) => (
                <li key={topic.slug}>
                  <a className="topic-chip" href={`#${topic.slug}`}>
                    <span className="topic-chip__label">{topic.label}</span>
                    <span className="topic-chip__count">{topic.count}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {topics.map((topic) => (
            <section className="section-block" key={topic.slug} aria-labelledby={topic.slug}>
              <div className="section-block__head">
                <h2 id={topic.slug}>{topic.label}</h2>
                <span className="section-block__count">
                  {topic.count} {topic.count === 1 ? "article" : "articles"}
                </span>
              </div>
              <ArticleList articles={getArticlesByTopic(topic.slug)} headingLevel="h3" />
            </section>
          ))}
        </>
      ) : (
        <section className="section-block" aria-label="All articles">
          <ArticleList articles={articles} headingLevel="h2" />
        </section>
      )}
    </div>
  );
}
