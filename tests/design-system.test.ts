import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const css = fs.readFileSync(path.join("app", "globals.css"), "utf8");

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
  return [...source.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(^|\})([^{}@]+)\{/g)]
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
      const bare = new RegExp(`^\\.${name.replace(/[-]/g, "\\-")}(?:[:.[][^\\s>+~]*)?$`);
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
    assert.match(rule, /max-inline-size:/, "the cap is what bounds the table's max-content width");
    assert.match(rule, /overflow-x:\s*auto/, "a capped equation must stay reachable by scrolling");
    assert.ok(
      !/max-inline-size:\s*[0-9.]+%/.test(rule),
      "a percentage maximum is cyclic against an auto-width cell and is ignored during intrinsic sizing",
    );
  });

  it("keeps the table itself sized to its content", () => {
    // The cap belongs on the equation, not the table: tables with many columns
    // still need to out-size the reading column and scroll.
    assert.ok(selectors.includes(".article-body table"), "table rule must exist");
    assert.match(ruleFor(".article-body table"), /inline-size:\s*max-content/);
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
    return [...css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(new RegExp(`${token}:\\s*([^;]+);`, "g"))].map(
      (m) => m[1].trim(),
    );
  }

  it("keeps the reading measure fixed", () => {
    // The measure is a typography decision (~71ch), not a layout lever. Filling
    // a wide screen by stretching it would defeat the point.
    const measures = valuesOf("--measure").filter((v) => v.endsWith("rem"));
    assert.deepEqual([...new Set(measures)], ["38rem"], "--measure must not vary by viewport");
  });

  it("grows the composition on wide screens", () => {
    // At a single 68rem shell, a 1920px display was 48% empty margin and the
    // page read as a narrow strip rather than a publication.
    const shells = valuesOf("--shell-max")
      .filter((v) => v.endsWith("rem"))
      .map((v) => Number.parseFloat(v));
    const desktop = shells.filter((v) => v > 44); // 44rem is the narrow-screen shell
    assert.ok(desktop.length >= 2, "the shell must have more than one desktop size");
    assert.ok(Math.max(...desktop) >= 82, `widest shell is only ${Math.max(...desktop)}rem`);
  });

  it("starts wide content flush with the column and reaches only into the gap", () => {
    // `--wide-extra` is how far a table may reach toward the outline rail. It
    // must default to 0, or a layout with no rail would push content past the
    // shell edge.
    assert.equal(valuesOf("--wide-extra")[0], "0px", "the default must be 0");
    const rule = ruleFor(".article-body .table-scroll");
    assert.match(rule, /var\(--wide-extra/, "tables must use the gap");
    assert.match(rule, /max-inline-size:\s*calc\(100vw/, "and stay inside the viewport");
  });

  it("cancels the reach where there is no rail to reach toward", () => {
    const noRail = selectors.find((s) => s.includes(":not(:has(.article-rail))"));
    assert.ok(noRail, "the no-rail layout must be handled");
    assert.match(ruleFor(noRail), /--wide-extra:\s*0px/);
  });
});
