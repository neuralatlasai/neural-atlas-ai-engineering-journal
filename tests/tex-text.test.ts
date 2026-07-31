import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { headingLabel, plainTextFromTeX, titleLabel } from "../lib/content/tex-text";

describe("plainTextFromTeX", () => {
  it("leaves ordinary prose untouched", () => {
    assert.equal(plainTextFromTeX("Query-key dot product"), "Query-key dot product");
  });

  it("unwraps a text command", () => {
    assert.equal(plainTextFromTeX("\\text{DeepSeek-V4-Pro}"), "DeepSeek-V4-Pro");
  });

  it("unwraps nested wrappers to a fixed point", () => {
    // The corpus writes whole headings this way.
    assert.equal(
      plainTextFromTeX("\\boxed{\\text{Algorithm 1: Manifold-Constrained Hyper-Connection}}"),
      "Algorithm 1: Manifold-Constrained Hyper-Connection",
    );
  });

  it("handles a mix of TeX and prose", () => {
    assert.equal(
      plainTextFromTeX("\\text{DeepSeek-V4-Pro}: Mathematical Pseudo-Algorithm"),
      "DeepSeek-V4-Pro: Mathematical Pseudo-Algorithm",
    );
  });

  it("unwraps the other text-bearing commands", () => {
    assert.equal(plainTextFromTeX("\\mathrm{CSA}: overlapping"), "CSA: overlapping");
    assert.equal(plainTextFromTeX("\\operatorname{TopK}"), "TopK");
    assert.equal(plainTextFromTeX("\\mathbb{R}"), "R");
  });

  it("restores TeX thousands separators", () => {
    assert.equal(plainTextFromTeX("47{,}616 bytes"), "47,616 bytes");
  });

  it("translates common symbols", () => {
    assert.equal(plainTextFromTeX("d \\times h"), "d × h");
    assert.equal(plainTextFromTeX("a \\to b"), "a → b");
  });

  it("drops delimiters and leftover commands rather than showing them", () => {
    const label = plainTextFromTeX("$\\frac{a}{b}$");
    assert.ok(!label.includes("\\"), label);
    assert.ok(!label.includes("$"), label);
    assert.ok(!label.includes("{"), label);
  });

  it("collapses whitespace", () => {
    assert.equal(plainTextFromTeX("  a   \n  b  "), "a b");
  });

  it("is deterministic", () => {
    const input = "\\boxed{\\text{Algorithm 2: Token-Level KV Compressor}}";
    assert.equal(plainTextFromTeX(input), plainTextFromTeX(input));
  });
});

describe("headingLabel", () => {
  it("never reduces a heading to nothing", () => {
    // An unlabelled outline entry is worse than an ugly one.
    for (const input of ["\\\\", "{}", "$$", "\\alpha"]) {
      assert.ok(headingLabel(input).length > 0, `empty label for ${JSON.stringify(input)}`);
    }
  });

  it("prefers the cleaned form when there is one", () => {
    assert.equal(headingLabel("\\text{Prefill}"), "Prefill");
  });
});

describe("titleLabel", () => {
  it("turns a TeX-only algorithm heading into a plain page title", () => {
    assert.equal(
      titleLabel("(\\boxed{\\textbf{Algorithm 1: }\\mathsf{DEEPSEEK_V4_PRETRAIN}})"),
      "Algorithm 1: DEEPSEEK V4 PRETRAIN",
    );
  });

  it("does not return raw TeX when no readable label exists", () => {
    assert.equal(titleLabel("\\alpha"), "");
  });

  it("leaves ordinary authored titles unchanged", () => {
    assert.equal(titleLabel("PagedAttention in production"), "PagedAttention in production");
  });
});
