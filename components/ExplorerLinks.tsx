import Link from "next/link";
import { explorerRoute, type Explorer } from "@/lib/explorers/catalog";

export function ExplorerLinks({ items }: { items: readonly Explorer[] }) {
  return <div className="explorer-links">
    {items.map((explorer) => <aside key={explorer.id} className="explorer-invitation" aria-label={`${explorer.title} interactive explorer`}>
      <div>
        <p className="eyebrow">Interactive architecture · {explorer.views.length} views</p>
        <h2><Link href={explorerRoute(explorer)}>{explorer.title}</Link></h2>
        <p>{explorer.description}</p>
      </div>
      <Link className="home-action home-action--primary" href={explorerRoute(explorer)}>
        Explore the model <span aria-hidden="true">→</span>
      </Link>
    </aside>)}
  </div>;
}
