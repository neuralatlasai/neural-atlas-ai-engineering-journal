import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { explorers, explorerRoute } from "@/lib/explorers/catalog";
import { absoluteUrl, withBasePath } from "@/lib/site";
import { ExplorerFrame } from "@/components/ExplorerFrame";

export const dynamicParams = false;
export function generateStaticParams() { return explorers.map(({ id }) => ({ id })); }

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const explorer = explorers.find((item) => item.id === id);
  if (!explorer) return {};
  return {
    title: `${explorer.title} · Interactive architecture`,
    description: explorer.description,
    alternates: { canonical: absoluteUrl(explorerRoute(explorer)) },
  };
}

export default async function ExplorerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const explorer = explorers.find((item) => item.id === id);
  if (!explorer) notFound();
  const src = withBasePath(`/explorers/${explorer.id}.html`);
  return <div className="shell explorer-page">
    <header className="explorer-page__header">
      <div>
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link><span aria-hidden="true"> / </span><Link href="/models/">Models</Link>
        </nav>
        <h1>Model architecture explorer</h1>
      </div>
      <a className="home-action" href={src} target="_blank" rel="noopener">Open full view <span aria-hidden="true">↗</span></a>
    </header>
    <ExplorerFrame src={src} title={`${explorer.title}: six interactive computation views`} views={explorer.views.map(({ id }) => id)} />
    <p className="explorer-page__note">Select a component or connector to inspect its tensors. Use Play or the arrow keys to follow each stage; export any view as SVG.</p>
  </div>;
}
