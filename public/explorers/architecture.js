/* Shared O(V+E) renderer for bounded, source-curated architecture graphs.
 * The same engine emits initial SVG at build time and subsequent interactive views.
 * Model computation is documented, not executed; playback traverses graph stages.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ModelArchitecture = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const evidenceLabels = { code: "CODE", reported: "PAPER", derived: "DERIVED", undisclosed: "UNKNOWN", proposal: "PROPOSAL" };
  const escape = value => String(value).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  function lines(value, length) {
    const result = []; let current = "";
    for (const word of String(value).split(/\s+/)) {
      if (current && current.length + word.length + 1 > length) { result.push(current); current = ""; }
      if (word.length > length) {
        if (current) { result.push(current); current = ""; }
        for (let offset = 0; offset < word.length; offset += length) result.push(word.slice(offset, offset + length));
      } else current += (current ? " " : "") + word;
    }
    if (current) result.push(current);
    return result;
  }
  const svgStyle = ".ma-text{font-family:Arial,Helvetica,sans-serif;fill:#252a29}.ma-node-title{font-size:14px;font-weight:500}.ma-sub{font-family:Courier New,monospace;font-size:10.5px;fill:#58635e}.ma-stage{font-family:Courier New,monospace;font-size:10px;fill:#68766f}.ma-box{fill:#fff;stroke:#52665b;stroke-width:1.1}.ma-evidence-undisclosed .ma-box{stroke-dasharray:5 4;fill:#fffcf5}.ma-evidence-proposal .ma-box{stroke-dasharray:2 4;fill:#faf8fe}.ma-kind-kv-state .ma-box{fill:#f3faf7}.ma-kind-gradient .ma-box{fill:#faf5fc}.ma-edge-line{fill:none;stroke:#768d80;stroke-width:1.3;stroke-linejoin:round}.ma-edge-halo{fill:none;stroke:#fff;stroke-width:5}.ma-edge-hit{fill:none;stroke:transparent;stroke-width:15;pointer-events:stroke}.ma-kind-kv-state .ma-edge-line{stroke:#4e816a}.ma-kind-gradient .ma-edge-line{stroke:#86699b;stroke-dasharray:5 3}.ma-kind-metadata .ma-edge-line{stroke:#7e8798;stroke-dasharray:3 4}.ma-edge-label{font:10px Arial,Helvetica,sans-serif;fill:#52665b}.ma-open{font:11px Arial,Helvetica,sans-serif;fill:#294c6e;text-decoration:underline}.ma-node,.ma-edge,[data-open-view]{cursor:pointer}.ma-node:focus-visible .ma-box{stroke:#174b9a;stroke-width:3}.ma-edge:focus-visible .ma-edge-line{stroke:#174b9a;stroke-width:3}.ma-port{fill:white;stroke:#768d80;stroke-width:1}.ma-node:focus,.ma-edge:focus{outline:none}";

  function create(data) {
    if (!data || !Array.isArray(data.views) || !data.views.length) throw new Error("Architecture views are required");
    if (!/^[a-z0-9-]+$/.test(data.id) || data.views.length > 24) throw new Error("Invalid architecture identity or view count");
    const viewIds = new Set();
    for (const view of data.views) {
      if (!/^[a-z0-9-]+$/.test(view.id) || viewIds.has(view.id)) throw new Error("Invalid or duplicate view identity");
      viewIds.add(view.id);
      if (!Array.isArray(view.nodes) || !view.nodes.length || view.nodes.length > 128 || view.edges.length > 512) throw new Error("Graph budget exceeded");
      const ids = new Set(), positions = new Set();
      for (const node of view.nodes) {
        const position = node.row + "/" + node.column;
        if (!/^[a-z0-9-]+$/.test(node.id) || ids.has(node.id) || positions.has(position)) throw new Error("Duplicate or invalid node: " + data.id + "/" + view.id + "/" + node.id);
        if (!Number.isInteger(node.row) || node.row < 0 || node.row > 31 || !Number.isInteger(node.column) || node.column < 0 || node.column > 2) throw new Error("Invalid layout position");
        ids.add(node.id); positions.add(position);
      }
      for (const edge of view.edges) if (!ids.has(edge.from) || !ids.has(edge.to)) throw new Error("Unknown graph endpoint");
    }
    for (const view of data.views) for (const node of view.nodes) if (node.nextView && !viewIds.has(node.nextView)) throw new Error("Unknown detail view");
    const byView = new Map(data.views.map(view => [view.id, view]));
    function render(id = "model", mode = "inference", requestedWidth = 720) {
      const view = byView.get(id);
      if (!view) throw new Error("Unknown architecture view");
      const width = Math.max(720, Math.min(1280, Number.isFinite(requestedWidth) ? Math.round(requestedWidth) : 720));
      const nodeWidth = 188, left = (width - 636) / 2, stride = 224, rowGap = 194;
      const maxRow = Math.max(...view.nodes.map(node => node.row));
      const height = 78 + (maxRow + 1) * rowGap;
      const nodes = view.nodes.map(node => ({
        ...node, rect: { x: left + node.column * stride, y: 36 + node.row * rowGap, w: nodeWidth, h: 124 }, stage: node.row,
        subtitle: node.output, inputs: [{ name: "Input", shape: node.input }], outputs: [{ name: "Output", shape: node.output }],
      }));
      const byNode = new Map(nodes.map(node => [node.id, node]));
      const prefix = "architecture-" + data.id + "-" + id;
      const edges = view.edges.map((edge, index) => {
        const from = byNode.get(edge.from), to = byNode.get(edge.to);
        if (!from || !to) throw new Error("Unknown graph endpoint");
        const a = [from.rect.x + nodeWidth / 2, from.rect.y + from.rect.h];
        const b = [to.rect.x + nodeWidth / 2, to.rect.y];
        let points;
        if (to.row === from.row) {
          const forward = to.column > from.column;
          a[0] = from.rect.x + (forward ? nodeWidth : 0); a[1] = from.rect.y + 62;
          b[0] = to.rect.x + (forward ? 0 : nodeWidth); b[1] = to.rect.y + 62;
          points = [a, b];
        } else if (to.row === from.row + 1) {
          const mid = a[1] + 24 + (index % 3) * 8;
          points = a[0] === b[0] ? [a, b] : [a, [a[0], mid], [b[0], mid], b];
        } else {
          // Nonlocal dependencies and loops use outside lanes rather than crossing a box.
          const right = (index % 2) === 0, lane = right ? width - 10 - (index % 3) * 9 : 10 + (index % 3) * 9;
          points = [a, [a[0], a[1] + 18], [lane, a[1] + 18], [lane, b[1] - 18], [b[0], b[1] - 18], b];
        }
        const d = points.map((point, i) => (i ? "L" : "M") + point.join(" ")).join("");
        return { ...edge, id: edge.from + "-" + edge.to + "-" + index, from: { node: edge.from, port: "output" }, to: { node: edge.to, port: "input" }, kind: edge.kind || "activation", stage: to.row, detail: edge.label + ". " + from.title + " → " + to.title + ". Source output: " + from.output + "; destination input: " + to.input, points, d };
      });
      const rows = new Map(), edgesByRow = new Map();
      for (const node of nodes) { if (!rows.has(node.row)) rows.set(node.row, []); rows.get(node.row).push(node); }
      for (const edge of edges) { if (!edgesByRow.has(edge.stage)) edgesByRow.set(edge.stage, []); edgesByRow.get(edge.stage).push(edge.id); }
      const steps = [];
      for (let row = 0; row <= maxRow; row++) {
        const items = rows.get(row);
        if (items) steps.push({ title: items.map(node => node.title).join(" / "), detail: items.map(node => node.description).join(" "), nodes: items.map(node => node.id), edges: edgesByRow.get(row) || [] });
      }
      let body = `<rect width="${width}" height="${height}" fill="#fff"/><rect width="${width}" height="${height}" fill="url(#${prefix}-dots)"/>`;
      for (const edge of edges) {
        body += `<g class="ma-edge ma-kind-${escape(edge.kind)}" data-edge-id="${escape(edge.id)}" tabindex="0" role="button" aria-label="${escape(edge.detail)}"><title>${escape(edge.detail)}</title><path class="ma-edge-halo" d="${edge.d}"/><path class="ma-edge-line" d="${edge.d}" marker-end="url(#${prefix}-arrow)"/><path class="ma-edge-hit" d="${edge.d}"/>`;
        // Adjacent-row labels sit in the vertical gap; all connections retain full accessible detail.
        const from = byNode.get(edge.from.node), to = byNode.get(edge.to.node);
        if (to.row === from.row + 1 && from.column === to.column) {
          const x = from.rect.x + nodeWidth / 2 + 8, y = from.rect.y + 151;
          body += `<rect x="${x - 3}" y="${y - 11}" width="${Math.min(150, edge.label.length * 5.1 + 6)}" height="15" fill="#fff"/><text class="ma-edge-label" x="${x}" y="${y}">${escape(edge.label.length > 27 ? edge.label.slice(0, 25) + "…" : edge.label)}</text>`;
        }
        body += "</g>";
      }
      for (const node of nodes) {
        const { x, y, w, h } = node.rect;
        const titleLines = lines(node.title, 23), shapeLines = lines(node.output, 28);
        if (titleLines.length > 2 || shapeLines.length > 3) throw new Error("Node label exceeds layout budget: " + data.id + "/" + id + "/" + node.id);
        body += `<g class="ma-node ma-kind-${escape(node.kind || "activation")} ma-evidence-${escape(node.evidence)}" data-node-id="${escape(node.id)}" tabindex="0" role="button" aria-label="${escape(node.title)}"><title>${escape(node.title)}</title><desc>${escape(node.description)}</desc><rect class="ma-box" x="${x}" y="${y}" width="${w}" height="${h}" rx="7"/><text class="ma-stage" x="${x + 12}" y="${y + 17}">${String(node.row + 1).padStart(2, "0")} / ${escape(evidenceLabels[node.evidence])}</text>`;
        titleLines.forEach((line, i) => { body += `<text class="ma-text ma-node-title" x="${x + 12}" y="${y + 39 + i * 17}">${escape(line)}</text>`; });
        const shapeY = y + (titleLines.length > 1 ? 75 : 64);
        shapeLines.forEach((line, i) => { body += `<text class="ma-sub" x="${x + 12}" y="${shapeY + i * 13}">${escape(line)}</text>`; });
        if (node.nextView) body += `<text class="ma-open" x="${x + 12}" y="${y + h - 10}" data-open-view="${escape(node.nextView)}" tabindex="0" role="button">Open detail ↗</text>`;
        body += `<circle class="ma-port" cx="${x + w / 2}" cy="${y}" r="2.5"/><circle class="ma-port" cx="${x + w / 2}" cy="${y + h}" r="2.5"/></g>`;
      }
      const defs = `<defs><style>${svgStyle}</style><pattern id="${prefix}-dots" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".55" fill="#c9d7ce"/></pattern><marker id="${prefix}-arrow" viewBox="0 0 8 8" markerWidth="7" markerHeight="7" refX="7" refY="4" orient="auto"><path d="M1 1L7 4L1 7" fill="none" stroke="#768d80" stroke-width="1.1"/></marker></defs>`;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" data-view="${escape(id)}" role="group" aria-label="${escape(view.title)}"><title>${escape(view.title)}</title><desc>${escape(view.description + " " + data.scope)}</desc>${defs}${body}</svg>`;
      return { view: id, mode, width, height, title: view.title, subtitle: view.description, parent: id === "model" ? undefined : "model", scope: data.scope, nodes, edges, steps, svg, sources: data.sources };
    }
    return { views: data.views.map(view => ({ id: view.id, label: view.label, title: view.title, description: view.description, parent: view.id === "model" ? undefined : "model" })), render, version: 3 };
  }
  return { create };
});
