import type { Element, Root } from "hast";
import { visit, SKIP } from "unist-util-visit";
import { withBasePath } from "../site";

/** Local, sandboxed figure documents; Markdown images remain the static fallback. */
export function interactiveFigureUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 512) return undefined;
  if (value.startsWith("//")) return undefined;
  if (!/^\/[a-zA-Z0-9/_-]+\.html$/.test(value)) return undefined;
  return withBasePath(value);
}

/** A single O(n) AST pass, independent of article identity or figure mechanism. */
export function frameInteractiveFigures() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "figure") return;
      const src = interactiveFigureUrl(node.properties.dataInteractiveSrc);
      if (!src) return;
      let label = "Interactive technical figure";
      visit(node, "element", (child: Element) => {
        if (child.tagName === "img" && typeof child.properties.alt === "string") {
          label = child.properties.alt;
          return SKIP;
        }
      });
      const classes = node.properties.className;
      node.properties.className = [
        ...(Array.isArray(classes) ? classes : []),
        "interactive-figure",
      ];
      delete node.properties.dataInteractiveSrc;
      node.children = [
        {
          type: "element",
          tagName: "iframe",
          properties: {
            className: ["interactive-figure__frame"],
            dataInteractiveFrame: true,
            dataSrc: src,
            title: label,
            sandbox: ["allow-scripts"],
            referrerPolicy: "no-referrer",
            loading: "lazy",
            hidden: true,
          },
          children: [],
        },
        {
          type: "element",
          tagName: "div",
          properties: { className: ["interactive-figure__fallback"] },
          children: node.children,
        },
      ];
      return SKIP;
    });
  };
}
