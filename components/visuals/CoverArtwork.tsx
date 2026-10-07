import React from "react";
import type { HomeCover, CoverNode } from "@/lib/visuals/home-covers";
import { CoverSymbols } from "./CoverSymbols";

export const coverPalettes = {
  sky: { paper: "#f1f7fc", wash: "#d6eafb", ink: "#387499", grid: "#92b3ca" },
  mint: { paper: "#f0f9f6", wash: "#cfeee5", ink: "#307e76", grid: "#92bcb3" },
  lilac: { paper: "#f6f3fc", wash: "#e5ddf8", ink: "#7660a8", grid: "#b3a6ca" },
  sand: { paper: "#fbf8f0", wash: "#f1e7cb", ink: "#8a7548", grid: "#c3b595" },
  rose: { paper: "#fcf4f4", wash: "#f4dfe3", ink: "#a36478", grid: "#cba5b3" },
  ice: { paper: "#f0f8fa", wash: "#d0edf1", ink: "#397f92", grid: "#9bbec7" },
  sage: { paper: "#f4f8f1", wash: "#e0edcf", ink: "#68874b", grid: "#aabd96" },
} as const;

function NodeFrame({ node }: { node: CoverNode }) {
  const width = node.width ?? 96;
  const height = node.height ?? width;
  const x = -width / 2;
  const y = -height / 2;
  switch (node.shape) {
    case "bare": return undefined;
    case "circle": return <circle r={width / 2} />;
    case "diamond": return <path d={`M0 ${y} ${width / 2} 0 0 ${height / 2} ${x} 0Z`} />;
    case "window": return <><rect x={x} y={y} width={width} height={height} rx="10" />
      <path d={`M${x} ${y + 22}h${width}`} />
      {[13, 23, 33].map((offset) => <circle key={offset} cx={x + offset} cy={y + 11} r="1.4" />)}</>;
    case "tile":
    case undefined: return <rect x={x} y={y} width={width} height={height} rx="13" />;
  }
}

/** Fixed geometry and local IDs make precise, accessible art deterministic. */
export function CoverArtwork({ cover, idPrefix }: { cover: HomeCover; idPrefix: string }) {
  const palette = coverPalettes[cover.palette];
  const titleId = `${idPrefix}-cover-title`;
  const arrowId = `${idPrefix}-cover-arrow`;
  const washId = `${idPrefix}-cover-wash`;
  return (
    <svg className="home-cover" viewBox="0 0 720 450" width="720" height="450"
      role="img" aria-labelledby={titleId} data-cover-id={cover.id} style={{ color: palette.ink }}>
      <title id={titleId}>{cover.title}</title>
      <desc>{cover.description} Conceptual illustration.</desc>
      <defs>
        <radialGradient id={washId} cx="72%" cy="27%" r="85%">
          <stop offset="0" stopColor={palette.wash} stopOpacity=".75" />
          <stop offset="1" stopColor={palette.paper} stopOpacity="0" />
        </radialGradient>
        <marker id={arrowId} viewBox="0 0 10 10" refX="8" refY="5"
          markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="m2 1 6 4-6 4" className="home-cover__arrow" />
        </marker>
      </defs>
      <rect width="720" height="450" fill={palette.paper} />
      <rect width="720" height="450" fill={`url(#${washId})`} />
      <g className="home-cover__guides" stroke={palette.grid} aria-hidden="true">
        {[180, 360, 540].map((x) => <path key={`v${x}`} d={`M${x} 0V450`} />)}
        {[112, 225, 338].map((y) => <path key={`h${y}`} d={`M0 ${y}H720`} />)}
      </g>
      <g className="home-cover__routes" aria-hidden="true">
        {cover.connections.map((connection) => <path key={connection.path} d={connection.path}
          strokeDasharray={connection.dashed ? "4 9" : undefined}
          markerEnd={connection.arrow ? `url(#${arrowId})` : undefined} />)}
      </g>
      <g aria-hidden="true">
        {cover.nodes.map((node, index) => {
          const size = Math.min(48, Math.min(node.width ?? 96, node.height ?? node.width ?? 96)
            * (node.shape === "bare" ? .8 : .55));
          return (
            <g key={`${node.symbol}-${index}`} transform={`translate(${node.x} ${node.y})`}
              data-cover-symbol={node.symbol}>
              <g className="home-cover__frame"><NodeFrame node={node} /></g>
              <g className="home-cover__symbol"
                transform={`translate(${-size / 2} ${-size / 2 + (node.shape === "window" ? 10 : 0)}) scale(${size / 48})`}>
                <CoverSymbols symbol={node.symbol} />
              </g>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
