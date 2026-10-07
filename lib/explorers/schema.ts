/** Model facts are authored separately from the renderer; no runtime network or model execution. */
export type Evidence = "code" | "reported" | "derived" | "undisclosed" | "proposal";
export interface ArchitectureSource { readonly label: string; readonly href: string; readonly note: string }
export interface ArchitectureNode {
  readonly id: string;
  readonly title: string;
  readonly row: number;
  readonly column: number;
  readonly input: string;
  readonly output: string;
  readonly operation: string;
  readonly description: string;
  readonly evidence: Evidence;
  readonly references: readonly number[];
  readonly cost?: string;
  readonly nextView?: string;
  readonly kind?: "activation" | "kv-state" | "gradient" | "parameter" | "metadata";
}
export interface ArchitectureEdge {
  readonly from: string;
  readonly to: string;
  readonly label: string;
  readonly kind?: "activation" | "kv-state" | "gradient" | "metadata";
}
export interface ArchitectureView {
  readonly id: string;
  readonly label: string;
  readonly title: string;
  readonly description: string;
  readonly nodes: readonly ArchitectureNode[];
  readonly edges: readonly ArchitectureEdge[];
}
export interface ModelArchitecture {
  readonly id: string;
  readonly title: string;
  readonly family: string;
  readonly article: string;
  readonly folder: readonly string[];
  readonly description: string;
  readonly scope: string;
  readonly sources: readonly ArchitectureSource[];
  readonly views: readonly ArchitectureView[];
}

/** Fixed three-column coordinates keep tensor labels legible; the stage owns narrow-screen scrolling. */
export function node(id: string, title: string, row: number, column: number, input: string, output: string,
  operation: string, description: string, options: Partial<Pick<ArchitectureNode, "evidence" | "references" | "cost" | "nextView" | "kind">> = {}): ArchitectureNode {
  return { id, title, row, column, input, output, operation, description, evidence: "reported", references: [0], ...options };
}
export function edge(from: string, to: string, label: string, kind?: ArchitectureEdge["kind"]): ArchitectureEdge {
  return { from, to, label, ...(kind ? { kind } : {}) };
}
export function view(id: string, label: string, title: string, description: string,
  nodes: readonly ArchitectureNode[], edges: readonly ArchitectureEdge[]): ArchitectureView {
  return { id, label, title, description, nodes, edges };
}
