import React from "react";
import type { ArticleVisual, VisualGlyph } from "../../lib/visuals/types";

/** Shared by server-rendered illustrations and standalone, script-free SVGs. */
const SVG_STYLE = `
.atlas-diagram{color:var(--diagram-ink,#20342f);font-family:Arial,Helvetica,sans-serif}
.atlas-diagram .dv-paper{fill:var(--diagram-paper,#f5f7f2)}
.atlas-diagram .dv-line{fill:none;stroke:var(--diagram-line,#bcc9c0);stroke-width:1.5}
.atlas-diagram .dv-strong{fill:none;stroke:var(--diagram-accent,#286b54);stroke-width:2}
.atlas-diagram .dv-fill{fill:var(--diagram-accent,#286b54)}
.atlas-diagram .dv-soft{fill:var(--diagram-soft,#dce8dc)}
.atlas-diagram .dv-secondary{fill:var(--diagram-secondary,#ae663e)}
.atlas-diagram .dv-muted{fill:var(--diagram-muted,#586a61)}
.atlas-diagram .dv-label{fill:currentColor;font-size:18px;font-weight:600;letter-spacing:-.3px}
.atlas-diagram .dv-detail{fill:var(--diagram-muted,#586a61);font-size:13px}
.atlas-diagram .dv-index{fill:var(--diagram-muted,#586a61);font-family:monospace;font-size:12px;letter-spacing:2px}
.atlas-diagram .dv-flow{fill:none;stroke:var(--diagram-accent,#286b54);stroke-width:2;stroke-dasharray:5 12;opacity:.8}
`;

/** All glyphs have a fixed primitive budget; no randomness or runtime sampling. */
export function Glyph({ kind }: { kind: VisualGlyph }) {
  switch (kind) {
    case "tokens":
      return <g>{[0, 1, 2].map((row) => <g key={row}>{[0, 1, 2, 3].map((column) =>
        <rect key={column} x={-54 + column * 28} y={-25 + row * 21} width={23} height={13} rx={3}
          className={column === row + 1 ? "dv-fill" : "dv-soft"} />)}</g>)}</g>;
    case "matrix":
    case "sparse":
    case "grid":
      return <g>{Array.from({ length: 48 }, (_, i) => {
        const column = i % 8;
        const row = Math.floor(i / 8);
        const active = kind === "matrix" ? column <= row + 1 : kind === "sparse" ? (i * 7 + row) % 11 < 3 : row > 1 && row < 5 && column > 1 && column < 5;
        return <rect key={i} x={-54 + column * 14} y={-34 + row * 14} width={10} height={10} rx={1}
          className={active ? "dv-fill" : "dv-soft"} opacity={active ? .55 + row * .07 : 1} />;
      })}</g>;
    case "memory":
      return <g>{[0, 1, 2].map((row) => <g key={row}>
        <rect x={-59} y={-32 + row * 27} width={118} height={20} rx={4} className="dv-line" />
        {[0, 1, 2, 3, 4, 5].map((column) => <rect key={column} x={-53 + column * 18} y={-27 + row * 27}
          width={13} height={10} rx={2} className={(row + column) % 4 === 0 ? "dv-secondary" : "dv-soft"} />)
      }</g>)}</g>;
    case "wave":
      return <g><path d="M-68 6H68" className="dv-line" />{Array.from({ length: 35 }, (_, i) => {
        const height = 5 + Math.abs(Math.sin(i * .8) * Math.sin(i * .16)) * 64;
        return <line key={i} x1={-68 + i * 4} x2={-68 + i * 4} y1={6 - height / 2} y2={6 + height / 2} className="dv-strong" />;
      })}</g>;
    case "spectrum":
      return <g>{Array.from({ length: 70 }, (_, i) => <rect key={i} x={-63 + i % 14 * 9} y={-30 + Math.floor(i / 14) * 15}
        width={6} height={12} rx={1} className={i % 9 < 2 ? "dv-secondary" : "dv-fill"}
        opacity={.15 + ((i * 7) % 13) / 16} />)}</g>;
    case "network":
      return <g>{[-27, 0, 27].flatMap((y, row) => [-40, 0, 40].map((x, column) =>
        <path key={`${row}-${column}`} d={`M-56 ${y}Q0 ${y - 12} 56 ${x * .7}`} className="dv-line" />))}
        {[-56, 0, 56].flatMap((x, column) => [-28, 0, 28].map((y, row) =>
          <circle key={`${column}-${row}`} cx={x} cy={y} r={column === 1 ? 6 : 4} className={column === 1 ? "dv-fill" : "dv-secondary"} />))}</g>;
    case "filter":
      return <g><rect x={-50} y={-35} width={84} height={84} className="dv-line" />
        {[1, 2, 3].map((n) => <g key={n}><path d={`M${-50 + n * 21} -35V49M-50 ${-35 + n * 21}H34`} className="dv-line" /></g>)}
        <rect x={-8} y={-14} width={42} height={42} className="dv-soft" />
        <rect x={-8} y={-14} width={42} height={42} className="dv-strong" />
        <path d="M40 7H67m-8-7 8 7-8 7" className="dv-strong" /></g>;
    case "model":
      return <g><rect x={-39} y={-35} width={78} height={78} rx={9} className="dv-soft" />
        <rect x={-30} y={-26} width={60} height={60} rx={5} className="dv-strong" />
        {[-20, 0, 20].map((n) => <path key={n} d={`M${n} -47V-35M${n} 43V55M-51 ${n + 4}H-39M39 ${n + 4}H51`} className="dv-line" />)}
        <path d="M-15 4h30M0-11v30" className="dv-strong" /></g>;
    case "check":
      return <g><circle cx={0} cy={4} r={38} className="dv-soft" /><circle cx={0} cy={4} r={38} className="dv-strong" />
        <path d="m-17 4 11 12 25-27" className="dv-strong" strokeWidth={3} />
        <path d="M-64 4h17M47 4h17" className="dv-line" /></g>;
    case "layers":
      return <g>{[2, 1, 0].map((n) => <g key={n} transform={`translate(${n * 9} ${-n * 9})`}>
        <rect x={-52} y={-23} width={88} height={61} rx={4} className="dv-paper" />
        <rect x={-52} y={-23} width={88} height={61} rx={4} className="dv-line" />
        <path d="M-39-6H23M-39 7H10M-39 20H19" className={n === 0 ? "dv-strong" : "dv-line"} />
      </g>)}</g>;
  }
}

type Position = readonly [x: number, y: number];

function positions(layout: ArticleVisual["layout"]): readonly Position[] {
  switch (layout) {
    case "sequence": return [[125, 235], [362, 235], [598, 235], [835, 235]];
    case "cycle": return [[240, 133], [720, 133], [720, 367], [240, 367]];
    case "fork": return [[120, 250], [480, 92], [480, 250], [480, 408], [840, 250]];
    case "compare": return [[240, 137], [720, 137], [240, 371], [720, 371]];
    case "prediction": return [[165, 135], [600, 135], [165, 365], [795, 365]];
    case "transport": return [[120, 250], [360, 250], [600, 250], [840, 250]];
  }
}

function connections(layout: ArticleVisual["layout"]): readonly string[] {
  switch (layout) {
    case "sequence": return ["M205 235H273", "M442 235H509", "M678 235H746"];
    case "cycle": return ["M331 133H620", "M822 133H882V367H824", "M629 367H340", "M138 367H78V133H136"];
    case "fork": return [
      "M210 240C320 240 295 92 380 92", "M210 250H380", "M210 260C320 260 295 408 380 408",
      "M580 92C690 92 660 240 740 240", "M580 250H740", "M580 408C690 408 660 260 740 260",
    ];
    case "prediction": return ["M255 135H500", "M690 135H795V255", "M255 365H695"];
    case "compare":
    case "transport": return [];
  }
}

function Transport() {
  return <g>
    {Array.from({ length: 11 }, (_, i) => {
      const startY = 132 + i * 23;
      const endY = 145 + i * 20 + Math.sin(i * .8) * 16;
      const curve = `M115 ${startY}C345 ${startY - 105 + i * 14} 590 ${endY + 110 - i * 12} 845 ${endY}`;
      return <g key={i}><path d={curve} className="dv-line" opacity={.5} />
        <path d={curve} className="dv-flow" pathLength={100} style={{ animationDelay: `${i * -.37}s` }} />
        <circle cx={115} cy={startY} r={4} className="dv-secondary" />
        <circle cx={845} cy={endY} r={4} className="dv-fill" /></g>;
    })}
    <text x={115} y={100} textAnchor="middle" className="dv-label">Base distribution</text>
    <text x={845} y={100} textAnchor="middle" className="dv-label">Target distribution</text>
    <text x={480} y={440} textAnchor="middle" className="dv-detail">Illustrative paths through a learned velocity field</text>
  </g>;
}

export function DiagramArtwork({ visual, standalone = false }: { visual: ArticleVisual; standalone?: boolean }) {
  const points = positions(visual.layout);
  const arrowId = `visual-arrow-${visual.id}`;
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 500" width="960" height="500"
    className="atlas-diagram" role="img" aria-labelledby={`${visual.id}-title ${visual.id}-desc`}>
    <title id={`${visual.id}-title`}>{visual.title}</title>
    <desc id={`${visual.id}-desc`}>{visual.thesis} {visual.relation}. {visual.nodes.map((node) => `${node.label}: ${node.explanation}`).join(" ")}</desc>
    <style>{SVG_STYLE}</style>
    <defs><marker id={arrowId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
      <path d="M1 1 9 5 1 9" className="dv-strong" />
    </marker></defs>
    <rect width={960} height={500} className="dv-paper" />
    <g opacity={.28} aria-hidden="true">{Array.from({ length: 17 }, (_, i) => <path key={i} d={`M${i * 60} 0V500`} className="dv-line" />)}
      {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M0 ${i * 60}H960`} className="dv-line" />)}</g>
    {standalone && <text x={24} y={28} className="dv-label">{visual.title}</text>}
    {visual.layout === "transport" ? <Transport /> : <>
      {connections(visual.layout).map((d, i) => <g key={d}>
        <path d={d} className="dv-line" markerEnd={`url(#${arrowId})`} />
        <path d={d} className="dv-flow" pathLength={100} style={{ animationDelay: `${i * -.7}s` }} />
      </g>)}
      {visual.layout === "cycle" && <g><circle cx={480} cy={250} r={54} className="dv-paper" />
        <text x={480} y={247} textAnchor="middle" className="dv-index">FEEDBACK</text>
        <text x={480} y={269} textAnchor="middle" className="dv-detail">closed loop</text></g>}
      {visual.layout === "compare" && <path d="M480 55V445M85 250H875" className="dv-line" />}
      {visual.nodes.map((node, index) => {
        const [x, y] = points[index];
        const compact = visual.layout === "fork";
        return <g key={node.label} transform={`translate(${x} ${y})`}>
          <rect x={-90} y={compact ? -63 : -86} width={180} height={compact ? 140 : 183} rx={8} className="dv-paper" />
          <g transform={compact ? "translate(0 -16) scale(.68)" : "translate(0 -21)"}><Glyph kind={node.glyph} /></g>
          <text y={compact ? 43 : 55} textAnchor="middle" className="dv-label">{node.label}</text>
          <text y={compact ? 64 : 78} textAnchor="middle" className="dv-detail">{node.detail}</text>
          <text x={compact ? -80 : -77} y={compact ? -48 : -69} className="dv-index">{String(index + 1).padStart(2, "0")}</text>
        </g>;
      })}
    </>}
    {standalone && <text x={24} y={480} className="dv-detail">Neural Atlas · Conceptual schematic</text>}
  </svg>;
}
