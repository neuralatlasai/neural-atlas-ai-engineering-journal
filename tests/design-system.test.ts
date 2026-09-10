import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const css = fs.readFileSync(path.join("app", "globals.css"), "utf8");
const siteHeader = fs.readFileSync(
  path.join("components", "SiteHeader.tsx"),
  "utf8",
);
const siteNav = fs.readFileSync(
  path.join("components", "SiteNav.tsx"),
  "utf8",
);
const siteFooter = fs.readFileSync(
  path.join("components", "SiteFooter.tsx"),
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
const articleEnhancements = fs.readFileSync(
  path.join("components", "ArticleEnhancements.tsx"),
  "utf8",
);
const homePage = fs.readFileSync(path.join("app", "page.tsx"), "utf8");
const homeArtwork = fs.readFileSync(
  path.join("components", "HomeArtwork.tsx"),
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
    assert.match(css, /--math-padding-block:\s*0\.5rem/);
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

  it("right-aligns long provenance tags in flow without their equation-height strut", () => {
    const provenanceSelector =
      ".article-body\n  .katex-display\n  > .katex\n  > .katex-html\n  > .tag.equation-provenance";
    const provenanceRule = ruleFor(provenanceSelector);

    assert.match(provenanceRule, /position:\s*static/);
    assert.match(provenanceRule, /display:\s*flex/);
    assert.match(provenanceRule, /justify-content:\s*flex-end/);
    assert.match(provenanceRule, /padding-inline-end:\s*0\.25rem/);
    assert.match(provenanceRule, /font-size:\s*var\(--text-2xs\)/);
    assert.match(
      ruleFor(".article-body .katex-display > .katex > .katex-html > .tag"),
      /font-size:\s*var\(--text-sm\)/,
    );
    assert.match(
      css,
      /> \.tag\.equation-provenance\s*> \.strut\s*\{\s*display:\s*none/s,
    );
  });

  it("contains intrinsically wide inline mathematics inside prose", () => {
    const inlineMath = ruleFor('.article-body :is(p, li) > .katex');
    assert.match(inlineMath, /display:\s*inline-block/);
    assert.match(inlineMath, /max-inline-size:\s*100%/);
    assert.match(inlineMath, /overflow-x:\s*auto/);
    assert.match(inlineMath, /scrollbar-width:\s*none/);
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

  it("keeps standalone source links attached to centred evidence", () => {
    const citationRule = ruleFor(".article-body p.source-citation");
    assert.match(citationRule, /text-align:\s*center/);
    assert.match(citationRule, /font-family:\s*var\(--font-ui\)/);
    assert.match(citationRule, /font-size:\s*var\(--text-sm\)/);
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
    assert.match(articlePage, /showRailOutline\s*\?\s*"with-outline"\s*:\s*"without-outline"/);
    assert.match(articlePage, /const showRailOutline = showOutline && !isEditorialBlog/);
    assert.match(articlePage, /\{showRailOutline && \(/);
  });
});

describe("homepage composition", () => {
  it("keeps the editorial introduction full-bleed and its content bounded", () => {
    assert.match(homePage, /<div className="home-page">/);
    assert.match(homePage, /<section className="home-hero"/);
    assert.match(homePage, /<div className="shell home-hero__inner">/);
    assert.doesNotMatch(
      homePage,
      /Field coordinates|long-form analyses|system domains|claim states/,
      "the hero must not expose generic corpus-summary language",
    );
    assert.match(homePage, /className="home-domain-grid"/);
    assert.match(homePage, /className="home-feature-card"/);
  });

  it("bounds and diversifies selected analysis in one corpus pass", () => {
    assert.match(
      homePage,
      /function selectAcrossSections\([\s\S]*?new Set<string>\(\)[\s\S]*?for \(const article of articles\)[\s\S]*?\.slice\(0, limit\)/,
      "selection must remain linear in corpus size",
    );
    assert.match(
      homePage,
      /selectAcrossSections\(articles, featured\?\.route, 6\)/,
      "the homepage must not grow linearly with an unbounded article corpus",
    );
  });

  it("keeps stable discovery routes visible while the complete index stays in the sheet", () => {
    assert.match(siteHeader, /primaryItems=\{staticNav\}/);
    assert.match(siteNav, /primaryItems = items/);
    assert.match(siteNav, /primaryItems\.map/);
    assert.match(siteNav, /items\.map/);
    assert.doesNotMatch(
      css,
      /body:has\(\.home-page\) \.primary-nav\s*\{\s*display:\s*none/,
      "the homepage must not hide direct routes on a wide viewport",
    );
    assert.match(
      css,
      /@media \(max-width: 76rem\)[\s\S]*?\.primary-nav\s*\{[\s\S]*?display:\s*none[\s\S]*?\.nav-trigger\s*\{[\s\S]*?display:\s*inline-flex/,
    );
    assert.match(
      css,
      /@media \(max-width: 76rem\)[\s\S]*?\.header-actions\s*\{[\s\S]*?order:\s*3[\s\S]*?\.nav-trigger\s*\{[\s\S]*?order:\s*4/,
      "the constrained header must keep search and theme controls before the terminal menu trigger",
    );
  });

  it("uses real optimized artwork rather than CSS stand-ins", () => {
    for (const section of [
      "blogs",
      "components",
      "engineering",
      "models",
      "research",
      "training",
    ]) {
      assert.ok(
        fs.existsSync(path.join("public", "images", "home", `${section}.avif`)),
        `missing AVIF artwork for ${section}`,
      );
      assert.ok(
        fs.existsSync(path.join("public", "images", "home", `${section}.webp`)),
        `missing WebP artwork for ${section}`,
      );
    }
    for (const artwork of [
      "featured-agentic-cyber-defense",
      "article-ai-capabilities",
    ]) {
      assert.ok(
        fs.existsSync(path.join("public", "images", "home", `${artwork}.avif`)),
        `missing AVIF artwork for ${artwork}`,
      );
      assert.ok(
        fs.existsSync(path.join("public", "images", "home", `${artwork}.webp`)),
        `missing WebP artwork for ${artwork}`,
      );
    }
    assert.match(homeArtwork, /<picture>/);
    assert.match(homeArtwork, /width=\{1440\}/);
    assert.match(homeArtwork, /height=\{480\}/);
    assert.match(homeArtwork, /withBasePath/);
    assert.match(homeArtwork, /variant === "featured"/);
    assert.match(homeArtwork, /ARTICLE_ARTWORK\[articleRoute\]/);
    assert.match(homeArtwork, /if \(hero\)/);
    assert.match(homePage, /articleRoute=\{article\.route\}/);
    assert.match(homePage, /hero=\{article\.hero\}/);
    assert.match(homePage, /variant="featured"/);
  });

  it("lets header-owned fixed dialogs cover the viewport", () => {
    assert.match(
      css,
      /\.site-header:has\(\.overlay\)\s*\{[\s\S]*?backdrop-filter:\s*none/,
      "a filtered header becomes the containing block for fixed dialogs",
    );
  });

  it("moves the card system from three columns to two and then one", () => {
    assert.match(
      css,
      /\.home-domain-grid,[\s\S]*?\.home-analysis-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/,
    );
    assert.match(
      css,
      /@media \(max-width: 68rem\)[\s\S]*?\.home-domain-grid,[\s\S]*?\.home-analysis-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/,
    );
    assert.match(
      css,
      /@media \(max-width: 48rem\)[\s\S]*?\.home-domain-grid,[\s\S]*?\.home-analysis-grid\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/,
    );
    assert.match(css, /\.home-feature-card\s*\{[\s\S]*?overflow:\s*hidden/);
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

  it("keeps implementation details out of the public footer", () => {
    assert.doesNotMatch(
      siteFooter,
      /static-first|source Markdown|public material|evidence basis/i,
    );
  });
});

describe("editorial typography", () => {
  function ruleFor(selector: string): string {
    const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
    const index = stripped.indexOf(`${selector} {`);
    if (index === -1) return "";
    return stripped.slice(index, stripped.indexOf("}", index));
  }

  it("self-hosts an optical editorial face and a neutral technical UI face", () => {
    assert.match(rootLayout, /\bInter\b/);
    assert.match(rootLayout, /Newsreader/);
    assert.doesNotMatch(rootLayout, /Libre_Franklin|Source_Serif_4/);
    assert.match(css, /--font-display:\s*var\(--font-newsreader\)/);
    assert.match(css, /--font-reader:\s*var\(--font-newsreader\)/);
    assert.match(css, /--font-ui:\s*var\(--font-inter\)/);
  });

  it("applies publication-grade OpenType features to every article", () => {
    assert.match(ruleFor(".article-title"), /font-kerning:\s*normal/);
    assert.match(ruleFor(".article-title"), /font-feature-settings:\s*"kern" 1, "liga" 1, "clig" 1/);
    assert.match(ruleFor(".article-body"), /font-variant-numeric:\s*lining-nums proportional-nums/);
    assert.match(ruleFor(".article-body"), /text-rendering:\s*optimizeLegibility/);
  });

  it("keeps editorial and interface roles distinct", () => {
    for (const selector of [
      ".wordmark",
      ".home-intro h1",
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

    assert.equal(remValue("--text-body"), 1, "reader copy must remain 16px");
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

describe("standalone research figure", () => {
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

  it("keeps generic corpus-summary language out of the visual", () => {
    assert.doesNotMatch(atlasWorkflow, /CORPUS \/ PROVENANCE MAP/);
    assert.match(atlasWorkflow, />\s*PROVENANCE MAP\s*</);
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

describe("article material polish", () => {
  function ruleFor(selector: string): string {
    const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
    const index = stripped.indexOf(`${selector} {`);
    if (index === -1) return "";
    return stripped.slice(index, stripped.indexOf("}", index));
  }

  it("derives the article atmosphere from semantic theme tokens", () => {
    assert.match(css, /--article-glow-primary:\s*color-mix\(/);
    assert.match(css, /--article-material:\s*color-mix\(/);
    assert.match(
      css,
      /main:has\(\.article-page\)\s*\{[\s\S]*?radial-gradient[\s\S]*?linear-gradient/,
    );
  });

  it("uses one shared material language for technical evidence", () => {
    for (const selector of [
      ".article-body figure.code-block",
      ".outline--inline",
      ".prev-next__link",
    ]) {
      const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      assert.match(
        css,
        new RegExp(`${escaped}\\s*\\{[\\s\\S]*?background:\\s*linear-gradient`),
        `${selector} must use the shared gradient material`,
      );
    }
  });

  it("keeps display mathematics cardless with a local scrollbar", () => {
    const equationRule = ruleFor(".article-body .katex-display");
    assert.match(equationRule, /overflow-x:\s*auto/);
    assert.doesNotMatch(equationRule, /(?:background|border|box-shadow):/);
    assert.match(
      css,
      /\.article-body \.katex-display::\-webkit-scrollbar-thumb\s*\{[\s\S]*?border-radius:\s*999px/,
    );
  });

  it("compacts renderer-classified label and arrow flows without shrinking derivations", () => {
    const flowRule = ruleFor(".article-body .katex-display.math-flow");
    assert.match(flowRule, /margin-block:\s*0\.0625rem/);
    assert.match(flowRule, /padding-block:\s*0\.125rem/);
    assert.match(
      ruleFor(".article-body .katex-display.math-flow--arrow > .katex"),
      /font-size:\s*0\.88em/,
    );
  });

  it("keeps decorative atmosphere out of print and forced colours", () => {
    assert.match(
      css,
      /@media \(forced-colors: active\)[\s\S]*?main:has\(\.article-page\)[\s\S]*?background:\s*Canvas/,
    );
    assert.match(
      css,
      /@media print[\s\S]*?main:has\(\.article-page\)[\s\S]*?background:\s*none/,
    );
  });

  it("does not constrain fixed dialogs to the filtered article header", () => {
    assert.match(
      css,
      /body:has\(\.article-page\) \.site-header:not\(:has\(\.overlay\)\)/,
    );
    assert.doesNotMatch(
      css,
      /body:has\(\.article-page\) \.site-header\s*\{[\s\S]*?backdrop-filter/,
    );
  });

  it("dismisses the compact sheet when inline navigation returns", () => {
    assert.match(siteNav, /matchMedia\("\(min-width: 76\.01rem\)"\)/);
    assert.match(siteNav, /if \(event\.matches\) setOpen\(false\)/);
    assert.match(siteNav, /addEventListener\("change"/);
    assert.match(siteNav, /removeEventListener\("change"/);
  });
});

describe("editorial blog specialization", () => {
  it("derives the visual modifier from the Blogs corpus section", () => {
    assert.match(articlePage, /const isEditorialBlog = article\.section === "blogs"/);
    assert.match(articlePage, /article-page--anthropic/);
    assert.match(articlePage, /article-shell--anthropic/);
    assert.match(articlePage, /article\.hero\?\.src \?\? articleAtmosphere\.src/);
  });

  it("keeps the immersive masthead scoped away from non-blog articles", () => {
    assert.match(
      css,
      /\.article-page--anthropic \.article-header\s*\{[\s\S]*?background-image:\s*var\(--article-atmosphere-image\)/,
    );
    assert.doesNotMatch(
      css,
      /(?<!\.article-page--anthropic )\.article-header\s*\{[^}]*--article-atmosphere-image/,
    );
  });

  it("uses one bounded masthead index instead of a duplicate blog rail", () => {
    assert.match(articlePage, /function ArticleHeroContents/);
    assert.match(articlePage, /heading\.depth === 2/);
    assert.match(articlePage, /\.slice\(0, 5\)/);
    assert.match(articlePage, /aria-label="Article contents"/);
    assert.match(articlePage, /const showRailOutline = showOutline && !isEditorialBlog/);
    assert.doesNotMatch(css, /\.article-page--anthropic \.outline li a::before/);
  });
});

describe("Mermaid progressive diagrams", () => {
  it("loads Mermaid only when a compiled diagram exists and uses strict mode", () => {
    assert.match(articleEnhancements, /figure\.mermaid-diagram/);
    assert.match(articleEnhancements, /import\("mermaid"\)/);
    assert.match(articleEnhancements, /layout:\s*"dagre"/);
    assert.match(articleEnhancements, /securityLevel:\s*"strict"/);
    assert.match(articleEnhancements, /await document\.fonts\?\.ready/);
    assert.match(articleEnhancements, /suppressErrorRendering:\s*true/);
  });

  it("preserves source as the failure and no-JavaScript fallback", () => {
    assert.match(articleEnhancements, /source\.hidden = true/);
    assert.match(articleEnhancements, /source\.hidden = false/);
    assert.match(
      articleEnhancements,
      /catch\s*(?:\([^)]*\))?\s*\{[\s\S]*?mermaidState = "source"/,
    );
  });

  it("contains wide diagrams without exposing source controls", () => {
    assert.match(
      css,
      /\.article-body \.mermaid-diagram__canvas\s*\{[\s\S]*?overflow-x:\s*auto/,
    );
    assert.match(articleEnhancements, /classList\.contains\("mermaid-diagram"\)/);
    assert.doesNotMatch(articleEnhancements, /mermaid-source-toggle/);
    assert.match(css, /data-mermaid-state="pending"/);
    assert.match(css, /data-mermaid-direction="horizontal"/);
  });
});
