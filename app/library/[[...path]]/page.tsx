import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getContentFolders,
  getFolderContents,
} from "@/lib/content/corpus";
import { absoluteUrl, site } from "@/lib/site";
import { FolderPage } from "@/components/FolderPage";
import LibraryIndex, { libraryIndexMetadata } from "@/components/LibraryIndex";

export const dynamicParams = false;

/**
 * One entry owns both the root and folders. Separate entries with identical
 * client dependencies let Next serialize equivalent navigation chunk aliases
 * inconsistently between exports. A shared manifest removes that ambiguity.
 */
export function generateStaticParams(): { path: string[] }[] {
  return [{ path: [] }, ...getContentFolders()
    .filter((folder) => folder.depth > 1)
    .map((folder) => ({ path: folder.routeSegments }))];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}): Promise<Metadata> {
  const { path = [] } = await params;
  if (path.length === 0) return libraryIndexMetadata;
  const contents = getFolderContents(path);
  if (!contents || contents.folder.depth === 1) return {};

  const { folder } = contents;
  const description = `${folder.articleCount} ${
    folder.articleCount === 1 ? "article" : "articles"
  } in ${folder.labels.join(" / ")} from ${site.name}.`;
  return {
    title: folder.labels.join(" · "),
    description,
    alternates: { canonical: absoluteUrl(folder.route) },
    openGraph: {
      title: folder.label,
      description,
      url: absoluteUrl(folder.route),
    },
  };
}

export default async function LibraryFolderPage({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const { path = [] } = await params;
  if (path.length === 0) return <LibraryIndex />;
  const contents = getFolderContents(path);
  if (!contents || contents.folder.depth === 1) notFound();

  return <FolderPage contents={contents} canonicalRoute={contents.folder.route} />;
}
