import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { extractLede } from "../lib/content/lede";

const PROSE =
  "DeepSeek-V4-Pro is a post-trained, decoder-only sparse MoE language model with 1.6T total parameters and a long context window.";

describe("extractLede", () => {
  it("returns the first real paragraph", () => {
    assert.equal(extractLede(`# Title\n\n${PROSE}\n`), PROSE);
  });

  it("skips an opening image", () => {
    // Regression: `attention.md` opens with an image, which was being shown as
    // the article's description.
    const body = `# MHA\n![](./assets/MHA_flow.png)\n\n${PROSE}\n`;
    assert.equal(extractLede(body), PROSE);
  });

  it("skips bare-bracket display maths", () => {
    // Regression: the deck read `[ X \\in \\mathbb{R}^{B×T×d} ]`.
    const body = `# MHA\n[\nX \\in \\mathbb{R}^{B\\times T\\times d}\n]\n\n${PROSE}\n`;
    const lede = extractLede(body);
    assert.equal(lede, PROSE);
    assert.ok(!lede.includes("\\"));
    assert.ok(!lede.includes("mathbb"));
  });

  it("skips display maths carrying the `# [` scar", () => {
    const body = `# T\n# [\nx^2\n]\n\n${PROSE}\n`;
    assert.equal(extractLede(body), PROSE);
  });

  it("skips $$ display maths", () => {
    const body = `# T\n$$\n\\mathcal{L}(\\theta)\n$$\n\n${PROSE}\n`;
    assert.equal(extractLede(body), PROSE);
  });

  it("skips standard TeX display maths", () => {
    const body = `# T\n\\[\n\\mathcal{L}(\\theta)\n\\]\n\n${PROSE}\n`;
    assert.equal(extractLede(body), PROSE);
  });

  it("skips fenced code", () => {
    const body = `# T\n\n\`\`\`python\nx = 1  # a fairly long comment line about attention heads\n\`\`\`\n\n${PROSE}\n`;
    assert.equal(extractLede(body), PROSE);
  });

  it("skips tables, blockquotes, and rules", () => {
    const body = `# T\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n> quoted\n\n---\n\n${PROSE}\n`;
    assert.equal(extractLede(body), PROSE);
  });

  it("skips prose-styled front matter", () => {
    const body = `# T\n\n**Target checkpoint:** \`zai-org/GLM-5.2\`\n**Release date:** June 16, 2026\n\n${PROSE}\n`;
    assert.equal(extractLede(body), PROSE);
  });

  it("skips link reference definitions", () => {
    const body = `# T\n\n[1]: https://example.com/a-fairly-long-url-that-would-otherwise-qualify\n\n${PROSE}\n`;
    assert.equal(extractLede(body), PROSE);
  });

  it("falls back to a list item when there is no paragraph", () => {
    const body = `# T\n\n### Result\n\n1. **DeepSeek-V3 has the highest observability.** The report discloses accelerator count and parallelism degrees.\n`;
    const lede = extractLede(body);
    assert.ok(lede.startsWith("DeepSeek-V3 has the highest observability."), lede);
    assert.ok(!lede.includes("**"));
    assert.ok(!lede.startsWith("1."));
  });

  it("prefers a paragraph over a list item even when the list comes first", () => {
    const body = `# T\n\n- ${PROSE}\n\n${PROSE} And a second sentence follows here.\n`;
    assert.ok(extractLede(body).endsWith("And a second sentence follows here."));
  });

  it("returns empty rather than TeX when the document opens with only maths", () => {
    const body = `# MHA\n[\nX \\in \\mathbb{R}^{d}\n]\n\n[\nh = 8\n]\n`;
    assert.equal(extractLede(body), "");
  });

  it("does not reach deep into the document for prose", () => {
    // Prose a thousand lines down is a mid-article aside, not a summary.
    const body = `# T\n${"[\nx^2\n]\n\n".repeat(60)}\n${PROSE}\n`;
    assert.equal(extractLede(body), "");
  });

  it("strips inline markup and keeps link labels", () => {
    const body = `# T\n\nThe **shared** \`kv\` representation follows the [RoFormer](https://x.example) formulation for relative positions.\n`;
    const lede = extractLede(body);
    assert.ok(!/[*`\[\]]/.test(lede), lede);
    assert.ok(lede.includes("RoFormer"));
  });

  it("truncates long prose on a word boundary", () => {
    const long = `${"word ".repeat(200)}end.`;
    const lede = extractLede(`# T\n\n${long}\n`);
    assert.ok(lede.length <= 261, String(lede.length));
    assert.ok(lede.endsWith("…"));
    assert.ok(!lede.endsWith(" …"));
  });

  it("rejects short fragments", () => {
    assert.equal(extractLede("# T\n\nToo short.\n"), "");
  });

  it("reduces inline mathematics to readable text", () => {
    // Regression: the deck is rendered as plain text and never passes through
    // the Markdown compiler, so a parenthesised TeX group reached the reader
    // verbatim — in the deck, every listing row, `<meta description>`, the Open
    // Graph tags, and the search index.
    const body = `# T\n\nA maximum context length of (2^{20}=1{,}048{,}576) tokens is supported by this runtime configuration.\n`;
    const lede = extractLede(body);
    assert.ok(!lede.includes("{"), lede);
    assert.ok(!lede.includes("}"), lede);
    assert.ok(lede.includes("1,048,576"), `thousands separator restored: ${lede}`);
  });

  it("unwraps TeX text commands in a deck", () => {
    const body = `# T\n\nThe \\text{Goodput} objective governs scheduling decisions across every request in the queue.\n`;
    const lede = extractLede(body);
    assert.ok(lede.includes("Goodput"), lede);
    assert.ok(!lede.includes("\\text"), lede);
  });

  it("is deterministic", () => {
    const body = `# T\n\n${PROSE}\n`;
    assert.equal(extractLede(body), extractLede(body));
  });
});
