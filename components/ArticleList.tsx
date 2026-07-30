import Link from "next/link";
import { formatArticleType, topicSlug, type ArticleMeta } from "@/lib/content/corpus";
import { ArticleLink } from "./ArticleLink";

/**
 * The single editorial list row used by the home page, section indexes, topic
 * pages, and search (plan §6.4: "prefer editorial rows with borders over
 * floating cards"). One implementation means one hover behaviour, one metadata
 * order, and one set of touch targets everywhere a list of articles appears.
 */
export function ArticleList({
  articles,
  headingLevel = "h3",
  showSection = true,
}: {
  articles: readonly ArticleMeta[];
  /** Chosen by the caller so each page keeps a valid heading hierarchy. */
  headingLevel?: "h2" | "h3";
  showSection?: boolean;
}) {
  const Heading = headingLevel;

  return (
    <ul className="article-list">
      {articles.map((article) => (
        <li className="article-row" key={article.documentId}>
          <p className="article-row__meta">
            <span className="pill">{formatArticleType(article.articleType)}</span>
            {article.displayDate && <span>{article.displayDate}</span>}
            {showSection && <span>{article.folderLabels.join(" / ")}</span>}
            <span>{article.readingMinutes} min read</span>
          </p>
          <Heading className="article-row__title">
            <ArticleLink href={article.route}>{article.title}</ArticleLink>
          </Heading>
          {article.description && (
            <p className="article-row__desc">{article.description}</p>
          )}
          {article.topics.length > 0 && (
            <p className="article-row__topics">
              {article.topics.map((topic) => (
                <Link key={topic} className="pill pill--link" href={`/topics#${topicSlug(topic)}`}>
                  {topic}
                </Link>
              ))}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
