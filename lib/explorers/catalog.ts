import { languageArchitectures } from "./language-models";
import { visionArchitectures } from "./vision-models";
import { speechArchitectures } from "./speech-models";
import { transportArchitectures } from "./transport-models";
import { predictiveArchitectures } from "./predictive-models";
import type { ModelArchitecture } from "./schema";

/** Curated HTML tools are separate from the Markdown compiler. */
export interface Explorer {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly source: string;
  readonly folder: readonly string[];
  readonly views: readonly { readonly id: string; readonly label: string }[];
  readonly family?: string;
  readonly architecture?: ModelArchitecture;
}

export const modelArchitectures: readonly ModelArchitecture[] = [
  ...languageArchitectures, ...visionArchitectures, ...speechArchitectures,
  ...transportArchitectures, ...predictiveArchitectures,
];

export const explorers: readonly Explorer[] = [{
  id: "decoder-only-transformer",
  title: "Decoder-only Transformer",
  description: "Trace the computation through 32 decoder blocks. Inspect attention, SwiGLU, tensor shapes, cached generation, and training updates.",
  source: "docs/Models/autoregressive_language_model/model-architecture-interactive.html",
  folder: ["models", "autoregressive-language-model"],
  views: [
    { id: "model", label: "Model" },
    { id: "decoder", label: "Decoder" },
    { id: "attention", label: "Attention" },
    { id: "swiglu", label: "SwiGLU" },
    { id: "inference", label: "Generation" },
    { id: "training", label: "Training" },
  ],
}, ...modelArchitectures.map((architecture) => ({
  id: architecture.id, title: architecture.title, description: architecture.description,
  source: architecture.article, folder: architecture.folder, family: architecture.family,
  views: architecture.views, architecture,
}))];

export function explorerRoute(explorer: Explorer): string {
  return `/explorers/${explorer.id}/`;
}

export function explorersForFolder(segments: readonly string[]): readonly Explorer[] {
  return explorers.filter(({ folder }) =>
    segments.length <= folder.length && segments.every((segment, index) => segment === folder[index]),
  );
}

/** Corpus identities are absolute on disk; match complete normalized suffixes, never titles. */
export function explorersForArticle(sourcePath: string): readonly Explorer[] {
  const identity = sourcePath.replace(/\\/g, "/");
  return explorers.filter(({ architecture, source }) => architecture &&
    (identity === source || identity.endsWith(`/${source}`)));
}
