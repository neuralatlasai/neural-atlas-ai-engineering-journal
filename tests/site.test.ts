import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  absoluteUrl,
  composePrimaryNav,
  internalHref,
  SEARCH_PATH,
  searchUrl,
  site,
  staticNav,
  withTrailingSlash,
} from "../lib/site";
import { articleJsonLd, breadcrumbJsonLd, websiteJsonLd } from "../lib/structured-data";
import type { ArticleMeta } from "../lib/content/corpus";

function article(overrides: Partial<ArticleMeta> = {}): ArticleMeta {
  return {
    documentId: "docs/models/example.md",
    sourcePath: "/abs/docs/models/example.md",
    route: "/models/example",
    routeSegments: ["models", "example"],
    folderSegments: ["models"],
    folderLabels: ["Models"],
    section: "models",
    sectionLabel: "Models",
    title: "Example Report",
    description: "A description.",
    articleType: "model-report",
    displayDate: null,
    topics: [],
    hero: null,
    wordCountEstimate: 1000,
    readingMinutes: 5,
    ...overrides,
  };
}

describe("site copy", () => {
  it("keeps the homepage description technical and within 35 words", () => {
    const words = site.longDescription.trim().split(/\s+/);

    assert.ok(words.length <= 35, `description contains ${words.length} words`);
    assert.match(site.longDescription, /model architectures/);
    assert.doesNotMatch(site.longDescription, /Markdown|TeX|compil/i);
  });
});

describe("withTrailingSlash", () => {
  it("matches what the static export actually serves", () => {
    assert.equal(withTrailingSlash("/models/example"), "/models/example/");
    assert.equal(withTrailingSlash("/models/example/"), "/models/example/");
    assert.equal(withTrailingSlash("/"), "/");
  });

  it("leaves real files alone", () => {
    assert.equal(withTrailingSlash("/feed.xml"), "/feed.xml");
    assert.equal(withTrailingSlash("/search-index.json"), "/search-index.json");
    assert.equal(withTrailingSlash("/robots.txt"), "/robots.txt");
  });
});

describe("composePrimaryNav", () => {
  it("keeps every header label and destination unique", () => {
    const items = composePrimaryNav([
      { href: "/models", label: "Models" },
      { href: "/research", label: "Research" },
      { href: "/models/", label: "Models" },
    ]);
    const hrefs = items.map((item) => item.href.replace(/\/+$/, "").toLowerCase());
    const labels = items.map((item) => item.label.trim().toLowerCase());

    assert.equal(new Set(hrefs).size, hrefs.length);
    assert.equal(new Set(labels).size, labels.length);
    assert.ok(labels.includes("research"));
    assert.ok(labels.includes("library"));
  });

  it("reserves fixed application labels against future corpus folders", () => {
    const items = composePrimaryNav([
      { href: "/topics-from-corpus", label: " Topics " },
      { href: "/about", label: "Project" },
      { href: "/training", label: "Training" },
    ]);

    assert.deepEqual(
      items.map(({ href, label }) => ({ href, label })),
      [
        { href: "/training", label: "Training" },
        ...staticNav.map(({ href, label }) => ({ href, label })),
      ],
    );
  });
});

describe("absoluteUrl", () => {
  it("builds an absolute URL without a doubled slash", () => {
    assert.equal(absoluteUrl("/about"), `${site.origin}/about/`);
    assert.equal(absoluteUrl("about"), `${site.origin}/about/`);
  });

  it("produces a parseable URL for every input", () => {
    for (const path of ["/", "/about", "/feed.xml", "/models/a-b"]) {
      assert.doesNotThrow(() => new URL(absoluteUrl(path)));
    }
  });

  it("uses an origin with no trailing slash", () => {
    assert.ok(!site.origin.endsWith("/"));
  });
});

describe("internalHref", () => {
  it("adds the trailing slash a static host needs", () => {
    assert.equal(internalHref("/models/glm-5-2"), "/models/glm-5-2/");
  });

  it("keeps a fragment after the slash, not before it", () => {
    // Search results deep-link to a heading; `/a/b#x/` would not resolve.
    assert.equal(internalHref("/models/glm-5-2#mla"), "/models/glm-5-2/#mla");
  });

  it("preserves a query string", () => {
    assert.equal(internalHref("/search?q=mla"), "/search/?q=mla");
  });

  it("preserves query and fragment together", () => {
    assert.equal(internalHref("/a/b?x=1#y"), "/a/b/?x=1#y");
  });

  it("leaves real files alone", () => {
    assert.equal(internalHref("/feed.xml"), "/feed.xml");
  });

  it("is idempotent", () => {
    const href = "/models/glm-5-2#mla";
    assert.equal(internalHref(internalHref(href)), internalHref(href));
  });
});

describe("searchUrl", () => {
  it("keeps the trailing slash a static host needs", () => {
    // Regression: `/search?q=x` has no matching file in the export — only
    // `/search/index.html` — so a CDN answers it with a 404.
    assert.equal(SEARCH_PATH, "/search/");
    assert.ok(searchUrl("attention").startsWith("/search/?"));
    assert.equal(searchUrl(), "/search/");
  });

  it("encodes the query", () => {
    assert.equal(searchUrl("kv cache & rope"), "/search/?q=kv%20cache%20%26%20rope");
  });

  it("treats a blank query as no query", () => {
    assert.equal(searchUrl("   "), "/search/");
    assert.equal(searchUrl(undefined), "/search/");
  });

  it("trims before encoding", () => {
    assert.equal(searchUrl("  mla  "), "/search/?q=mla");
  });
});

describe("structured data", () => {
  it("does not mark engineering material as scholarly (plan §23)", () => {
    const engineering = articleJsonLd(article({ articleType: "engineering-deep-dive" }));
    assert.equal(engineering["@type"], "TechArticle");
  });

  it("marks research material as scholarly", () => {
    const research = articleJsonLd(article({ articleType: "research-explainer" }));
    assert.equal(research["@type"], "ScholarlyArticle");
  });

  it("omits datePublished rather than inventing one", () => {
    const undated = articleJsonLd(article({ displayDate: null }));
    assert.ok(!("datePublished" in undated));

    const prose = articleJsonLd(article({ displayDate: "sometime in spring" }));
    assert.ok(!("datePublished" in prose), "unparseable prose dates must be dropped");
  });

  it("emits an ISO date when one can be parsed", () => {
    const dated = articleJsonLd(article({ displayDate: "June 16, 2026" }));
    assert.equal(dated.datePublished, "2026-06-16");
  });

  it("uses absolute URLs throughout", () => {
    const data = articleJsonLd(article());
    assert.equal(data.url, absoluteUrl("/models/example"));
  });

  it("numbers breadcrumb positions from one, in order", () => {
    const crumbs = breadcrumbJsonLd([
      { name: "Home", href: "/" },
      { name: "Models", href: "/models" },
    ]);
    const items = crumbs.itemListElement as { position: number; name: string }[];
    assert.deepEqual(
      items.map((i) => i.position),
      [1, 2],
    );
    assert.equal(items[1].name, "Models");
  });

  it("serializes to valid JSON with no undefined values", () => {
    for (const data of [articleJsonLd(article()), websiteJsonLd()]) {
      const round = JSON.parse(JSON.stringify(data)) as Record<string, unknown>;
      for (const [key, value] of Object.entries(round)) {
        assert.notEqual(value, undefined, `${key} serialized as undefined`);
      }
    }
  });
});
