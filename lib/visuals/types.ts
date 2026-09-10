/** Editorial illustrations describe the source article; they are not benchmarks. */
export type VisualLayout = "sequence" | "cycle" | "fork" | "compare" | "transport" | "prediction";
export type VisualGlyph = "tokens" | "matrix" | "sparse" | "network" | "memory" | "wave" | "spectrum" | "grid" | "filter" | "model" | "check" | "layers";

export interface VisualNode {
  readonly label: string;
  readonly detail: string;
  readonly glyph: VisualGlyph;
  readonly explanation: string;
}

export interface ArticleVisual {
  readonly id: string;
  /** Repository-relative source identity, independent of derived titles/routes. */
  readonly source: string;
  readonly title: string;
  readonly thesis: string;
  readonly layout: VisualLayout;
  readonly nodes: readonly VisualNode[];
  readonly relation: string;
  readonly note: string;
}
