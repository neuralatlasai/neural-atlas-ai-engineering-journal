import assert from "node:assert/strict";
import { describe, it } from "node:test";
import katex from "katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { prepareMathForRendering } from "../lib/content/compile";
import { getAllArticles, readSource } from "../lib/content/corpus";
import { preprocess } from "../lib/content/preprocess";

interface MathNode {
  type: "math" | "inlineMath";
  value: string;
}

interface TextNode {
  type: "text";
  value: string;
}

function isMathNode(node: unknown): node is MathNode {
  if (typeof node !== "object" || node === null) return false;
  const candidate = node as { type?: unknown; value?: unknown };
  return (
    (candidate.type === "math" || candidate.type === "inlineMath") &&
    typeof candidate.value === "string"
  );
}

function isTextNode(node: unknown): node is TextNode {
  if (typeof node !== "object" || node === null) return false;
  const candidate = node as { type?: unknown; value?: unknown };
  return candidate.type === "text" && typeof candidate.value === "string";
}

const RAW_TEX_COMMAND =
  /\\(?:frac|sum|prod|int|mathbb|mathcal|mathrm|mathbf|operatorname|left|right|alpha|beta|gamma|delta|theta|epsilon|sigma|lambda|nabla|cdot|times|leq|geq|neq|approx|propto|text|displaystyle|begin|end|tag|boxed|hat|tilde|vec|quad|mid|vert|in|forall|exists)\b/;

describe("published mathematics", () => {
  it("parses every equation with the production repair pipeline", () => {
    const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath);
    const failures: string[] = [];
    let equations = 0;

    // O(total corpus bytes + total TeX bytes): each document and equation is
    // visited once. Rendering only KaTeX's parser output avoids building the
    // multi-megabyte HTML trees that a full article compilation would allocate.
    for (const article of getAllArticles()) {
      const markdown = preprocess(readSource(article.sourcePath)).markdown;
      const tree = parser.parse(markdown);

      visit(tree, (node) => {
        if (!isMathNode(node)) return;
        equations += 1;
        const displayMode = node.type === "math";
        const tex = prepareMathForRendering(node.value, displayMode);
        const warnings: string[] = [];

        try {
          katex.renderToString(tex, {
            displayMode,
            throwOnError: true,
            strict: (code, message) => {
              warnings.push(`${code}: ${message}`);
              return "ignore";
            },
          });
          if (warnings.length > 0) {
            failures.push(
              `${article.route}: ${warnings.join("; ")}\n${tex.slice(0, 600)}`,
            );
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          failures.push(`${article.route}: ${message}\n${tex.slice(0, 600)}`);
        }
      });
    }

    assert.ok(equations > 0, "the published corpus must contain mathematics");
    assert.deepEqual(failures, []);
  });

  it("does not leave TeX commands in prose nodes", () => {
    const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath);
    const failures: string[] = [];

    // Code nodes are structurally distinct from prose text nodes, so technical
    // examples remain verbatim while missed math delimiters fail before the
    // slower production export and postbuild audit.
    for (const article of getAllArticles()) {
      const markdown = preprocess(readSource(article.sourcePath)).markdown;
      const tree = parser.parse(markdown);

      visit(tree, (node) => {
        if (!isTextNode(node) || !RAW_TEX_COMMAND.test(node.value)) return;
        failures.push(`${article.route}: ${node.value.slice(0, 300)}`);
      });
    }

    assert.deepEqual(failures, []);
  });
});
