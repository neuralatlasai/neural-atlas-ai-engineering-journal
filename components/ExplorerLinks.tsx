import { explorerRoute, type Explorer } from "@/lib/explorers/catalog";
import { withBasePath } from "@/lib/site";

export function ExplorerLinks({ items, showIndexLink = true }: { items: readonly Explorer[]; showIndexLink?: boolean }) {
  if (!items.length) return null;
  if (items.length > 3) return <section className="explorer-collection" aria-label="Interactive model architectures">
    <header className="explorer-collection__header"><div><p className="eyebrow">Architecture studio · {items.length} explorers</p>
      <h2>Inside the models</h2><p>Follow the computation. Inspect the tensors. Open the source.</p></div>
      {showIndexLink && <a className="home-action" href={withBasePath("/explorers/")}>Browse all architectures <span aria-hidden="true">→</span></a>}
    </header>
    <div className="explorer-collection__grid">{items.map((explorer, index) =>
      <a className="explorer-entry" key={explorer.id} href={withBasePath(explorerRoute(explorer))}>
        <span className="explorer-entry__meta"><span>{String(index + 1).padStart(2, "0")}</span><span>{explorer.views.length} views <span aria-hidden="true">↗</span></span></span>
        <span className="explorer-entry__family">{explorer.family ?? "Language · decoder-only Transformer"}</span>
        <h3>{explorer.title}</h3><p>{explorer.description}</p>
      </a>)}</div>
  </section>;
  return <div className="explorer-links">
    {items.map((explorer) => <aside key={explorer.id} className="explorer-invitation" aria-label={`${explorer.title} interactive explorer`}>
      <div>
        <p className="eyebrow">Interactive architecture · {explorer.views.length} views</p>
        <h2><a href={withBasePath(explorerRoute(explorer))}>{explorer.title}</a></h2>
        <p>{explorer.description}</p>
      </div>
      <a className="home-action home-action--primary" href={withBasePath(explorerRoute(explorer))}>
        Explore the model <span aria-hidden="true">→</span>
      </a>
    </aside>)}
  </div>;
}
