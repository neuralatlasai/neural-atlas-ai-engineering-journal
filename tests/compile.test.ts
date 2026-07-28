import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { compileArticle, extractArticleIndex } from "../lib/content/compile";

/** Heading levels rendered in document order, e.g. `[2, 3, 3, 2]`. */
function headingLevels(html: string): number[] {
  return [...html.matchAll(/<h([1-6])[^>]*>/g)].map((m) => Number(m[1]));
}

function assertNoHeadingJumps(html: string): void {
  const levels = headingLevels(html);
  assert.ok(levels.every((level) => level >= 2), "body headings must not use <h1>");
  for (let i = 1; i < levels.length; i++) {
    assert.ok(
      levels[i] - levels[i - 1] <= 1,
      `heading jump h${levels[i - 1]} → h${levels[i]} breaks the outline`,
    );
  }
}

describe("heading normalization", () => {
  it("starts a document whose shallowest heading is ## at h2, not h3", async () => {
    // The page renders the title as <h1>; starting the body at <h3> would leave
    // an h1 → h3 jump, which fails WCAG 2.2 and the build's HTML audit.
    const { html } = await compileArticle("## First\n\ntext\n\n### Nested\n\ntext\n", "Title");
    assert.deepEqual(headingLevels(html), [2, 3]);
    assertNoHeadingJumps(html);
  });

  it("drops a leading # that merely repeats the page title", async () => {
    const { html } = await compileArticle("# My Title\n\n## Section\n\ntext\n", "My Title");
    assert.ok(!html.includes("My Title"), "the duplicated title heading is removed");
    assert.deepEqual(headingLevels(html), [2]);
  });

  it("keeps a leading # that is not the title, renumbered into the outline", async () => {
    const { html } = await compileArticle("# Something Else\n\ntext\n", "My Title");
    assert.ok(html.includes("Something Else"));
    assert.deepEqual(headingLevels(html), [2]);
  });

  it("preserves relative nesting when authors skip a level", async () => {
    const { html } = await compileArticle(
      "## A\n\nx\n\n#### Deep\n\nx\n\n## B\n\nx\n",
      "Title",
    );
    // Nesting depth, not the authored number, decides the tag.
    assert.deepEqual(headingLevels(html), [2, 3, 2]);
    assertNoHeadingJumps(html);
  });

  it("never emits a level below h6", async () => {
    const source = ["#", "##", "###", "####", "#####", "######"]
      .map((h, i) => `${h} L${i}\n\ntext\n`)
      .join("\n");
    const { html } = await compileArticle(source, "Title");
    assert.deepEqual(headingLevels(html), [2, 3, 4, 5, 6, 6]);
  });
});

describe("outline records", () => {
  it("collects h2 and h3 with the ids present in the rendered HTML", async () => {
    const { html, headings } = await compileArticle(
      "## Alpha\n\ntext\n\n### Beta\n\ntext\n",
      "Title",
    );
    assert.deepEqual(
      headings.map((h) => [h.depth, h.text]),
      [
        [2, "Alpha"],
        [3, "Beta"],
      ],
    );
    // A heading id that is not in the document would produce a dead outline link.
    for (const heading of headings) {
      assert.ok(html.includes(`id="${heading.id}"`), `missing anchor #${heading.id}`);
    }
  });

  it("captures heading text without the injected anchor marker", async () => {
    const { headings } = await compileArticle("## Alpha\n\ntext\n", "Title");
    assert.equal(headings[0].text, "Alpha");
  });
});

describe("search segments", () => {
  it("anchors body text to the preceding heading", async () => {
    const { searchSegments } = await compileArticle(
      "## Alpha\n\nfirst body\n\n## Beta\n\nsecond body\n",
      "Title",
    );
    const body = searchSegments.filter((s) => s.kind === "body");
    assert.deepEqual(
      body.map((s) => [s.headingText, s.text]),
      [
        ["Alpha", "first body"],
        ["Beta", "second body"],
      ],
    );
  });

  it("marks text before the first heading as having no heading", async () => {
    const { searchSegments } = await compileArticle("lead text\n\n## Alpha\n\nbody\n", "Title");
    assert.equal(searchSegments[0].headingId, null);
    assert.equal(searchSegments[0].text, "lead text");
  });

  it("excludes mathematics, which would fill the index with TeX", async () => {
    const { searchSegments } = await compileArticle(
      "The loss $\\mathcal{L}_\\theta$ is minimized.\n",
      "Title",
    );
    const body = searchSegments.find((s) => s.kind === "body");
    assert.ok(body);
    assert.ok(!body.text.includes("mathcal"), `TeX leaked into the index: ${body.text}`);
    assert.ok(body.text.includes("is minimized"));
  });

  it("classifies code separately from prose", async () => {
    const { searchSegments } = await compileArticle(
      "prose here\n\n```python\nhead_dim = 128\n```\n",
      "Title",
    );
    const code = searchSegments.find((s) => s.kind === "code");
    assert.ok(code, "code blocks must be indexed");
    assert.ok(code.text.includes("head_dim"));
    assert.ok(!searchSegments.some((s) => s.kind === "body" && s.text.includes("head_dim")));
  });

  it("does not double-count nested blocks", async () => {
    const { searchSegments } = await compileArticle("- item one\n- item two\n", "Title");
    const texts = searchSegments.filter((s) => s.kind === "body").map((s) => s.text);
    assert.deepEqual(texts, ["item one", "item two"]);
  });
});

describe("rendering contract", () => {
  it("wraps tables in a scroll container so they cannot break page layout", async () => {
    const { html } = await compileArticle("| A | B |\n|---|---|\n| 1 | 2 |\n", "Title");
    assert.ok(html.includes('class="table-scroll"'));
    assert.match(html, /<div class="table-scroll"[^>]*>\s*<table>/);
  });

  it("frames code blocks with their language label", async () => {
    const { html } = await compileArticle("```python\nx = 1\n```\n", "Title");
    assert.ok(html.includes('data-lang="python"'));
    assert.ok(html.includes('data-layout="code"'));
    assert.ok(html.includes("code-block__lang"));
  });

  it("classifies box-drawing text as a diagram without changing its source", async () => {
    const source = "```text\nSOURCE\n  │\n  ▼\nTARGET\n```\n";
    const { html } = await compileArticle(source, "Title");

    assert.ok(html.includes('data-layout="diagram"'));
    assert.match(html, /SOURCE\n  │\n  ▼\nTARGET/);
  });

  it("keeps ordinary text blocks on standard code leading", async () => {
    const { html } = await compileArticle("```text\nrequest completed\n```\n", "Title");
    assert.ok(html.includes('data-layout="code"'));
  });

  it("hardens external links and leaves internal ones alone", async () => {
    const { html } = await compileArticle(
      "[out](https://example.com) and [in](/models/x)\n",
      "Title",
    );
    assert.match(html, /href="https:\/\/example\.com"[^>]*rel="noopener noreferrer"/);
    const internal = html.match(/<a[^>]*href="\/models\/x"[^>]*>/)?.[0] ?? "";
    assert.ok(!internal.includes("target"), "internal links must not open a new tab");
  });

  it("renders mathematics at build time with an accessible MathML branch", async () => {
    const { html } = await compileArticle("$$\nx^2\n$$\n", "Title");
    assert.ok(html.includes("katex"), "math must be rendered, not left as TeX");
    assert.ok(html.includes("<math"), "MathML is required for assistive technology");
  });

  it("surfaces reference definitions, which Markdown would otherwise hide", async () => {
    const { references } = await compileArticle(
      'See [1].\n\n[1]: https://example.com/paper "A Paper"\n',
      "Title",
    );
    assert.deepEqual(references, [
      { id: "1", url: "https://example.com/paper", title: "A Paper" },
    ]);
  });

  it("orders numeric references numerically, not lexically", async () => {
    const { references } = await compileArticle(
      "[1]: https://e.com/1\n[10]: https://e.com/10\n[2]: https://e.com/2\n",
      "Title",
    );
    assert.deepEqual(
      references.map((r) => r.id),
      ["1", "2", "10"],
    );
  });
});

/**
 * The renderer and the search-index extractor are two pipelines over the same
 * structural stages. If they ever disagree about a heading id, every search
 * result deep-link into that section silently stops working — so the agreement
 * is asserted rather than assumed.
 */
describe("index extraction matches the rendered document", () => {
  const SOURCE = `# Title

Lead paragraph before any heading.

## Alpha Section

Body text under alpha.

### Nested Beta

More body text here.

## Maths \\text{Heading}

$$
x^2
$$

Text after the equation.

\`\`\`json
{ "a": 1 }
\`\`\`

## Duplicate

first

## Duplicate

second
`;

  it("produces the same heading records as a full compile", async () => {
    const compiled = await compileArticle(SOURCE, "Title");
    const indexed = await extractArticleIndex(SOURCE, "Title");
    assert.deepEqual(indexed.headings, compiled.headings);
  });

  it("produces the same search segments as a full compile", async () => {
    const compiled = await compileArticle(SOURCE, "Title");
    const indexed = await extractArticleIndex(SOURCE, "Title");
    assert.deepEqual(indexed.searchSegments, compiled.searchSegments);
  });

  it("agrees on the word count", async () => {
    const compiled = await compileArticle(SOURCE, "Title");
    const indexed = await extractArticleIndex(SOURCE, "Title");
    assert.equal(indexed.wordCount, compiled.wordCount);
  });

  it("yields ids that exist in the rendered HTML", async () => {
    const compiled = await compileArticle(SOURCE, "Title");
    const indexed = await extractArticleIndex(SOURCE, "Title");
    for (const heading of indexed.headings) {
      assert.ok(
        compiled.html.includes(`id="${heading.id}"`),
        `search would deep-link to a missing anchor #${heading.id}`,
      );
    }
  });

  it("still disambiguates repeated heading text", async () => {
    const indexed = await extractArticleIndex(SOURCE, "Title");
    const ids = indexed.headings.map((h) => h.id);
    assert.equal(new Set(ids).size, ids.length, `duplicate ids: ${ids.join(", ")}`);
  });

  it("does not render HTML while extracting", async () => {
    // The whole point of the split: no KaTeX, no highlighter, no serialization.
    const indexed = await extractArticleIndex(SOURCE, "Title");
    assert.ok(!("html" in indexed));
    const mathsHeading = indexed.headings.find((h) => h.text.includes("Maths"));
    assert.ok(mathsHeading, "the TeX heading is still indexed");
    assert.ok(!mathsHeading.text.includes("\\text"), mathsHeading.text);
  });
});

describe("determinism and caching", () => {
  it("produces identical output for identical input", async () => {
    const source = "## A\n\n$x^2$\n\n```js\nconst a = 1;\n```\n";
    const first = await compileArticle(source, "T");
    const second = await compileArticle(source, "T");
    assert.equal(first.html, second.html);
    assert.deepEqual(first.headings, second.headings);
  });

  it("does not conflate documents that differ only by title", async () => {
    const source = "# Shared\n\nbody\n";
    const asTitle = await compileArticle(source, "Shared");
    const notTitle = await compileArticle(source, "Different");
    assert.ok(!asTitle.html.includes("Shared"), "matching title heading is dropped");
    assert.ok(notTitle.html.includes("Shared"), "non-matching heading is kept");
  });
});

describe("body images", () => {
  const resolve = (src: string) =>
    src === "./assets/overview.png"
      ? {
          src: "/content-assets/x/overview-1600.png",
          fallback: "/content-assets/x/overview-1600.png",
          width: 100,
          height: 50,
          avif: [],
          webp: [],
        }
      : null;

  it("reports the resolved source of every image the body renders", async () => {
    // The hero is picked from the same `assets/` folder the body draws on, so
    // the page needs to know what the body already shows or it publishes the
    // same figure twice — once stripped of its context.
    const { images } = await compileArticle("![](./assets/overview.png)\n", "T", resolve);
    assert.deepEqual(images, ["/content-assets/x/overview-1600.png"]);
  });

  it("reports nothing for a document with no resolvable images", async () => {
    const { images } = await compileArticle("just prose\n", "T", resolve);
    assert.deepEqual(images, []);
  });
});
