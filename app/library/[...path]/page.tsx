import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getContentFolders,
  getFolderContents,
} from "@/lib/content/corpus";
import { absoluteUrl, site } from "@/lib/site";
import { FolderPage } from "@/components/FolderPage";

export const dynamicParams = false;

export function generateStaticParams(): { path: string[] }[] {
  return getContentFolders()
    .filter((folder) => folder.depth > 1)
    .map((folder) => ({ path: folder.routeSegments }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ path: string[] }>;
}): Promise<Metadata> {
  const { path } = await params;
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
  params: Promise<{ path: string[] }>;
}) {
  const { path } = await params;
  const contents = getFolderContents(path);
  if (!contents || contents.folder.depth === 1) notFound();

  return <FolderPage contents={contents} canonicalRoute={contents.folder.route} />;
}
