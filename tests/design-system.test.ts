import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const css = fs.readFileSync(path.join("app", "globals.css"), "utf8");
const siteHeader = fs.readFileSync(
  path.join("components", "SiteHeader.tsx"),
  "utf8",
);
const atlasWorkflow = fs.readFileSync(
  path.join("components", "AtlasWorkflowFigure.tsx"),
  "utf8",
);
const articlePage = fs.readFileSync(
  path.join("app", "[...slug]", "page.tsx"),
  "utf8",
);
const rootLayout = fs.readFileSync(path.join("app", "layout.tsx"), "utf8");

/**
 * Class names KaTeX puts in the document. A bare selector on any of these in
 * our own stylesheet silently restyles rendered mathematics.
 *
 * This is not hypothetical: `.tag` was defined here for the article-type pill,
 * and KaTeX uses `.tag` for `\tag{A.1}` equation numbers. Every equation number
 * in the corpus rendered as a bordered, padded pill positioned on top of its
 * own equation — hundreds of them, on the article with the most maths.
 */
const KATEX_CLASS_NAMES = [
  "tag",
  "base",
  "strut",
  "mord",
  "mrel",
  "mbin",
  "mopen",
  "mclose",
  "mpunct",
  "minner",
  "vlist",
  "sizing",
  "fraction",
  "frac-line",
  "delimsizing",
  "accent",
  "col-align-c",
  "newline",
];

/** Selectors written at the top level of a rule, ignoring comments. */
function topLevelSelectors(source: string): string[] {
  return [
    ...source.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(^|\})([^{}@]+)\{/g),
  ]
    .map((m) => m[2].trim())
    .filter(Boolean)
    .flatMap((group) => group.split(",").map((s) => s.trim()));
}

describe("design-system class names do not collide with KaTeX", () => {
  const selectors = topLevelSelectors(css);

  for (const name of KATEX_CLASS_NAMES) {
    it(`does not style a bare .${name}`, () => {
      // A bare selector is one that targets the class with no ancestor scoping,
      // e.g. `.tag {` or `.tag:hover {` — those reach into rendered maths.
      const bare = new RegExp(
        `^\\.${name.replace(/[-]/g, "\\-")}(?:[:.[][^\\s>+~]*)?$`,
      );
      const offenders = selectors.filter((s) => bare.test(s));
      assert.deepEqual(
        offenders,
        [],
        `bare selector(s) ${offenders.join(", ")} will restyle KaTeX output; scope them or rename the class`,
      );
    });
  }

  it("still defines the pill the article metadata uses", () => {
    assert.ok(selectors.includes(".pill"), "the renamed pill class must exist");
  });

  it("scopes its equation-number styling under .article-body", () => {
    const equationTagRules = selectors.filter((s) => s.includes(".tag"));
    for (const selector of equationTagRules) {
      assert.ok(
        selector.startsWith(".article-body"),
        `equation-number rule must be scoped: ${selector}`,
      );
    }
  });
});

describe("wide tables", () => {
  const selectors = topLevelSelectors(css);

  /** The declaration block that follows a given selector. */
  function ruleFor(selector: string): string {
    const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
    const i = stripped.indexOf(selector + " {");
    if (i === -1) return "";
    return stripped.slice(i, stripped.indexOf("}", i));
  }

  it("caps the width maths contributes to a table cell", () => {
    // A table is sized `max-content`, so without a cap the single longest
    // equation — 400+ characters in this corpus, laid out on one unbreakable
    // line — sets the width of the entire table, and every short row trails a
    // wide band of empty surface that reads as a black panel in dark mode.
    for (const cell of [".article-body td .katex", ".article-body th .katex"]) {
      assert.ok(selectors.includes(cell), `${cell} must be width-capped`);
    }
    const rule = ruleFor(".article-body th .katex");
    assert.match(
      rule,
      /max-inline-size:/,
      "the cap is what bounds the table's max-content width",
    );
    assert.match(
      rule,
      /overflow-x:\s*auto/,
      "a capped equation must stay reachable by scrolling",
    );
    assert.ok(
      !/max-inline-size:\s*[0-9.]+%/.test(rule),
      "a percentage maximum is cyclic against an auto-width cell and is ignored during intrinsic sizing",
    );
  });

  it("keeps the table itself sized to its content", () => {
    // The cap belongs on the equation, not the table: tables with many columns
    // still need to out-size the reading column and scroll.
    assert.ok(
      selectors.includes(".article-body table"),
      "table rule must exist",
    );
    assert.match(ruleFor(".article-body table"), /inline-size:\s*max-content/);
  });

  it("keeps table typography identical to article prose on every viewport", () => {
    assert.match(
      ruleFor(".article-body table"),
      /font-family:\s*inherit/,
      "table copy must use the reader face rather than an optically larger UI face",
    );
    assert.match(
      ruleFor(".article-body table"),
      /font-size:\s*inherit/,
      "table copy must follow the reader scale instead of defining a smaller one",
    );
    assert.match(ruleFor(".article-body table"), /line-height:\s*inherit/);
    assert.doesNotMatch(
      css,
      /\.article-body table\s*\{[^}]*font-size:\s*0\.(?:8|86)rem/s,
      "desktop and mobile must not reintroduce independent table sizes",
    );
  });

  it("keeps reference-table rows compact", () => {
    assert.match(
      ruleFor(".article-body td"),
      /padding:\s*0\.375rem 0\.85rem/,
      "desktop rows must not carry card-like vertical padding",
    );
    assert.match(css, /padding:\s*0\.375rem 0\.65rem/);
    assert.doesNotMatch(css, /padding:\s*0\.(?:5|6)rem 0\.(?:7|95)rem/);
  });
});

describe("display mathematics rhythm", () => {
  function ruleFor(selector: string): string {
    const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
    const index = stripped.indexOf(`${selector} {`);
    if (index === -1) return "";
    return stripped.slice(index, stripped.indexOf("}", index));
  }

  it("uses compact tokens for equation padding and derivation gaps", () => {
    assert.match(css, /--math-space-block:\s*0\.5rem/);
    assert.match(css, /--math-space-run:\s*0\.125rem/);
    assert.match(css, /--math-padding-block:\s*0\.1875rem/);
    assert.match(
      ruleFor(".article-body .katex-display"),
      /padding-block:\s*var\(--math-padding-block\)/,
    );
    assert.match(
      ruleFor(".article-body .katex-display + .katex-display"),
      /margin-block-start:\s*var\(--math-space-run\)/,
    );
  });

  it("does not stack prose-rule margins against equation groups", () => {
    assert.match(css, /--math-space-rule:\s*1rem/);
    assert.match(
      ruleFor(".article-body hr:has(+ .katex-display)"),
      /margin-block-end:\s*var\(--math-space-rule\)/,
    );
    assert.match(
      ruleFor(".article-body .katex-display + hr"),
      /margin-block-start:\s*var\(--math-space-rule\)/,
    );
  });
});

describe("page composition", () => {
  const selectors = topLevelSelectors(css);

  function ruleFor(selector: string): string {
    const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
    const i = stripped.indexOf(selector + " {");
    if (i === -1) return "";
    return stripped.slice(i, stripped.indexOf("}", i));
  }

  /** Every declared value of a custom property, in source order. */
  function valuesOf(token: string): string[] {
    return [
      ...css
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .matchAll(new RegExp(`${token}:\\s*([^;]+);`, "g")),
    ].map((m) => m[1].trim());
  }

  it("keeps the secondary prose measure stable", () => {
    // The measure is a typography decision (~72ch), not a layout lever. Filling
    // a wide screen by stretching it would defeat the point. The assertion is
    // that exactly one value is declared — not which one — so the measure can
    // be retuned against the body size without rewriting the test.
    const measures = [
      ...new Set(valuesOf("--measure").filter((v) => v.endsWith("rem"))),
    ];
    assert.equal(
      measures.length,
      1,
      `--measure must not vary by viewport: ${measures.join(", ")}`,
    );
  });

  it("reserves equal scrollbar space on both sides", () => {
    assert.match(
      ruleFor("html"),
      /scrollbar-gutter:\s*stable both-edges/,
      "one-sided scrollbar space shifts every centered shell off-axis",
    );
  });

  it("uses one leading value per reading role", () => {
    // Leading was 1.7 on desktop and 1.62 on mobile, so the vertical rhythm
    // changed as the window resized. Body prose and leads each get exactly one
    // token, and no reading surface hard-codes its own number.
    for (const token of ["--leading-reader", "--leading-lead"]) {
      assert.equal(valuesOf(token).length, 1, `${token} must be declared once`);
    }
    const readingSurfaces = [
      ".article-body",
      ".prose-page",
      ".article-deck",
      ".article-row__desc",
      ".featured__desc",
    ];
    for (const selector of readingSurfaces) {
      assert.match(
        ruleFor(selector),
        /line-height:\s*var\(--leading-/,
        `${selector} must use a leading token`,
      );
    }
  });

  it("lets article copy fill the bounded responsive stage", () => {
    // Relying on the grid track alone let the column — and every paragraph in
    // it — shrink whenever the shell could not afford the full composition.
    assert.match(
      ruleFor(".article-body > *"),
      /inline-size:\s*100%/,
      "article children must use the available stage",
    );
    assert.match(
      ruleFor(".article-body > *"),
      /max-inline-size:\s*100%/,
      "article children must not exceed the available stage",
    );
    assert.doesNotMatch(
      ruleFor(".article-body > *"),
      /var\(--measure\)/,
      "article paragraphs must not use a second, narrower width",
    );
    assert.match(
      ruleFor(".prose-page"),
      /max-inline-size:\s*var\(--measure\)/,
      "standalone prose must retain the reading measure",
    );
  });

  it("grows the composition on wide screens", () => {
    // At a single 68rem shell, a 1920px display was 48% empty margin and the
    // page read as a narrow strip rather than a publication.
    const shells = valuesOf("--shell-max")
      .filter((v) => v.endsWith("rem"))
      .map((v) => Number.parseFloat(v));
    const desktop = shells.filter((v) => v > 42); // 42rem is the narrow-screen shell
    assert.ok(
      desktop.length >= 2,
      "the shell must have more than one desktop size",
    );
    assert.ok(
      Math.max(...desktop) >= 82,
      `widest shell is only ${Math.max(...desktop)}rem`,
    );
  });

  it("bounds the evidence stage and the outline gap", () => {
    const layoutRule = ruleFor(".article-layout");
    assert.match(layoutRule, /--article-stage:\s*42rem/);
    assert.match(layoutRule, /--article-gap:\s*clamp\(1\.25rem,\s*2vw,\s*2rem\)/);
    assert.doesNotMatch(
      layoutRule,
      /minmax\([^)]*,\s*1fr\)/,
      "a flexible middle track would recreate the unbounded empty gap",
    );
    assert.match(ruleFor(".article-rail"), /grid-column:\s*2/);
  });

  it("gives the complete article one consistent stage", () => {
    const figureRule = ruleFor(".article-body .content-figure");
    assert.match(figureRule, /inline-size:\s*100%/);
    assert.match(
      ruleFor(".article-body .table-scroll"),
      /inline-size:\s*100%/,
      "tables must fill the evidence stage",
    );
    assert.match(
      ruleFor(".article-body"),
      /max-inline-size:\s*100%/,
      "the body must expose the evidence stage",
    );
  });

  it("reserves the final article geometry before streamed content arrives", () => {
    const noRail = selectors.find((s) =>
      s.includes(".article-layout--without-outline"),
    );
    assert.ok(noRail, "the no-rail layout must be handled");
    assert.match(ruleFor(noRail), /column-gap:\s*0/);
    assert.match(
      ruleFor(noRail),
      /grid-template-columns:\s*minmax\(0,\s*min\(100%,\s*var\(--article-stage\)\)\)/,
    );
    assert.ok(
      !selectors.some((selector) => selector.includes(":has(.article-rail)")),
      "layout geometry must not depend on a trailing streamed descendant",
    );
    assert.match(articlePage, /article-layout article-layout--\$\{/);
    assert.match(articlePage, /showOutline\s*\?\s*"with-outline"\s*:\s*"without-outline"/);
  });
});

describe("code block presentation", () => {
  function ruleFor(selector: string): string {
    const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
    const i = stripped.indexOf(selector + " {");
    if (i === -1) return "";
    return stripped.slice(i, stripped.indexOf("}", i));
  }

  it("uses compact leading only for classified text diagrams", () => {
    const codeRule = ruleFor(".article-body figure.code-block pre");
    const diagramRule = ruleFor(
      '.article-body figure.code-block[data-layout="diagram"] pre',
    );

    assert.match(codeRule, /line-height:\s*1\.65/);
    assert.match(diagramRule, /line-height:\s*0\.9\s*;/);
  });

  it("gives diagrams the evidence stage and compacts only wide flows", () => {
    const diagramFrame = ruleFor(
      '.article-body figure.code-block[data-layout="diagram"]',
    );
    const diagramRule = ruleFor(
      '.article-body figure.code-block[data-layout="diagram"] pre',
    );
    const wideRule = ruleFor(
      '.article-body figure.code-block[data-density="wide"] pre',
    );

    assert.match(diagramFrame, /inline-size:\s*100%/);
    assert.match(diagramFrame, /container-type:\s*inline-size/);
    assert.match(diagramRule, /font-family:\s*var\(--font-diagram\)/);
    assert.match(diagramRule, /font-variant-ligatures:\s*none/);
    assert.match(diagramRule, /font-kerning:\s*none/);
    assert.match(diagramRule, /font-variant-numeric:\s*lining-nums tabular-nums/);
    assert.match(diagramRule, /font-size:\s*0\.82rem/);
    assert.match(wideRule, /font-size:\s*0\.74rem/);
    assert.match(
      ruleFor('.article-body figure.code-block[data-layout="diagram"] pre code'),
      /font-family:\s*inherit/,
      "the child code node must not restore the subset webfont",
    );
    assert.match(
      diagramRule,
      /background-attachment:\s*local,\s*local,\s*scroll,\s*scroll/,
    );
  });

  it("keeps code selectable while excluding the component chrome", () => {
    assert.doesNotMatch(
      ruleFor(".article-body pre code"),
      /user-select:\s*none/,
    );
    assert.match(ruleFor(".code-block__bar"), /user-select:\s*none/);
  });
});

describe("recursive library presentation", () => {
  function ruleFor(selector: string): string {
    const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
    const i = stripped.indexOf(selector + " {");
    if (i === -1) return "";
    return stripped.slice(i, stripped.indexOf("}", i));
  }

  it("uses an editorial row index rather than ornamental cards", () => {
    const row = ruleFor(".folder-card");
    const divider = ruleFor(".folder-grid > li");
    assert.match(divider, /border-top:/);
    assert.doesNotMatch(row, /box-shadow:/);
    assert.doesNotMatch(row, /border-radius:/);
    assert.doesNotMatch(row, /gradient\(/);
  });

  it("keeps every folder row comfortably larger than a touch target", () => {
    assert.match(ruleFor(".folder-card"), /min-height:\s*5rem/);
  });
});

describe("site identity", () => {
  it("uses a typographic wordmark without an invented logo glyph", () => {
    assert.doesNotMatch(siteHeader, /AtlasMark|wordmark__mark|<svg/);
    assert.match(siteHeader, />Neural Atlas</);
  });
});

describe("editorial typography", () => {
  function ruleFor(selector: string): string {
    const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
    const index = stripped.indexOf(`${selector} {`);
    if (index === -1) return "";
    return stripped.slice(index, stripped.indexOf("}", index));
  }

  it("self-hosts a newspaper display face and a publication UI face", () => {
    assert.match(rootLayout, /Libre_Franklin/);
    assert.match(rootLayout, /Newsreader/);
    assert.doesNotMatch(rootLayout, /\bInter\b|Source_Serif_4/);
    assert.match(css, /--font-display:\s*var\(--font-newsreader\)/);
    assert.match(css, /--font-reader:\s*var\(--font-newsreader\)/);
    assert.match(css, /--font-ui:\s*var\(--font-franklin\)/);
  });

  it("keeps editorial and interface roles distinct", () => {
    for (const selector of [
      ".wordmark",
      ".home-hero h1",
      ".article-title",
      ".article-row__title",
    ]) {
      assert.match(
        ruleFor(selector),
        /font-family:\s*var\(--font-display\)/,
        `${selector} must use the editorial display face`,
      );
    }
    assert.match(ruleFor(".article-body"), /font-family:\s*var\(--font-reader\)/);
    assert.match(ruleFor("body"), /font-family:\s*var\(--font-ui\)/);
  });

  it("uses one compact modular scale from h1 through h6", () => {
    const remValue = (token: string): number => {
      const match = css.match(new RegExp(`${token}:\\s*([0-9.]+)rem`));
      assert.ok(match, `missing ${token}`);
      return Number(match[1]);
    };
    const headingTokens = [
      "--text-h6",
      "--text-h5",
      "--text-h4",
      "--text-h3",
      "--text-h2",
      "--text-h1",
    ];
    const sizes = headingTokens.map(remValue);

    assert.equal(remValue("--text-body"), 0.9375, "reader copy must remain 15px");
    for (let index = 1; index < sizes.length; index += 1) {
      assert.ok(sizes[index] > sizes[index - 1], "heading sizes must increase monotonically");
      assert.ok(
        sizes[index] / sizes[index - 1] <= 1.17,
        "adjacent headings must stay within the compact 1.16 ratio",
      );
    }

    for (const level of [1, 2, 3, 4, 5, 6]) {
      const levelRules = [
        ...css.matchAll(
          new RegExp(`\\.article-body h${level}\\s*\\{([^}]*)\\}`, "g"),
        ),
      ].map((match) => match[1]);
      assert.ok(
        levelRules.some((rule) =>
          new RegExp(`font-size:\\s*var\\(--text-h${level}\\)`).test(rule),
        ),
        `article h${level} must use its scale token`,
      );
    }
    assert.match(ruleFor(".article-title"), /font-size:\s*var\(--text-title\)/);
    assert.match(ruleFor(".article-deck"), /font-size:\s*var\(--text-lg\)/);
  });
});

describe("homepage research figure", () => {
  it("uses deterministic vector geometry rather than a generated raster", () => {
    assert.match(atlasWorkflow, /<svg/);
    assert.match(atlasWorkflow, /<title/);
    assert.match(atlasWorkflow, /<desc/);
    assert.doesNotMatch(atlasWorkflow, /<img|\.png|\.webp|\.avif/);
  });

  it("states only the publication workflow documented by the site", () => {
    for (const label of [
      "Papers",
      "Technical reports",
      "Model cards",
      "Released code",
      "Architecture",
      "Attention & memory",
      "Training systems",
      "Inference",
      "Claim basis",
      "Units & config",
      "Provenance",
      "Uncertainty",
      "Mechanisms",
      "Constraints",
      "Open questions",
      "Source links",
    ]) {
      assert.ok(
        atlasWorkflow.includes(`"${label}"`),
        `missing figure label: ${label}`,
      );
    }
    assert.ok(atlasWorkflow.includes("Documented ≠ inferred ≠ unknown"));
  });
});

describe("article editorial hierarchy", () => {
  function ruleFor(selector: string): string {
    const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
    const index = stripped.indexOf(`${selector} {`);
    if (index === -1) return "";
    return stripped.slice(index, stripped.indexOf("}", index));
  }

  it("uses a semantic article header with a restrained category kicker", () => {
    assert.match(articlePage, /<header className="article-header">/);
    assert.match(articlePage, /<p className="article-kicker">/);
  });

  it("presents topics as editorial links instead of metadata badges", () => {
    assert.match(articlePage, /className="article-meta__topic"/);
    assert.doesNotMatch(articlePage, /className="pill pill--link"/);
  });

  it("centres the editorial opening before entering the split reading layout", () => {
    const headerIndex = articlePage.indexOf(
      '<header className="article-header">',
    );
    const heroIndex = articlePage.indexOf('className="article-hero"');
    const layoutIndex = articlePage.indexOf("article-layout article-layout--");
    assert.ok(headerIndex >= 0 && headerIndex < layoutIndex);
    assert.ok(heroIndex >= 0 && heroIndex < layoutIndex);

    const headerRule = ruleFor(".article-header");
    assert.match(headerRule, /inline-size:\s*min\(100%,\s*62rem\)/);
    assert.match(headerRule, /margin:\s*0 auto/);
  });

  it("starts the first body block flush with the outline", () => {
    assert.match(
      ruleFor(".article-body > :first-child"),
      /margin-block-start:\s*0/,
    );
  });
});
