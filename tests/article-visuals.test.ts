import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getAllArticles } from "../lib/content/corpus";
import { articleVisuals, getArticleVisual } from "../lib/visuals/catalog";
import { DiagramArtwork } from "../components/visuals/DiagramArtwork";

describe("article graphical abstracts", () => {
  it("maps every published article to a distinct figure and an existing source", () => {
    const articles = getAllArticles();
    const ids = new Set<string>();
    const sources = new Set<string>();
    for (const visual of articleVisuals) {
      assert.match(visual.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      assert.ok(!ids.has(visual.id), `Duplicate figure: ${visual.id}`);
      assert.ok(!sources.has(visual.source), `Duplicate source: ${visual.source}`);
      ids.add(visual.id);
      sources.add(visual.source);
      assert.ok(fs.existsSync(visual.source), `Missing source: ${visual.source}`);
      assert.ok(fs.readFileSync(visual.source, "utf8").trim(), "Empty documents are not articles");
      assert.equal(visual.nodes.length, visual.layout === "fork" ? 5 : 4);
    }
    for (const article of articles) assert.ok(getArticleVisual(article.sourcePath), `Missing visual: ${article.sourcePath}`);
    assert.equal(articleVisuals.length, articles.length, "Remove orphaned visual mappings");
  });

  it("does not invent a generic image for an unknown or empty source", () => {
    assert.equal(getArticleVisual("docs/Models/README.md"), undefined);
    assert.equal(getArticleVisual("docs/Blogs/nonexistent.md"), undefined);
    assert.equal(getArticleVisual(path.resolve(articleVisuals[0].source))?.id, articleVisuals[0].id);
    assert.equal(getArticleVisual(articleVisuals[0].source.replaceAll("/", "\\"))?.id, articleVisuals[0].id);
  });

  it("exports complete accessible images identical to the current renderer", () => {
    for (const visual of articleVisuals) {
      const svg = renderToStaticMarkup(React.createElement(DiagramArtwork, { visual, standalone: true }));
      assert.match(svg, /role="img"/);
      assert.ok(svg.includes(`<title id="${visual.id}-title">`));
      assert.ok(svg.includes(`<desc id="${visual.id}-desc">`));
      assert.match(svg, /viewBox="0 0 960 500"/);
      assert.doesNotMatch(svg, /<script|<foreignObject|<image\b|NaN|undefined/);
      for (const node of visual.nodes) {
        assert.ok(node.explanation.length > 40, `${visual.id}: missing explanation`);
        assert.ok(node.label.length <= 22, `${visual.id}: label exceeds diagram measure`);
      }
      const exported = fs.readFileSync(`public/figures/${visual.id}.svg`, "utf8");
      assert.equal(exported, `<?xml version="1.0" encoding="UTF-8"?>\n${svg}\n`, `Regenerate ${visual.id}`);
    }
  });
});
