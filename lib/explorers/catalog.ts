/** Curated, self-contained HTML tools are separate from the Markdown corpus. */
export interface Explorer {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly source: string;
  readonly folder: readonly string[];
  readonly views: readonly { readonly id: string; readonly label: string }[];
}

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
}];

export function explorerRoute(explorer: Explorer): string {
  return `/explorers/${explorer.id}/`;
}

export function explorersForFolder(segments: readonly string[]): readonly Explorer[] {
  return explorers.filter(({ folder }) =>
    segments.length <= folder.length && segments.every((segment, index) => segment === folder[index]),
  );
}
