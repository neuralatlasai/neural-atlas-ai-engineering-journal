import Link from "next/link";
import type { FolderContents } from "@/lib/content/corpus";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { ArticleList } from "./ArticleList";
import { FolderList } from "./FolderList";
import { JsonLd } from "./JsonLd";

function ancestorRoute(routeSegments: readonly string[], depth: number): string {
  if (depth === 1) return `/${routeSegments[0]}`;
  return `/library/${routeSegments.slice(0, depth).join("/")}`;
}

function quantity(value: number, singular: string, plural = `${singular}s`): string {
  return `${value} ${value === 1 ? singular : plural}`;
}

export function FolderPage({
  contents,
  canonicalRoute,
  eyebrow = "Research area",
}: {
  contents: FolderContents;
  canonicalRoute: string;
  eyebrow?: "Section" | "Research area";
}) {
  const { folder, childFolders, articles } = contents;
  const ancestors = folder.labels.slice(0, -1).map((label, index) => ({
    name: label,
    href: ancestorRoute(folder.routeSegments, index + 1),
  }));
  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Research", href: "/library" },
    ...ancestors,
    { name: folder.label, href: canonicalRoute },
  ];

  return (
    <div className="shell">
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />

      <section className="page-intro">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true"> / </span>
          <Link href="/library">Research</Link>
          {ancestors.map((ancestor) => (
            <span key={ancestor.href}>
              <span aria-hidden="true"> / </span>
              <Link href={ancestor.href}>{ancestor.name}</Link>
            </span>
          ))}
        </nav>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{folder.label}</h1>
        <p>
          {quantity(folder.articleCount, "article")}, about {folder.readingMinutes} minutes
          of reading
          {childFolders.length > 0
            ? ` across ${quantity(childFolders.length, "subtopic")}.`
            : "."}
        </p>
      </section>

      {childFolders.length > 0 && (
        <section className="section-block" aria-labelledby="collections-heading">
          <div className="section-block__head">
            <h2 id="collections-heading">Explore</h2>
            <span className="section-block__count">
              {quantity(childFolders.length, "area")}
            </span>
          </div>
          <FolderList folders={childFolders} />
        </section>
      )}

      {articles.length > 0 && (
        <section className="section-block" aria-labelledby="folder-articles-heading">
          <div className="section-block__head">
            <h2 id="folder-articles-heading">Articles</h2>
            <span className="section-block__count">
              {quantity(articles.length, "article")}
            </span>
          </div>
          <ArticleList articles={articles} headingLevel="h3" showSection={false} />
        </section>
      )}
    </div>
  );
}
