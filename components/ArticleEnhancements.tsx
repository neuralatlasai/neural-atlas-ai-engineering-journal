"use client";

import { useEffect } from "react";
import { enhanceInteractiveFigures } from "@/lib/interactive-figures";

/**
 * Progressive enhancement for the statically-rendered article body: adds a
 * copy button to each code block.
 * The content is fully usable without any of this (plan §3.3).
 */
export function ArticleEnhancements() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".article-body");
    if (!root) return;
    const cleanups: (() => void)[] = [];
    cleanups.push(enhanceInteractiveFigures(root));
    let disposed = false;

    // Copy buttons on code blocks.
    root.querySelectorAll<HTMLElement>("figure.code-block").forEach((figure) => {
      // A Mermaid figure publishes the rendered system diagram, not an exposed
      // source-code affordance. Its exact source remains in the static fallback
      // for failed rendering and no-JavaScript readers.
      if (figure.classList.contains("mermaid-diagram")) return;
      const bar = figure.querySelector(".code-block__bar");
      const code = figure.querySelector("pre code");
      if (!bar || !code || bar.querySelector(".code-copy")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "code-copy";
      btn.textContent = "Copy";
      const payloadLabel =
        figure.dataset.layout === "diagram" ? "diagram" : "code";
      btn.setAttribute("aria-label", `Copy ${payloadLabel} to clipboard`);
      const onClick = async () => {
        try {
          await navigator.clipboard.writeText(code.textContent ?? "");
          btn.textContent = "Copied";
          btn.classList.add("is-copied");
          setTimeout(() => {
            btn.textContent = "Copy";
            btn.classList.remove("is-copied");
          }, 1600);
        } catch {
          btn.textContent = "Press ⌘C";
        }
      };
      btn.addEventListener("click", onClick);
      bar.appendChild(btn);
      cleanups.push(() => {
        btn.removeEventListener("click", onClick);
        btn.remove();
      });
    });

    const diagrams = Array.from(
      root.querySelectorAll<HTMLElement>("figure.mermaid-diagram"),
    );
    if (diagrams.length > 0) {
      void (async () => {
        // Mermaid measures labels while laying out the graph. Waiting for the
        // article fonts prevents late font swaps from pushing text outside its
        // node, as recommended by Mermaid's integration contract.
        await document.fonts?.ready;
        const { default: mermaid } = await import("mermaid");
        if (disposed) return;

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          suppressErrorRendering: true,
          maxTextSize: 50_000,
          maxEdges: 500,
          // Dagre is Mermaid's stable built-in layered renderer. The external
          // ELK integration currently serializes host DOM state in React and
          // can fail on valid diagrams; local viewport scaling below preserves
          // legibility without taking that experimental failure path.
          layout: "dagre",
          theme: "base",
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          themeVariables: {
            background: "#f8f6ef",
            primaryColor: "#f8f6ef",
            primaryTextColor: "#171710",
            primaryBorderColor: "#77786f",
            secondaryColor: "#e9edff",
            secondaryTextColor: "#171710",
            secondaryBorderColor: "#8297e8",
            tertiaryColor: "#f1e9e4",
            tertiaryTextColor: "#171710",
            tertiaryBorderColor: "#bd9182",
            lineColor: "#676960",
            clusterBkg: "#f0efe8",
            clusterBorder: "#a4a69d",
            edgeLabelBackground: "#f8f6ef",
            fontSize: "14px",
          },
          flowchart: {
            htmlLabels: false,
            useMaxWidth: true,
            nodeSpacing: 34,
            rankSpacing: 52,
            curve: "basis",
            padding: 16,
          },
        });

        for (const [index, figure] of diagrams.entries()) {
          if (disposed) return;
          const source = figure.querySelector<HTMLPreElement>(
            ".mermaid-diagram__source",
          );
          const code = source?.querySelector("code");
          const canvas = figure.querySelector<HTMLElement>(
            ".mermaid-diagram__canvas",
          );
          const bar = figure.querySelector<HTMLElement>(
            ".mermaid-diagram__bar",
          );
          if (!source || !code || !canvas || !bar) continue;

          const definition = code.textContent ?? "";
          if (definition.trim().length === 0) continue;

          try {
            const rendered = await mermaid.render(
              `na-mermaid-${index}`,
              definition,
            );
            if (disposed) return;

            // `securityLevel: strict` encodes authored HTML and disables graph
            // click directives before Mermaid returns this SVG string.
            canvas.innerHTML = rendered.svg;
            rendered.bindFunctions?.(canvas);
            const svg = canvas.querySelector<SVGSVGElement>("svg");
            if (svg) {
              svg.removeAttribute("height");
              svg.setAttribute("role", "img");
              svg.setAttribute(
                "aria-label",
                "System architecture diagram rendered from Mermaid source",
              );
              svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
            }

            canvas.hidden = false;
            source.hidden = true;
            figure.dataset.mermaidState = "rendered";
            cleanups.push(() => {
              canvas.replaceChildren();
              canvas.hidden = true;
              source.hidden = false;
              figure.dataset.mermaidState = "pending";
            });
          } catch (error) {
            // The source remains visible and copyable. One malformed diagram
            // must not prevent the rest of the article from being read. Keep a
            // bounded diagnostic on the figure so visual QA can identify a
            // renderer failure without exposing it as publication content.
            figure.dataset.mermaidState = "source";
            figure.dataset.mermaidError =
              error instanceof Error
                ? error.message.slice(0, 240)
                : "Unknown Mermaid rendering failure";
          }
        }
      })();
    }

    return () => {
      disposed = true;
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return null;
}
