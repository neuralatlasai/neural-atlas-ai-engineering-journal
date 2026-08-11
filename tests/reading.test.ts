import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  countProseWords,
  estimateReadingMinutes,
  READING_WORDS_PER_MINUTE,
} from "../lib/content/reading";

describe("countProseWords", () => {
  it("counts plain prose", () => {
    assert.equal(countProseWords("one two three four five"), 5);
  });

  it("excludes fenced code, which would otherwise inflate technical articles", () => {
    const withCode = `Some prose here.

\`\`\`python
def attention(q, k, v):
    return softmax(q @ k.T) @ v
\`\`\`

More prose.`;
    // "Some prose here." (3) + "More prose." (2)
    assert.equal(countProseWords(withCode), 5);
  });

  it("excludes display and inline mathematics", () => {
    const withMath = `Given $x$ and $y$ we obtain:

$$
\\mathcal{L}(\\theta) = -\\sum_{t=1}^{T}\\log p_\\theta(x_t)
$$

That is the loss.`;
    // "Given and we obtain:" (4) + "That is the loss." (4)
    assert.equal(countProseWords(withMath), 8);
  });

  it("excludes table rows", () => {
    const withTable = `Intro text.

| Model | Layers |
|---|---|
| GLM | 92 |

Outro text.`;
    assert.equal(countProseWords(withTable), 4);
  });

  it("keeps link labels but drops their URLs", () => {
    assert.equal(countProseWords("See [the paper](https://example.com/very/long/path)."), 3);
  });

  it("drops inline code and bare URLs", () => {
    assert.equal(countProseWords("Set `head_dim` before https://example.com/x runs"), 3);
  });

  it("does not count private citation transport tokens", () => {
    assert.equal(
      countProseWords("Evidence remains. \uE200cite\uE202turn12view3\uE201"),
      2,
    );
  });

  it("ignores punctuation-only tokens", () => {
    assert.equal(countProseWords("--- *** ___ word"), 1);
  });

  it("is deterministic for identical input", () => {
    const source = "# Title\n\nBody text with $x$ math and `code`.";
    assert.equal(countProseWords(source), countProseWords(source));
  });
});

describe("estimateReadingMinutes", () => {
  it("never returns less than one minute", () => {
    assert.equal(estimateReadingMinutes(0), 1);
    assert.equal(estimateReadingMinutes(3), 1);
  });

  it("scales with the documented reading rate", () => {
    assert.equal(estimateReadingMinutes(READING_WORDS_PER_MINUTE * 10), 10);
  });

  it("rounds to the nearest minute", () => {
    assert.equal(estimateReadingMinutes(Math.round(READING_WORDS_PER_MINUTE * 2.4)), 2);
    assert.equal(estimateReadingMinutes(Math.round(READING_WORDS_PER_MINUTE * 2.6)), 3);
  });
});
