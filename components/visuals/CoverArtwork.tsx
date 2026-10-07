import React from "react";
import type { ArticleVisual } from "@/lib/visuals/types";
import { Glyph } from "./DiagramArtwork";

/** A bounded editorial preview reuses the article's actual mechanism glyphs. */
export function CoverArtwork({
  visual,
  idPrefix,
}: {
  visual: ArticleVisual;
  idPrefix: string;
}) {
  const titleId = `${idPrefix}-cover-title`;
  const satellites = [[112, 100], [180, 266], [626, 115]] as const;
  return (
    <svg className="home-cover" viewBox="0 0 720 360" width="720" height="360"
      role="img" aria-labelledby={titleId}>
      <title id={titleId}>{`${visual.title}. ${visual.thesis}`}</title>
      <desc>
        Conceptual illustration. {visual.nodes.map((node) =>
          `${node.label}: ${node.explanation}`).join(" ")}
      </desc>
      <rect width="720" height="360" className="home-cover__paper" />
      <g className="home-cover__grid" aria-hidden="true">
        {Array.from({ length: 19 }, (_, i) =>
          <path key={`v${i}`} d={`M${i * 40} 0V360`} />)}
        {Array.from({ length: 10 }, (_, i) =>
          <path key={`h${i}`} d={`M0 ${i * 40}H720`} />)}
      </g>
      <g className="home-cover__field" aria-hidden="true">
        <ellipse cx="426" cy="184" rx="212" ry="150" />
        <ellipse cx="426" cy="184" rx="170" ry="119" />
        <path d="M0 184H720M426 0V360" />
      </g>
      <g className="home-cover__connectors" aria-hidden="true">
        <path d="M155 100H222Q242 100 242 120V164H296" />
        <path d="M225 266H274Q294 266 294 246V225H325" />
        <path d="M580 115H552Q532 115 532 135V145H518" />
        <path d="M40 315H84m-22-10v20M652 290h28m-14-14v28M46 46h28m-14-14v28" />
      </g>
      <circle cx="426" cy="184" r="116" className="home-cover__halo" />
      <g transform="translate(426 177) scale(1.8)">
        <Glyph kind={visual.nodes[0].glyph} />
      </g>
      {visual.nodes.slice(1, 4).map((node, index) => {
        const [x, y] = satellites[index];
        return <g key={node.label} transform={`translate(${x} ${y})`}>
          <circle r="43" className="home-cover__satellite" />
          <g transform="scale(.46)"><Glyph kind={node.glyph} /></g>
        </g>;
      })}
    </svg>
  );
}
