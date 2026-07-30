import type { Metadata } from "next";
import Link from "next/link";
import {
  getAllArticles,
  getRootFolders,
} from "@/lib/content/corpus";
import { absoluteUrl, site } from "@/lib/site";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { FolderList } from "@/components/FolderList";
import { JsonLd } from "@/components/JsonLd";

const description = `Browse ${site.name} research and engineering analysis by subject area.`;

export const metadata: Metadata = {
  title: "Research index",
  description,
  alternates: { canonical: absoluteUrl("/library") },
  openGraph: {
    title: `Research index | ${site.name}`,
    description,
    url: absoluteUrl("/library"),
  },
};

export default function LibraryPage() {
  const articles = getAllArticles();
  const rootFolders = getRootFolders();
  const readingMinutes = articles.reduce(
    (total, article) => total + article.readingMinutes,
    0,
  );

  return (
    <div className="shell">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Research", href: "/library" },
        ])}
      />

      <section className="page-intro">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
        </nav>
        <p className="eyebrow">Research</p>
        <h1>Explore our work</h1>
        <p>
          {articles.length} {articles.length === 1 ? "article" : "articles"} across{" "}
          {rootFolders.length} {rootFolders.length === 1 ? "area" : "areas"}, about{" "}
          {readingMinutes} minutes of reading.
        </p>
      </section>

      <section className="section-block" aria-labelledby="library-sections-heading">
        <div className="section-block__head">
          <h2 id="library-sections-heading">Research areas</h2>
          <span className="section-block__count">
            {rootFolders.length} {rootFolders.length === 1 ? "area" : "areas"}
          </span>
        </div>
        <FolderList folders={rootFolders} sectionRoutes />
      </section>
    </div>
  );
}
