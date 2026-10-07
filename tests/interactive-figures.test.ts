import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { compileArticle } from "../lib/content/compile";
import { interactiveFigureUrl } from "../lib/content/interactive-figures";
import { figureTheme } from "../lib/interactive-figures";

describe("progressive interactive figures", () => {
  it("keeps authored content readable and isolates the interactive document", async () => {
    const { html } = await compileArticle(`<figure data-interactive-src="/interactive/example/flow.html">

![A request passes through two stages.](https://example.com/flow.webp)

</figure>`);
    assert.match(html, /data-src="\/interactive\/example\/flow\.html"/);
    assert.match(html, /sandbox="allow-scripts"/);
    assert.doesNotMatch(html, /allow-same-origin|<script/);
    assert.match(html, /<iframe[^>]*hidden/);
    assert.match(html, /interactive-figure__fallback/);
    assert.match(html, /alt="A request passes through two stages\."/);
    assert.match(html, /title="A request passes through two stages\."/);
    assert.match(html, /href="\/interactive\/example\/flow\.html"[^>]*target="_blank"[^>]*rel="noopener"/);
  });

  it("does not turn remote, escaped, or malformed paths into executable embeds", () => {
    for (const value of [
      "https://example.com/flow.html", "//example.com/flow.html", "//evil/flow.html", "/a/../flow.html",
      "/a/%2e%2e/flow.html", "/a\\flow.html", "/flow.html?x=1", "/flow.svg", "",
    ]) assert.equal(interactiveFigureUrl(value), undefined, value);
    assert.equal(interactiveFigureUrl("/interactive/flow.html"), "/interactive/flow.html");
  });

  it("preserves ordinary figures and captions", async () => {
    const { html } = await compileArticle('<figure><figcaption>Authored caption</figcaption></figure>');
    assert.doesNotMatch(html, /iframe|interactive-figure/);
    assert.match(html, /Authored caption/);
  });

  it("follows the system theme unless the reader selected a specific palette", () => {
    assert.equal(figureTheme(undefined, true), "dark");
    assert.equal(figureTheme("system", true), "dark");
    assert.equal(figureTheme("system", false), "light");
    assert.equal(figureTheme("light", true), "light");
    assert.equal(figureTheme("dark", false), "dark");
  });
});
