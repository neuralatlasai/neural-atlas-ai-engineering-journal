import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { articleVisuals } from "../lib/visuals/catalog";
import { HomeArtwork } from "../components/HomeArtwork";

describe("homepage mechanism covers", () => {
  it("renders source-curated, accessible vector covers without raster white backgrounds", () => {
    for (const section of ["blogs", "components", "engineering", "models", "research", "training"]) {
      const html = renderToStaticMarkup(React.createElement(HomeArtwork, { section }));
      assert.match(html, /class="home-cover"/);
      assert.match(html, /role="img"/);
      assert.match(html, new RegExp(`aria-labelledby="domain-${section}-cover-title"`));
      assert.match(html, /viewBox="0 0 720 360"/);
      assert.doesNotMatch(html, /<img|<script|undefined|NaN/);
    }
  });

  it("uses the exact article mechanism and distinct labels for repeated homepage figures", () => {
    const visual = articleVisuals[0];
    const html = renderToStaticMarkup(React.createElement(HomeArtwork, {
      section: "blogs", articleRoute: "/blogs/example", visual, variant: "featured",
    }));
    assert.ok(html.includes(visual.title));
    assert.match(html, new RegExp(`aria-labelledby="featured-${visual.id}-cover-title"`));
    assert.doesNotMatch(html, /domain-blogs-cover-title/);
  });
});
