import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { articleVisuals, getArticleVisual } from "../lib/visuals/catalog";
import { getAllArticles, getSections } from "../lib/content/corpus";
import { pickFeatured, selectAcrossSections } from "../lib/home-selection";
import { getHomeCover, homeArticleCovers, homeDomainCovers } from "../lib/visuals/home-covers";
import { coverPalettes } from "../components/visuals/CoverArtwork";
import { HomeArtwork } from "../components/HomeArtwork";

describe("homepage mechanism covers", () => {
  it("renders source-curated, accessible vector covers without raster white backgrounds", () => {
    for (const section of ["blogs", "components", "engineering", "models", "research", "training"]) {
      const html = renderToStaticMarkup(React.createElement(HomeArtwork, { section }));
      assert.match(html, /class="home-cover"/);
      assert.match(html, /role="img"/);
      assert.match(html, new RegExp(`aria-labelledby="domain-${section}-cover-title"`));
      assert.match(html, /viewBox="0 0 720 450"/);
      assert.doesNotMatch(html, /<img|<script|undefined|NaN/);
    }
  });

  it("uses the exact article mechanism and distinct labels for repeated homepage figures", () => {
    const visual = articleVisuals[0];
    const cover = getHomeCover("blogs", visual.id);
    assert.ok(cover);
    const html = renderToStaticMarkup(React.createElement(HomeArtwork, {
      section: "blogs", articleRoute: "/blogs/example", visual, variant: "featured",
    }));
    assert.ok(html.includes(cover.title));
    assert.match(html, new RegExp(`aria-labelledby="featured-${cover.id}-cover-title"`));
    assert.doesNotMatch(html, /domain-blogs-cover-title/);
  });

  it("gives every actual homepage card a distinct curated composition", () => {
    const articles = getAllArticles();
    const featured = pickFeatured(articles);
    assert.ok(featured);
    const covers = getSections().map(({ section }) => getHomeCover(section));
    for (const article of [featured, ...selectAcrossSections(articles, featured.route, 6)]) {
      const visual = getArticleVisual(article.sourcePath);
      assert.ok(visual, article.sourcePath);
      covers.push(getHomeCover(article.section, visual.id));
    }
    const identities = new Set<string>();
    const compositions = new Set<string>();
    for (const cover of covers) {
      assert.ok(cover, "A newly selected homepage article needs its own cover");
      assert.ok(!identities.has(cover.id), `Repeated cover: ${cover.id}`);
      identities.add(cover.id);
      // Ignore color, symbols, and prose: recoloring one layout is still repetition.
      const composition = JSON.stringify({
        nodes: cover.nodes.map(({ symbol: _symbol, ...geometry }) => geometry),
        connections: cover.connections,
      });
      assert.ok(!compositions.has(composition), `Reused composition: ${cover.id}`);
      compositions.add(composition);
    }
    assert.equal(identities.size, 13);
  });

  it("keeps frames within the canvas and the backgrounds pale with legible symbols", () => {
    const luminance = (hex: string) => {
      const channels = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255)
        .map((value) => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
      return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
    };
    for (const cover of [...Object.values(homeDomainCovers), ...homeArticleCovers.values()]) {
      for (const { x, y, width = 96, height = width } of cover.nodes) {
        assert.ok(x - width / 2 >= 0 && x + width / 2 <= 720, cover.id);
        assert.ok(y - height / 2 >= 0 && y + height / 2 <= 450, cover.id);
      }
      const palette = coverPalettes[cover.palette];
      assert.ok(luminance(palette.paper) > .88, `${cover.id}: background too dark`);
      assert.ok((luminance(palette.wash) + .05) / (luminance(palette.ink) + .05) >= 3,
        `${cover.id}: graphical symbol contrast below 3:1`);
    }
  });

  it("does not reuse a domain illustration for an uncurated article", () => {
    assert.equal(getHomeCover("constructor"), undefined);
    assert.equal(getHomeCover("__proto__"), undefined);
    const visual = articleVisuals.find(({ id }) => id === "inference-locality");
    assert.ok(visual);
    assert.equal(getHomeCover("blogs", visual.id), undefined);
    const html = renderToStaticMarkup(React.createElement(HomeArtwork, {
      section: "blogs", articleRoute: "/blogs/inference-first-accelerator-architecture", visual,
    }));
    assert.doesNotMatch(html, /data-cover-id|class="home-cover"/);
  });
});
