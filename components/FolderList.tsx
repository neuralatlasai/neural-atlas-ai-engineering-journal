import Link from "next/link";
import type { ContentFolder } from "@/lib/content/corpus";

function quantity(value: number, singular: string, plural = `${singular}s`): string {
  return `${value} ${value === 1 ? singular : plural}`;
}

export function FolderList({
  folders,
  sectionRoutes = false,
}: {
  folders: readonly ContentFolder[];
  /** Top-level section pages retain their established short canonical URLs. */
  sectionRoutes?: boolean;
}) {
  return (
    <ul className="folder-grid">
      {folders.map((folder) => {
        const href =
          sectionRoutes && folder.depth === 1
            ? `/${folder.routeSegments[0]}`
            : folder.route;
        const context = [
          folder.childFolderCount > 0
            ? quantity(folder.childFolderCount, "subtopic")
            : null,
          quantity(folder.articleCount, "article"),
          `${folder.readingMinutes} min`,
        ].filter(Boolean);

        return (
          <li key={folder.key}>
            <Link
              className="folder-card"
              href={href}
              aria-label={`${folder.label}: ${context.join(", ")}`}
            >
              <span className="folder-card__body">
                <span className="folder-card__label">{folder.label}</span>
                <span className="folder-card__meta">{context.join(" · ")}</span>
              </span>
              <span className="folder-card__arrow" aria-hidden="true">
                →
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
