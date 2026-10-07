import React from "react";
import type { CoverSymbol } from "@/lib/visuals/home-covers";

/** A 48-unit stroke vocabulary uses precise geometry rather than font glyphs. */
export function CoverSymbols({ symbol }: { symbol: CoverSymbol }) {
  switch (symbol) {
    case "plane": return <><path d="M5 23 43 5 30 43 22 27 5 23ZM22 27 43 5" /></>;
    case "gear": {
      const points = Array.from({ length: 32 }, (_, i) => {
        const angle = (i - .5) * Math.PI / 16;
        const radius = i % 4 < 2 ? 20 : 15.5;
        return `${(24 + Math.cos(angle) * radius).toFixed(2)},${(24 + Math.sin(angle) * radius).toFixed(2)}`;
      }).join(" ");
      return <><polygon points={points} /><circle cx="24" cy="24" r="7" /></>;
    }
    case "chip": return <><rect x="12" y="12" width="24" height="24" rx="4" />
      <rect x="19" y="19" width="10" height="10" rx="1" />
      {[16, 24, 32].map((n) => <path key={n} d={`M${n} 5v7M${n} 36v7M5 ${n}h7M36 ${n}h7`} />)}</>;
    case "shuffle": return <><path d="M5 13h8c8 0 14 22 22 22h8m-7-7 7 7-7 7M5 35h8c3 0 6-3 9-7m5-8c3-4 5-7 8-7h8m-7-7 7 7-7 7" /></>;
    case "code": return <><path d="m15 13-10 11 10 11m18-22 10 11-10 11M28 8 20 40" /></>;
    case "terminal": return <><rect x="3" y="6" width="42" height="36" rx="4" /><path d="M3 15h42m-33 8 7 6-7 6m14 0h9" />
      <circle cx="9" cy="11" r=".8" /><circle cx="14" cy="11" r=".8" /></>;
    case "server": return <>{[5, 19, 33].map((y) => <g key={y}><rect x="5" y={y} width="38" height="10" rx="3" />
      <circle cx="12" cy={y + 5} r="1" /><path d={`M24 ${y + 5}h12`} /></g>)}</>;
    case "route": return <><path d="M4 24h16m0 0V10h22m-7-6 7 6-7 6M20 24h22m-7-6 7 6-7 6M20 24v14h22m-7-6 7 6-7 6" />
      <circle cx="20" cy="24" r="3" className="home-cover__solid" /></>;
    case "database": return <><ellipse cx="24" cy="10" rx="17" ry="6" /><path d="M7 10v28c0 8 34 8 34 0V10M7 23c0 8 34 8 34 0M7 35c0 8 34 8 34 0" /></>;
    case "tokens": return <>{[0, 1, 2].map((row) => <g key={row}>{[0, 1, 2].map((col) =>
      <rect key={col} x={5 + col * 14} y={8 + row * 12} width="10" height="7" rx="2" />)}</g>)}</>;
    case "filter": return <><path d="M4 7h40L29 25v15l-10 5V25L4 7Z" /><path d="M13 14h22M18 20h12" /></>;
    case "cube": return <><path d="m24 3 19 11v22L24 47 5 36V14L24 3Zm0 22v22M5 14l19 11 19-11M14 9l19 11v11" /></>;
    case "search": return <><circle cx="21" cy="21" r="14" /><path d="m31 31 13 13M15 21h12m-6-6v12" /></>;
    case "flask": return <><path d="M17 4h14M20 4v17L7 39q-2 5 4 5h26q6 0 4-5L28 21V4M12 32h24" />
      <circle cx="20" cy="37" r="1" /><circle cx="28" cy="29" r="1" /></>;
    case "chart": return <><path d="M6 5v37h37M13 33l8-12 8 5 12-17" /><circle cx="21" cy="21" r="2" /><circle cx="29" cy="26" r="2" /></>;
    case "check": return <><path d="m9 24 10 11L40 12" /></>;
    case "document": return <><path d="M11 3h18l10 10v32H11V3Zm18 0v10h10M18 23h14M18 30h14M18 37h9" /></>;
    case "gradient": return <><path d="M6 7h36L24 42 6 7ZM14 16h20M18 24h12" /></>;
    case "bolt": return <><path d="M27 3 8 28h15l-2 17 19-25H25l2-17Z" /></>;
    case "wave": return <><path d="M3 24h7l5-15 9 31 8-23 5 7h8" /><path d="M4 7h9M35 41h9" className="home-cover__fine" /></>;
    case "shield": return <><path d="m24 3 17 8v13c0 10-10 17-17 21C17 41 7 34 7 24V11l17-8Z" /><path d="m15 24 6 6 13-14" /></>;
    case "deploy": return <><path d="m24 4 18 10v22L24 46 6 36V14L24 4ZM6 14l18 10 18-10M24 24v22M24 17V4m-6 6 6-6 6 6" /></>;
    case "refresh": return <><path d="M42 20A18 18 0 0 0 10 11L5 17m0-12v12h12M6 28a18 18 0 0 0 32 9l5-6m0 12V31H31" /></>;
    case "chat": return <><path d="M9 6h30a6 6 0 0 1 6 6v21a6 6 0 0 1-6 6H19L8 46v-8a6 6 0 0 1-5-6V12a6 6 0 0 1 6-6Z" />
      <path d="M12 17h24M12 25h17" /></>;
    case "lock": return <><rect x="8" y="21" width="32" height="24" rx="4" /><path d="M15 21V12a9 9 0 0 1 18 0v9M24 31v6" /><circle cx="24" cy="30" r="2" /></>;
    case "tree": return <><rect x="18" y="3" width="12" height="10" rx="2" /><path d="M24 13v10M8 32v-9h32v9M24 23v9" />
      {[3, 19, 35].map((x) => <rect key={x} x={x} y="32" width="10" height="11" rx="2" />)}</>;
    case "graph": return <><path d="m10 10 28 5-16 23L10 10l29 29-1-24M22 38l17 1" />
      {[[10, 10], [38, 15], [22, 38], [39, 39]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="4" className="home-cover__node-dot" />)}</>;
    case "layers": return <><path d="m24 4 20 11-20 11L4 15 24 4ZM4 25l20 11 20-11M4 35l20 11 20-11" /></>;
    case "weights": return <><path d="M5 42h39M11 35V24h7v11h-7Zm13 0V11h7v24h-7Zm13 0V18h7v17h-7ZM7 9l7-4 7 4" /></>;
    case "globe": return <><circle cx="24" cy="24" r="20" /><ellipse cx="24" cy="24" rx="9" ry="20" /><path d="M5 18h38M5 30h38M24 4v40" /></>;
  }
}
