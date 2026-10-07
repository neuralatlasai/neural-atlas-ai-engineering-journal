import type { Metadata } from "next";
import Link from "next/link";
import { ExplorerLinks } from "@/components/ExplorerLinks";
import { explorers } from "@/lib/explorers/catalog";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Interactive model architectures",
  description: "Source-grounded interactive architecture explorers for language, vision, speech, diffusion and predictive world models.",
  alternates: { canonical: absoluteUrl("/explorers/") },
};
export default function ArchitectureIndex() {
  return <div className="shell architecture-index">
    <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true"> / </span><Link href="/models/">Models</Link></nav>
    <header><p className="eyebrow">Neural Atlas / Architecture studio</p><h1>See how the models work.</h1>
      <p>Explore language, vision, speech, generative transport and predictive world models through their own computation graphs.</p></header>
    <ExplorerLinks items={explorers} showIndexLink={false} />
  </div>;
}
