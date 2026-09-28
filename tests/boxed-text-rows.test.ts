import { it } from "node:test";
import assert from "node:assert/strict";
import katex from "katex";
import { compileArticle, prepareMathForRendering } from "../lib/content/compile";

it("repairs repeated text-only infix stacks without changing valid binomials", () => {
  const tex = String.raw`\boxed{\textbf{Summary: }\text{First}\atop\text{Second}\atop\text{Third}}`;
  const repaired = prepareMathForRendering(tex, true);
  assert.match(repaired, /\\begin\{gathered\}/);
  assert.doesNotMatch(repaired, /\\atop/);
  assert.equal(prepareMathForRendering(repaired, true), repaired);
  assert.doesNotThrow(() => katex.renderToString(repaired, { displayMode: true, strict: "error", throwOnError: true }));
  for (const valid of [String.raw`\boxed{\text{First}\atop\text{Second}}`, String.raw`\boxed{a\atop b}`, String.raw`\boxed{a\atop b\atop c}`]) {
    assert.equal(prepareMathForRendering(valid, true), valid);
  }
});

it("normalizes font aliases and text arrows with strict renderable semantics", () => {
  for (const tex of [String.raw`\mathbfcal A=\mathcal A`, String.raw`\mathbfcal{AB}`, String.raw`\text{learn block→memento format}`]) {
    const repaired = prepareMathForRendering(tex, true);
    assert.equal(prepareMathForRendering(repaired, true), repaired);
    assert.doesNotThrow(() => katex.renderToString(repaired, { displayMode: true, strict: "error", throwOnError: true }));
  }
  assert.equal(prepareMathForRendering(String.raw`\mathbfcal A`, true), String.raw`\boldsymbol{\mathcal{A}}`);
  for (const tex of [String.raw`\mathcal A`, String.raw`\mathbfcalculus A`, String.raw`\mathbfcal{A`, String.raw`\newcommand{\mathbfcal}[1]{\mathcal{#1}}\mathbfcal A`]) {
    assert.equal(prepareMathForRendering(tex, true), tex);
  }
});

it("preserves boxed statement rows in a strict display alignment", async () => {
  const tex = String.raw`\boxed{\textbf{Local computation}\\\textbf{Bounded communication}}`;
  const repaired = prepareMathForRendering(tex, true);
  assert.match(repaired, /\\begin\{gathered\}/);
  assert.ok(repaired.includes(String.raw`\textbf{Local computation}\\\textbf{Bounded communication}`));
  assert.equal(prepareMathForRendering(repaired, true), repaired);
  assert.doesNotThrow(() => katex.renderToString(repaired, { displayMode: true, strict: "error", throwOnError: true }));
  const article = await compileArticle(`$$\n${tex}\n$$`, "Boxed statement");
  assert.match(article.html, /gathered/);
  assert.doesNotMatch(article.html, /katex-error/);
});

it("does not reinterpret valid equations, nested text, inline math, or fenced examples", async () => {
  const counterexamples = [
    String.raw`\boxed{\text{Single row}}`,
    String.raw`\boxed{\begin{aligned}a&=b\\c&=d\end{aligned}}`,
    String.raw`\boxed{a=b\\c=d}`,
    String.raw`\boxed{\text{Nested {group}}\\\text{Another row}}`,
  ];
  for (const tex of counterexamples) assert.equal(prepareMathForRendering(tex, true), tex);
  const textRows = String.raw`\boxed{\text{First}\\\text{Second}}`;
  assert.equal(prepareMathForRendering(textRows, false), textRows);
  const article = await compileArticle(`\`\`\`text\n${textRows}\n\`\`\``, "Example");
  assert.doesNotMatch(article.html, /gathered/);
});
