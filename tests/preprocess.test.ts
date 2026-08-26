import { describe, it } from "node:test";
import assert from "node:assert/strict";
import katex from "katex";
import { preprocess } from "../lib/content/preprocess";

describe("display-math normalization", () => {
  it("converts a lone-bracket block into $$ delimiters", () => {
    const { markdown, displayBlocks } = preprocess("[\nx^2\n]\n");
    assert.equal(displayBlocks, 1);
    assert.match(markdown, /\$\$\nx\^2\n\$\$/);
  });

  it("converts standard TeX display delimiters into remark-math delimiters", () => {
    const { markdown, displayBlocks } = preprocess("\\[\nx^2\n\\]\n");
    assert.equal(displayBlocks, 1);
    assert.match(markdown, /\$\$\nx\^2\n\$\$/);
    assert.ok(!markdown.includes("\\["));
    assert.ok(!markdown.includes("\\]"));
  });

  it("leaves an authored $$ display block exactly as written", () => {
    // Regression: the inline pass read the parenthesised TeX inside the fence as
    // the corpus's lossy inline form and wrapped it in `$…$`. Those dollars
    // closed the display early, so remark-math saw no math block and the
    // equation reached the page as raw source.
    const source = [
      "$$",
      "q\\notin\\operatorname{Support}(\\mathcal S)",
      "\\Longrightarrow",
      "z_t=E_\\theta(o_t)",
      "$$",
      "",
    ].join("\n");
    const { markdown, displayBlocks } = preprocess(source);
    assert.equal(displayBlocks, 1);
    assert.equal(markdown.trimEnd(), source.trimEnd());
  });

  it("requires a closing fence before treating $$ as display math", () => {
    // A lone `$$` must not turn the rest of the document into mathematics.
    const { markdown } = preprocess("$$\ncost is (n^2) here\n");
    assert.match(markdown, /\$n\^2\$/);
  });

  it("does not read a $$ inside a code fence as display math", () => {
    const source = ["```text", "$$", "(x^2)", "$$", "```", ""].join("\n");
    const { markdown, displayBlocks } = preprocess(source);
    assert.equal(displayBlocks, 0);
    assert.equal(markdown.trimEnd(), source.trimEnd());
  });

  it("tolerates a stray heading marker on the opening bracket", () => {
    // Regression: `# [` was parsed as a heading whose text is a bracket, so the
    // equation rendered as literal TeX in a paragraph, an empty-id <h2>[</h2>
    // entered the outline, and raw TeX polluted the search index.
    const { markdown, displayBlocks } = preprocess("# [\nx^2\n]\n");
    assert.equal(displayBlocks, 1);
    assert.ok(!markdown.includes("# ["), "the heading marker must not survive");
    assert.match(markdown, /\$\$\nx\^2\n\$\$/);
  });

  it("does not let a bracket inside the equation end the block", () => {
    // Regression: `\mathbb E[` on one line and its `]` on another made the
    // scanner terminate the block at the inner closer, splitting the equation
    // in two and showing the reader raw TeX.
    const source = "[\n\\frac{\n\\mathbb E[\nx\n]\n}{\ny\n}\n]\n";
    const { markdown, displayBlocks } = preprocess(source);
    assert.equal(displayBlocks, 1);
    assert.equal((markdown.match(/\$\$/g) ?? []).length, 2, "exactly one block");
    assert.ok(markdown.includes("\\mathbb E["), markdown);
    assert.ok(markdown.includes("y"), "the tail of the equation survives");
  });

  it("closes a block containing a half-open interval", () => {
    // Regression: counting brackets to find the terminator broke on intervals
    // like `\left[ a,b \right)`, which open a bracket that never closes. The
    // block never terminated and the whole equation was dumped onto the page as
    // raw TeX. Braces are the reliable signal, not brackets.
    const source =
      "[\n\\boxed{\n\\bigcup_{c=1}^{C_r} \\left[ a_{r,c},b_{r,c} \\right)\n}\n\\tag{A.50}\n]\n";
    const { markdown, displayBlocks } = preprocess(source);
    assert.equal(displayBlocks, 1);
    assert.equal((markdown.match(/\$\$/g) ?? []).length, 2);
    assert.ok(markdown.includes("\\tag{A.50}"), "the tag is inside the block");
    assert.ok(!markdown.includes("\n]\n"), "no stray delimiter is left behind");
  });

  it("does not let an indexing bracket end the block early", () => {
    // Regression: `H_L[I,:` on one line with its `]` on the next terminated the
    // block at the indexing bracket, so the rest of the equation — including
    // its `\tag` — was dumped onto the page as raw TeX.
    const source = "[\nH_L[I_k,:\n]\n\\in \\mathbb R^{d}\n\\tag{A.1}\n]\n";
    const { markdown, displayBlocks } = preprocess(source);
    assert.equal(displayBlocks, 1);
    assert.equal((markdown.match(/\$\$/g) ?? []).length, 2);
    // The tag must be *inside* the `$$` block, not trailing after it as prose.
    const block = /\$\$([\s\S]*?)\$\$/.exec(markdown)?.[1] ?? "";
    assert.ok(block.includes("\\tag{A.1}"), `tag escaped the block: ${markdown}`);
    assert.ok(block.includes("\\mathbb R"), "the rest of the equation is inside too");
  });

  it("closes a block whose interval is written with a bare bracket", () => {
    // Regression: an interval closed by a parenthesis — `[t^{0},t^{1})` — left a
    // literal bracket open that no `]` ever balanced, so the terminator was
    // never recognised and the whole equation was published as raw TeX. Two such
    // intervals appear here, as they do in the corpus.
    const source =
      "[\nf_k=\n\\left(\ns_k,\n[t_{valid}^{0},t_{valid}^{1}),\n[t_{sys}^{0},t_{sys}^{1})\n\\right)\n]\n";
    const { markdown, displayBlocks } = preprocess(source);
    assert.equal(displayBlocks, 1);
    assert.equal((markdown.match(/\$\$/g) ?? []).length, 2, "exactly one block");
    const block = /\$\$([\s\S]*?)\$\$/.exec(markdown)?.[1] ?? "";
    assert.ok(block.includes("\\right)"), `equation was cut short: ${markdown}`);
  });

  it("opens a block from a bracket that trails a paragraph", () => {
    // Regression: the corpus runs the opening delimiter onto the end of the
    // preceding prose instead of giving it its own line. That is not a lone
    // `[`, so the block was never recognised and the equation reached the page
    // as raw TeX between literal square brackets.
    const source = "See the definition. [\n\\text{a} \\neq \\text{b}\n]\n\nAfter.\n";
    const { markdown, displayBlocks } = preprocess(source);
    assert.equal(displayBlocks, 1);
    assert.match(markdown, /See the definition\./);
    assert.ok(!/\[\n/.test(markdown), `a literal bracket survived: ${markdown}`);
    const block = /\$\$([\s\S]*?)\$\$/.exec(markdown)?.[1] ?? "";
    assert.ok(block.includes("\\neq"), markdown);
  });

  it("keeps TeX that trails the opening bracket on the same line", () => {
    const source = "per KV-cache group. [\\text{A}_{2023}\n\\neq\n\\text{B}\n]\n";
    const { markdown, displayBlocks } = preprocess(source);
    assert.equal(displayBlocks, 1);
    const block = /\$\$([\s\S]*?)\$\$/.exec(markdown)?.[1] ?? "";
    assert.ok(block.includes("\\text{A}_{2023}"), `the head was dropped: ${markdown}`);
    assert.ok(markdown.startsWith("per KV-cache group."), markdown);
  });

  it("reconstructs an orphaned trailing boxed display without changing the source", () => {
    const source =
      "Context remains finite. xed{\nCorpus\\ storage\n\\neq\nModel\\ context.\n}\n]\n";
    const { markdown, displayBlocks } = preprocess(source);

    assert.equal(displayBlocks, 1);
    assert.ok(markdown.startsWith("Context remains finite."), markdown);
    const block = /\$\$([\s\S]*?)\$\$/.exec(markdown)?.[1] ?? "";
    assert.ok(block.includes("\\boxed{"), markdown);
    assert.ok(block.includes("Corpus\\ storage"), markdown);
    assert.ok(!markdown.includes(" xed{"), markdown);
  });

  it("reconstructs boxed displays truncated after prose or at the delimiter", () => {
    for (const source of [
      "Evidence. ([Docs][1])oxed{\n\\text{A}\\neq\\text{B}\n}\n]\n",
      "Evidence. ([Docs][1]){\n\\text{A}\\neq\\text{B}\n}\n]\n",
      "\\boxed{\n\\text{A}\\neq\\text{B}\n}\n]\n",
    ]) {
      const { markdown, displayBlocks } = preprocess(source);
      assert.equal(displayBlocks, 1, source);
      assert.match(markdown, /\$\$\n\\boxed\{/);
      assert.match(markdown, /\\text\{A\}\\neq\\text\{B\}/);
      assert.ok(!markdown.includes(")oxed{"), markdown);
    }
  });

  it("reconstructs a truncated PyTorch comparison after a citation", () => {
    const source =
      "Execution is backend-specific. ([OpenXLA][5])orch}\n" +
      "\\neq\n" +
      "\\text{CUDA}\n" +
      "]\n";
    const { markdown, displayBlocks } = preprocess(source);

    assert.equal(displayBlocks, 1);
    assert.ok(markdown.startsWith("Execution is backend-specific. ([OpenXLA][5])"));
    assert.match(
      markdown,
      /\$\$\n\\text\{PyTorch\}\n\\neq\n\\text\{CUDA\}\n\$\$/,
    );
    assert.ok(!markdown.includes("[5])orch}"), markdown);
  });

  it("reconstructs a complete text label whose command opener was lost", () => {
    const source =
      "Architecture. ([Source][1])model}\n" +
      "<\n" +
      "\\text{agent loop}\n" +
      "]\n";
    const { markdown, displayBlocks } = preprocess(source);

    assert.equal(displayBlocks, 1);
    assert.match(
      markdown,
      /\$\$\n\\text\{model\}\n<\n\\text\{agent loop\}\n\$\$/,
    );
    assert.ok(!markdown.includes("[1])model}"), markdown);
  });

  it("does not mistake a trailing bracket in prose for display math", () => {
    // A trailing `[` also begins Markdown links and references; without a real
    // terminator and actual maths ahead, the line must be left alone.
    for (const source of [
      "See [\nthe paper](https://e.com) for details.\n",
      "A sentence ending in a bracket [\nplain prose here\n]\n",
    ]) {
      const { markdown, displayBlocks } = preprocess(source);
      assert.equal(displayBlocks, 0, source);
      assert.ok(!markdown.includes("$$"), source);
    }
  });

  it("ignores escaped braces when balancing", () => {
    const source = "[\n\\{x\\}\n]\n";
    const { markdown, displayBlocks } = preprocess(source);
    assert.equal(displayBlocks, 1);
    assert.equal((markdown.match(/\$\$/g) ?? []).length, 2);
  });

  it("keeps a multi-line group together", () => {
    const source = "[\n\\frac{\na\n}{\nb\n}\n]\n";
    const { markdown, displayBlocks } = preprocess(source);
    assert.equal(displayBlocks, 1);
    assert.ok(markdown.includes("b"), "the denominator survives");
  });

  it("leaves an unmatched opening bracket exactly as authored", () => {
    const source = "[\nnever closed\n";
    const { markdown, displayBlocks } = preprocess(source);
    assert.equal(displayBlocks, 0);
    assert.ok(markdown.startsWith("["));
  });

  it("does not treat a link reference definition as display math", () => {
    const source = '[1]: https://example.com "Paper"\n';
    assert.equal(preprocess(source).markdown.trim(), source.trim());
  });

  it("never rewrites the inside of a fenced code block", () => {
    const source = "```python\n[\nnot_math = True\n]\n```\n";
    const { markdown, displayBlocks } = preprocess(source);
    assert.equal(displayBlocks, 0);
    assert.ok(markdown.includes("not_math = True"));
    assert.ok(!markdown.includes("$$"));
  });

  it("escapes underscores inside text-mode groups", () => {
    // Regression: `\text{… n_decoding_steps …}` is a snake_case identifier in a
    // comment, but KaTeX reads `_` as a subscript even in text mode, so the
    // second one is a double subscript and the whole equation fails to render.
    const { markdown } = preprocess("[\n\\text{fallback when n_decoding_steps absent}\n]\n");
    assert.ok(markdown.includes("n\\_decoding\\_steps"), markdown);
  });

  it("escapes text-mode specials for every text command", () => {
    for (const command of ["text", "textrm", "textbf", "textit", "textsf", "texttt"]) {
      const { markdown } = preprocess(`[\n\\${command}{a_b}\n]\n`);
      assert.ok(markdown.includes("a\\_b"), `${command}: ${markdown}`);
    }
  });

  it("leaves subscripts outside a text group alone", () => {
    // Only the inside of the group is escaped — real notation must still work.
    const { markdown } = preprocess("[\nx_{i} + \\text{step_count}\n]\n");
    assert.ok(markdown.includes("x_{i}"), `real subscript preserved: ${markdown}`);
    assert.ok(markdown.includes("step\\_count"), markdown);
  });

  it("repairs a setext-underline scar inside an equation", () => {
    const { markdown } = preprocess("[\na\n=====\nb\n]\n");
    assert.ok(markdown.includes("$$"));
    assert.ok(!markdown.includes("====="), "the scar becomes a single '='");
  });

  it("encodes a literal currency symbol used as a complete script label", () => {
    const source = String.raw`[
\mathbf z(\Pi)
==============
[
-Q,
J_{$},
L,
N_{\text{tokens}},
P_{\text{failure}}
].
]`;
    const { markdown, displayBlocks } = preprocess(source);
    const block = markdown.match(/\$\$\n([\s\S]*?)\n\$\$/)?.[1] ?? "";

    assert.equal(displayBlocks, 1);
    assert.ok(block.includes(String.raw`J_{\char"24}`), block);
    assert.ok(!block.includes(String.raw`J_{$}`), block);
    assert.ok(!block.includes(String.raw`J_{\$}`), block);
    assert.doesNotThrow(() =>
      katex.renderToString(block, { displayMode: true, throwOnError: true }),
    );
  });

  it("normalizes escaped currency scripts without changing inline math", () => {
    const escaped = preprocess(String.raw`[
J_{\$}+J_{\delta}
]`).markdown;
    const inline = "The comparison remains $J_x < J_y$.\n";

    assert.ok(escaped.includes(String.raw`J_{\char"24}+J_{\delta}`), escaped);
    assert.equal(preprocess(escaped).markdown, escaped);
    assert.equal(preprocess(inline).markdown, inline);
  });

  it("restores an equality moved ahead of a computed expression", () => {
    const source = String.raw`[
|I2I|
=====
# 4096^2
16{,}777{,}216
]`;
    const { markdown } = preprocess(source);
    const block = markdown.match(/\$\$\n([\s\S]*?)\n\$\$/)?.[1] ?? "";

    assert.equal(block, String.raw`|I2I|
=
4096^2
=
16{,}777{,}216`);
  });

  it("recovers a display closer carried into a mathematical blockquote", () => {
    const source = String.raw`[
\begin{array}{c|c}
\text{full vocabulary} &
\text{sampled student token}\
> 10\text{ teachers}&
> 9\text{ teachers}
> \end{array}
> ]`;
    const { markdown, displayBlocks } = preprocess(source);

    assert.equal(displayBlocks, 1);
    assert.equal((markdown.match(/\$\$/g) ?? []).length, 2);
    assert.ok(markdown.includes("\\end{array}"), markdown);
    assert.ok(!markdown.includes("> \\end{array}"), markdown);
    assert.ok(!markdown.includes("> ]"), markdown);
    assert.ok(markdown.includes("> 10"), "mathematical comparisons are preserved");
  });

  it("makes a comma-separated text set's outer braces visible", () => {
    const { markdown } = preprocess(
      String.raw`[
e\in
{\text{math, code, agent, instruction, ...}}.
]`,
    );

    assert.ok(
      markdown.includes(String.raw`e\in
\{\text{math, code, agent, instruction, ...}\}`),
      markdown,
    );
  });

  it("preserves multiline fraction grouping when its denominator contains nested commas", () => {
    const source = String.raw`\[
p'(x)=
\frac{\max(0,p(x)-q(x))}
{\sum_v\max(0,p(v)-q(v))}.
\]`;
    const { markdown, displayBlocks } = preprocess(source);
    const block = markdown.match(/\$\$\n([\s\S]*?)\n\$\$/)?.[1] ?? "";

    assert.equal(displayBlocks, 1);
    assert.ok(
      block.includes(String.raw`{\sum_v\max(0,p(v)-q(v))}`),
      block,
    );
    assert.ok(!block.includes(String.raw`\{\sum_v`), block);
    assert.doesNotThrow(() =>
      katex.renderToString(block, { displayMode: true, throwOnError: true }),
    );
  });

  it("preserves multiline fraction arguments and restores subtraction scars", () => {
    const equalityScar = "=".repeat(7);
    const subtractionScar = "-".repeat(14);
    const source = String.raw`[
\boxed{
T_\ell
${equalityScar}
\left\lfloor
\frac{
T_{\ell-1}
+
P_{\ell}^{R}
${subtractionScar}
D_\ell(K_\ell-1)
-1
}
{
S_{\ell,t}
}
+1
\right\rfloor
}
]`;
    const { markdown, displayBlocks } = preprocess(source);
    const block = markdown.match(/\$\$\n([\s\S]*?)\n\$\$/)?.[1] ?? "";

    assert.equal(displayBlocks, 1);
    assert.match(block, /P_\{\\ell\}\^\{R\}\n-\nD_\\ell/);
    assert.match(block, /\}\n\{\nS_\{\\ell,t\}\n\}\n\+1/);
    assert.ok(!block.includes(String.raw`\{S_{\ell,t}\}`), block);
    assert.doesNotThrow(() =>
      katex.renderToString(block, { displayMode: true, throwOnError: true }),
    );
  });

  it("distinguishes tuple and set-builder literals from grouped function calls", () => {
    const source = String.raw`\[
\mathcal D={(x_i,y_i)}_{i=1}^{N},
T={t\in\mathcal T:P(t)},
M={\max(0,p-q)}.
\]`;
    const { markdown } = preprocess(source);
    const block = markdown.match(/\$\$\n([\s\S]*?)\n\$\$/)?.[1] ?? "";

    assert.ok(block.includes(String.raw`\mathcal D=\{(x_i,y_i)\}_{i=1}^{N}`), block);
    assert.ok(block.includes(String.raw`T=\{t\in\mathcal T:P(t)\}`), block);
    assert.ok(block.includes(String.raw`M={\max(0,p-q)}`), block);
    assert.ok(!block.includes(String.raw`M=\{\max`), block);
  });

  it("keeps short prose-attached parameter equations in the reading flow", () => {
    const source = String.raw`For a kernel

[
(R,S)=(K_h,K_w),
]

stride

[
(U,V),
]

the learned weight tensor is

[
\boxed{W\in\mathbb R^{K\times C\times R\times S}}
]

After.`;
    const { markdown, displayBlocks, inlineSpans } = preprocess(source);

    assert.match(
      markdown,
      /For a kernel \$\(R,S\)=\(K_h,K_w\),\$\nstride \$\(U,V\),\$\nthe learned weight tensor is/,
    );
    assert.match(markdown, /\$\$\n\\boxed\{/);
    assert.equal(displayBlocks, 1);
    assert.equal(inlineSpans, 2);
  });

  it("keeps compact values introduced by colons in the reading flow", () => {
    const source = String.raw`The indexer and model are jointly adapted for:

[
20\text{B tokens},
]

using the training data with constant learning rate:

[
\eta=10^{-5}.
]

([arXiv][2])`;
    const { markdown, displayBlocks, inlineSpans } = preprocess(source);

    assert.match(
      markdown,
      /adapted for: \$20\\text\{B tokens\},\$\nusing the training data with constant learning rate: \$\\eta=10\^\{-5\}\.\$\n\(\[arXiv\]\[2\]\)/,
    );
    assert.equal(displayBlocks, 0);
    assert.equal(inlineSpans, 2);
  });

  it("attaches a sentence-closing compact equation without absorbing the next paragraph", () => {
    const source = String.raw`Therefore:

[
usage(t_{cancel})
]

may not equal:

[
usage(final).
]

The documentation advises waiting for stable usage values.`;
    const { markdown, displayBlocks, inlineSpans } = preprocess(source);

    assert.match(
      markdown,
      /Therefore: \$usage\(t_\{cancel\}\)\$\nmay not equal: \$usage\(final\)\.\$\n\nThe documentation/,
    );
    assert.equal(displayBlocks, 0);
    assert.equal(inlineSpans, 2);
  });

  it("removes connector-label colons only inside an inline equation sentence", () => {
    const source = String.raw`Where:

[
G_{resource}=(url,mount)
]

and:

[
G_{working}=(files,branch).
]

After.

and:`;
    const { markdown, displayBlocks, inlineSpans } = preprocess(source);

    assert.match(
      markdown,
      /Where: \$G_\{resource\}=\(url,mount\)\$\nand \$G_\{working\}=\(files,branch\)\.\$/,
    );
    assert.match(markdown, /\n\nAfter\.\n\nand:$/);
    assert.equal(displayBlocks, 0);
    assert.equal(inlineSpans, 2);
  });

  it("aligns short quoted answers with their prose labels", () => {
    const source = String.raw`Files answer:

[
\text{“What material should this session read?”}
]

Repositories answer:

[
\text{“What workspace should this session use?”}
]

Memory answers:

[
\boxed{
\text{“What state should survive?”}
}
]

---`;
    const { markdown, displayBlocks, inlineSpans } = preprocess(source);

    assert.match(markdown, /Files answer: \$\\text\{/);
    assert.match(markdown, /Repositories answer: \$\\text\{/);
    assert.match(markdown, /Memory answers: \$\\boxed\{ \\text\{/);
    assert.equal(displayBlocks, 0);
    assert.equal(inlineSpans, 3);
  });

  it("keeps one-sided and consecutively authored equations as display blocks", () => {
    const source = String.raw`## Stage

[
X\in\mathbb R^{B\times T}
]

For each sample,

[
Y=f(X)
]

Output:

[
Z=g(Y)
]

[
Z\in\mathbb R^{B\times D}
]

Temporal output:

[
\boxed{T=\frac{N+2P-D(K-1)-1}{S}+1}
]

## Next`;
    const { markdown, displayBlocks, inlineSpans } = preprocess(source);

    assert.match(markdown, /## Stage\n\n\$\$\nX\\in\\mathbb R\^\{B\\times T\}/);
    assert.match(markdown, /For each sample,\n\n\$\$\nY=f\(X\)/);
    assert.match(markdown, /Output:\n\n\$\$\nZ=g\(Y\)/);
    assert.match(markdown, /\$\$\nZ\\in\\mathbb R\^\{B\\times D\}/);
    assert.match(markdown, /\$\$\n\\boxed\{T=\\frac/);
    assert.equal(displayBlocks, 5);
    assert.equal(inlineSpans, 0);
  });

  it("makes indexed singleton set braces visible without changing grouping", () => {
    const equalityScar = "=".repeat(7);
    const source = String.raw`[
S_{t,a}
${equalityScar}
{s_{e,j}}
]

[
R_{t,a}
${equalityScar}
{\operatorname{expertID}_{j,k}}.
]

[
x
${equalityScar}
{a+b}
]

[
\mathcal T
${equalityScar}
{\mathsf T_{b,i}}_{b=1,i=1}^{B,G}
]

[
\mathcal T
${equalityScar}
{\tau_{b,i}}_{b,i}
]`;
    const { markdown, displayBlocks } = preprocess(source);

    assert.equal(displayBlocks, 5);
    assert.ok(markdown.includes(String.raw`\{s_{e,j}\}`), markdown);
    assert.ok(
      markdown.includes(String.raw`\{\operatorname{expertID}_{j,k}\}`),
      markdown,
    );
    assert.ok(markdown.includes("{a+b}"), "ordinary TeX grouping stays invisible");
    assert.ok(!markdown.includes(String.raw`\{a+b\}`), markdown);
    assert.ok(markdown.includes(String.raw`\{\mathsf T_{b,i}\}_{b=1,i=1}^{B,G}`), markdown);
    assert.ok(markdown.includes(String.raw`\{\tau_{b,i}\}_{b,i}`), markdown);
  });

  it("normalizes Unicode token glyphs and em dashes for strict TeX", () => {
    const source = String.raw`[
\mathtt{<｜begin▁of▁sentence｜>}
]

[
\boxed{\mathbf{KEEP\ MASK\ —\ LEARNER\ POLICY}}
]`;
    const { markdown, displayBlocks } = preprocess(source);
    const blocks = [...markdown.matchAll(/\$\$\n([\s\S]*?)\n\$\$/g)].map((match) => match[1]);

    assert.equal(displayBlocks, 2);
    assert.doesNotMatch(markdown, /[｜▁—]/);
    assert.match(markdown, /\\text\{\\char"FF5C\}/);
    assert.match(markdown, /\\rule\{0\.52em\}\{0\.12em\}/);
    assert.match(markdown, /\\text\{---\}/);

    for (const block of blocks) {
      const warnings: string[] = [];
      katex.renderToString(block, {
        strict: (code) => {
          warnings.push(code);
          return "warn";
        },
      });
      assert.deepEqual(warnings, [], `${block} produced ${warnings.join(", ")}`);
    }
  });

  it("replaces unsupported mbox commands without changing their text", () => {
    const source = String.raw`[
\mathcal E_i \in \{\mathsf{white\mbox{-}box},\mathsf{black\mbox{-}box}\}
\quad
\operatorname{Age}_{i,j,t}\uparrow\centernot\Longrightarrow\Delta_{i,j,t}\uparrow
]`;
    const { markdown, displayBlocks } = preprocess(source);
    const block = markdown.match(/\$\$\n([\s\S]*?)\n\$\$/)?.[1] ?? "";

    assert.equal(displayBlocks, 1);
    assert.doesNotMatch(block, /\\mbox\b/);
    assert.doesNotMatch(block, /\\centernot\b/);
    assert.match(block, /\\mathsf\{white\\text\{-\}box\}/);
    assert.match(block, /\\not\\Longrightarrow/);
    assert.doesNotThrow(() =>
      katex.renderToString(block, { displayMode: true, throwOnError: true }),
    );
  });

  it("preserves a valid starred operator while repairing its damaged subscript", () => {
    const source = String.raw`[
\operatorname*{arg,max}*{0\le r<77} u_r
]`;
    const { markdown } = preprocess(source);
    const block = markdown.match(/\$\$\n([\s\S]*?)\n\$\$/)?.[1] ?? "";

    assert.match(block, /\\operatorname\*\{arg,max\}_\{0\\le r<77\}/);
    assert.doesNotMatch(block, /\\operatorname_\{/);
    assert.doesNotThrow(() =>
      katex.renderToString(block, { displayMode: true, throwOnError: true }),
    );
  });

  it("normalizes multiplication stars without changing structural or text stars", () => {
    const source = String.raw`[
\begin{aligned}
p(t)&\xrightarrow{*,g_v*r}q(t) \\
a*b&=c \\
X^{*}&=\operatorname*{argmax}_x f(x) \\
\text{literal * marker}&=1
\end{aligned}
]`;
    const { markdown } = preprocess(source);
    const block = markdown.match(/\$\$\n([\s\S]*?)\n\$\$/)?.[1] ?? "";

    assert.match(block, /\\xrightarrow\{\\ast ,g_v\\ast r\}/);
    assert.match(block, /a\\ast b/);
    assert.match(block, /X\^\{\*\}/);
    assert.match(block, /\\operatorname\*\{argmax\}/);
    assert.match(block, /\\text\{literal \* marker\}/);
    assert.doesNotThrow(() =>
      katex.renderToString(block, { displayMode: true, throwOnError: true }),
    );
  });

  it("escapes literal braces consumed by delimiter-sizing commands", () => {
    const source = String.raw`[
\boxed{
\begin{aligned}
\Theta &= \Bigg{
& W_1,W_2 \\
& \left{W_3^{\ell}\right}*{\ell=1}^{2}
\Bigg}
\end{aligned}
}
]`;
    const { markdown } = preprocess(source);
    const block = markdown.match(/\$\$\n([\s\S]*?)\n\$\$/)?.[1] ?? "";

    assert.match(block, /\\Bigg\\\{/);
    assert.match(block, /\\Bigg\\\}/);
    assert.match(block, /\\left\\\{/);
    assert.match(block, /\\right\\\}/);
    assert.doesNotThrow(() =>
      katex.renderToString(block, { displayMode: true, throwOnError: true }),
    );
  });

  it("closes a block whose left set delimiter has an invisible right delimiter", () => {
    const source = String.raw`[
\boxed{
\Theta=
\left{
\begin{aligned}
&D=896,\quad L=24,\
&H=14.
\end{aligned}
\right.
}
]`;
    const { markdown, displayBlocks } = preprocess(source);
    const block = markdown.match(/\$\$\n([\s\S]*?)\n\$\$/)?.[1] ?? "";

    assert.equal(displayBlocks, 1);
    assert.ok(!markdown.includes("\n[\n"));
    assert.match(block, /\\left\\\{/);
    assert.doesNotThrow(() =>
      katex.renderToString(block, { displayMode: true, throwOnError: true }),
    );
  });

  it("restores an array row break collapsed before hline", () => {
    const source = String.raw`[
\begin{array}{c|c}
\text{Solver} & \text{NFE budget}\ \hline
\text{Euler} & 1
\end{array}
]`;
    const { markdown } = preprocess(source);
    const block = markdown.match(/\$\$\n([\s\S]*?)\n\$\$/)?.[1] ?? "";

    assert.match(block, /\\text\{NFE budget\}\\\\ \\hline/);
    assert.doesNotThrow(() =>
      katex.renderToString(block, { displayMode: true, throwOnError: true }),
    );
  });

  it("restores row breaks whose decimal dimensions lost both slashes", () => {
    const source = String.raw`[
\begin{array}{rcl}
\text{serving} &\Rightarrow& \textbf{vLLM},
[1.5mm]
\text{local} &\Rightarrow& \textbf{llama.cpp}
\end{array}
]`;
    const { markdown } = preprocess(source);
    const block = markdown.match(/\$\$\n([\s\S]*?)\n\$\$/)?.[1] ?? "";
    const warnings: string[] = [];

    assert.doesNotMatch(block, /\[1\.5mm\]/);
    assert.doesNotThrow(() =>
      katex.renderToString(block, {
        displayMode: true,
        throwOnError: true,
        strict: (code) => {
          warnings.push(code);
          return "ignore";
        },
      }),
    );
    assert.deepEqual(warnings, []);
  });
});

describe("inline-math normalization", () => {
  it("converts standard TeX inline delimiters without escaping the dollar fence", () => {
    const { markdown, inlineSpans } = preprocess(
      "Under the \\(\\mathrm{iid}\\mid q\\) assumption.\n",
    );
    assert.equal(inlineSpans, 1);
    assert.equal(markdown.trim(), "Under the $\\mathrm{iid}\\mid q$ assumption.");
    assert.ok(!markdown.includes("\\$"));
  });

  it("converts a parenthesized TeX group", () => {
    const { markdown, inlineSpans } = preprocess("where (\\epsilon=10^{-5}) holds\n");
    assert.ok(inlineSpans > 0);
    assert.match(markdown, /\$\\epsilon=10\^\{-5\}\$/);
  });

  it("converts cardinality bars outside table rows", () => {
    const source = "Reducing (|\\mathcal R|) increases target-prompt freedom.\n";
    const { markdown, inlineSpans } = preprocess(source);

    assert.equal(inlineSpans, 1);
    assert.equal(
      markdown.trim(),
      "Reducing $|\\mathcal R|$ increases target-prompt freedom.",
    );
  });

  it("makes union-set literals visible without changing grouped set symbols", () => {
    const source = String.raw`[
x \in {\mathcal X},
A \cup {\bot},
B \cup {v_{\mathrm{ignore}}},
C \cup {\text{one bounded chunk}},
E \setminus {r^\star},
D \in
{\text{prefill chunk},\text{decode token}},
\left( {0,\ldots,9} \cup {-100} \right)
]`;
    const { markdown } = preprocess(source);

    assert.ok(markdown.includes(String.raw`x \in {\mathcal X}`), markdown);
    assert.ok(markdown.includes(String.raw`A \cup \{\bot\}`), markdown);
    assert.ok(markdown.includes(String.raw`B \cup \{v_{\mathrm{ignore}}\}`), markdown);
    assert.ok(markdown.includes(String.raw`C \cup \{\text{one bounded chunk}\}`), markdown);
    assert.ok(markdown.includes(String.raw`E \setminus \{r^\star\}`), markdown);
    assert.ok(
      markdown.includes(String.raw`D \in
\{\text{prefill chunk},\text{decode token}\}`),
      markdown,
    );
    assert.ok(
      markdown.includes(String.raw`\left( \{0,\ldots,9\} \cup \{-100\} \right)`),
      markdown,
    );
  });

  it("leaves ordinary prose parentheticals untouched", () => {
    const source = "The result (see above) is stable, item (a) especially.\n";
    const { markdown, inlineSpans } = preprocess(source);
    assert.equal(inlineSpans, 0);
    assert.equal(markdown.trim(), source.trim());
  });

  it("does not corrupt Markdown link and image destinations", () => {
    // Destinations routinely contain `_`, `{` and `^`, which look like TeX.
    const source = "![fig](./assets/mha_flow.png) and [doc](https://e.com/a_b/c^d)\n";
    const { markdown } = preprocess(source);
    assert.ok(markdown.includes("(./assets/mha_flow.png)"));
    assert.ok(markdown.includes("(https://e.com/a_b/c^d)"));
  });

  it("converts math inside a table cell", () => {
    const { markdown } = preprocess("| a (\\alpha) | b |\n");
    assert.equal(markdown.trim(), "| a $\\alpha$ | b |");
  });

  it("restores a bar that a table swallowed from inside maths", () => {
    // `p_\theta(y_t|x_{<t})` in a table cell loses its `|` to the cell parser,
    // tearing the equation in two and leaving raw TeX on the page. The bar is a
    // maths symbol, so it is restored and the group becomes real maths.
    const source = "| 11 | CE: (\\log p_\\theta(y_t|x_t)). |\n";
    const { markdown } = preprocess(source);
    assert.ok(markdown.includes("\\mid"), markdown);
    assert.ok(/\$[^$]*\\mid[^$]*\$/.test(markdown), `bar is inside maths: ${markdown}`);
  });

  it("uses a delimiter bar after a sizing command", () => {
    // `\middle\mid` is not valid TeX — after `\left`/`\right`/`\middle` the bar
    // must be `\vert`, or the equation fails to render.
    const source = "| 1 | (\\left\\{q \\middle| p\\right\\}) |\n";
    const { markdown } = preprocess(source);
    assert.ok(markdown.includes("\\middle\\vert"), markdown);
    assert.ok(!markdown.includes("\\middle\\mid"), "must not emit invalid TeX");
  });

  it("never merges cells of a row that already fits the table", () => {
    // Regression: the bar-restoring repair ran on every row, so a row whose
    // cells were always separate got merged. The row then fell short of the
    // header and GFM padded it with blanks — tables rendered with empty
    // columns and their content apparently missing.
    const table = [
      "| Step | Expression | Status |",
      "|---|---|---|",
      "| 1 | (\\alpha) | ok |",
      "| 2 | plain text | ok |",
    ].join("\n");
    const cells = (l: string) =>
      l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").length;
    const out = preprocess(`${table}\n`).markdown.split("\n");
    const rows = out.filter((l) => /^\s{0,3}\|.*\|\s*$/.test(l));
    assert.equal(rows.length, 4, "no row added or dropped");
    for (const [i, row] of rows.entries()) {
      assert.equal(cells(row), 3, `row ${i} kept its 3 cells: ${row}`);
    }
  });

  it("still repairs a row that its own maths split", () => {
    // Here the `|` really did come from inside the equation, so the row has
    // more cells than the table declares and merging restores it.
    const table = [
      "| Step | Expression | Status |",
      "|---|---|---|",
      "| 1 | (\\log p(y_t|x_t)) | ok |",
    ].join("\n");
    const cells = (l: string) =>
      l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").length;
    const rows = preprocess(`${table}\n`)
      .markdown.split("\n")
      .filter((l) => /^\s{0,3}\|.*\|\s*$/.test(l));
    assert.equal(cells(rows[2]), 3, `over-wide row restored to 3 cells: ${rows[2]}`);
    assert.ok(rows[2].includes("\\mid"), rows[2]);
  });

  it("leaves ordinary table pipes alone", () => {
    const source = "| a | b | c |\n";
    assert.equal(preprocess(source).markdown.trim(), source.trim());
  });

  it("leaves a prose parenthetical containing a pipe alone", () => {
    const source = "| x | see (a | b) here | y |\n";
    assert.equal(preprocess(source).markdown.trim(), source.trim());
  });

  it("does not end an inline group at a half-open interval's parenthesis", () => {
    // Regression: `[a_{ij},b_{ij})` contributes a `)` with no `(`, which drove
    // the depth counter to zero early. The group was cut at `\right`, leaving
    // that command without its delimiter, and KaTeX fell back to raw TeX.
    const source = "| 5 | (\\displaystyle c=\\left(z,[a_{ij},b_{ij}),A_i\\right)) |\n";
    const { markdown } = preprocess(source);
    const span = /\$([^$]+)\$/.exec(markdown)?.[1] ?? "";
    assert.ok(span.includes("\\right)"), `group was cut at \\right: ${markdown}`);
    assert.ok(!/\\right\$/.test(markdown), "no dangling \\right may reach KaTeX");
  });

  it("spans several half-open intervals and a sized delimiter", () => {
    const source =
      "| 16 | (\\displaystyle q=\\left(s,[t^{v0},t^{v1}),[t^{s0},t^{s1})\\right)\\quad[\\mathbf D]) |\n";
    const { markdown } = preprocess(source);
    const span = /\$([^$]+)\$/.exec(markdown)?.[1] ?? "";
    assert.ok(span.includes("\\quad[\\mathbf D]"), `tail was lost: ${markdown}`);
    const left = (span.match(/\\left(?![a-zA-Z])/g) ?? []).length;
    const right = (span.match(/\\right(?![a-zA-Z])/g) ?? []).length;
    assert.equal(left, right, `unbalanced \\left/\\right: ${span}`);
  });

  it("still ends an ordinary group at its first parenthesis", () => {
    // The oracle only moves a terminator that produces invalid TeX; well-formed
    // maths must keep closing exactly where it always did.
    const { markdown } = preprocess("first (\\alpha_1) then (\\beta_2) end\n");
    assert.match(markdown, /\$\\alpha_1\$/);
    assert.match(markdown, /\$\\beta_2\$/);
  });

  it("leaves inline code spans verbatim", () => {
    const source = "call `f(x_{1})` directly\n";
    assert.equal(preprocess(source).markdown.trim(), source.trim());
  });
});

describe("determinism", () => {
  it("is idempotent in its counts for identical input", () => {
    const source = "# [\nx^2\n]\n\ntext with (\\alpha) inline\n";
    const first = preprocess(source);
    const second = preprocess(source);
    assert.equal(first.markdown, second.markdown);
    assert.equal(first.displayBlocks, second.displayBlocks);
    assert.equal(first.inlineSpans, second.inlineSpans);
  });
});

describe("private citation transport tokens", () => {
  const citation = "\uE200cite\uE202turn652764view0\uE201";

  it("removes unresolved transport metadata from publishable prose", () => {
    assert.equal(preprocess(`Evidence. ${citation}\n`).markdown.trim(), "Evidence.");
  });

  it("preserves citation-shaped text inside fenced code", () => {
    const source = `\`\`\`text\n${citation}\n\`\`\`\n`;
    assert.equal(preprocess(source).markdown.trim(), source.trim());
  });
});
