import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatArticleType,
  getAllArticles,
  getPrevNext,
  getRelatedArticles,
  getSections,
  getTopics,
  topicSlug,
  type ArticleMeta,
} from "../lib/content/corpus";
import { estimateReadingMinutes } from "../lib/content/reading";

/**
 * These run against the real corpus under `docs/`, so they assert invariants
 * that must hold for *any* corpus rather than hard-coded article titles.
 */
const articles = getAllArticles();

describe("corpus discovery", () => {
  it("discovers at least one article", () => {
    assert.ok(articles.length > 0, "no Markdown was discovered under the content roots");
  });

  it("assigns every article a unique route", () => {
    const routes = articles.map((a) => a.route);
    assert.equal(new Set(routes).size, routes.length, "route collision in the corpus");
  });

  it("assigns every article a unique document id", () => {
    const ids = articles.map((a) => a.documentId);
    assert.equal(new Set(ids).size, ids.length);
  });

  it("builds routes that match their segments", () => {
    for (const article of articles) {
      assert.equal(article.route, `/${article.routeSegments.join("/")}`);
    }
  });

  it("emits URL-safe route segments", () => {
    for (const article of articles) {
      for (const segment of article.routeSegments) {
        assert.match(segment, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `unsafe segment: ${segment}`);
      }
    }
  });

  it("never leaks TeX markup into a description", () => {
    // Descriptions are rendered as plain text everywhere they appear, so any
    // surviving TeX is shown to the reader raw.
    for (const article of articles) {
      for (const marker of ["\\", "{", "}", "$"]) {
        assert.ok(
          !article.description.includes(marker),
          `${article.documentId} description contains "${marker}": ${article.description.slice(0, 120)}`,
        );
      }
    }
  });

  it("gives every article a non-empty title", () => {
    for (const article of articles) {
      assert.ok(article.title.trim().length > 0, `${article.documentId} has no title`);
    }
  });

  it("returns a stable order across calls (plan §3.2 determinism)", () => {
    const first = getAllArticles().map((a) => a.documentId);
    const second = getAllArticles().map((a) => a.documentId);
    assert.deepEqual(first, second);
  });

  it("skips empty source files rather than publishing blank routes", () => {
    for (const article of articles) {
      assert.ok(article.wordCountEstimate > 0, `${article.documentId} is empty`);
    }
  });
});

describe("reading time", () => {
  it("derives minutes from the article's own word count", () => {
    for (const article of articles) {
      assert.equal(article.readingMinutes, estimateReadingMinutes(article.wordCountEstimate));
    }
  });

  it("is at least one minute for every article", () => {
    for (const article of articles) {
      assert.ok(article.readingMinutes >= 1);
    }
  });
});

describe("sections", () => {
  const sections = getSections();

  it("covers every article exactly once", () => {
    const counted = sections.reduce((sum, section) => sum + section.count, 0);
    assert.equal(counted, articles.length);
  });

  it("matches the section recorded on each article", () => {
    const slugs = new Set(sections.map((s) => s.section));
    for (const article of articles) {
      assert.ok(slugs.has(article.section), `orphaned section: ${article.section}`);
    }
  });

  it("is sorted by label for a stable navigation order", () => {
    const labels = sections.map((s) => s.label);
    assert.deepEqual(labels, [...labels].sort((a, b) => a.localeCompare(b, "en")));
  });
});

describe("previous / next traversal", () => {
  it("walks the full corpus without gaps", () => {
    const first = articles[0];
    const last = articles[articles.length - 1];
    assert.equal(getPrevNext(first.route).prev, null);
    assert.equal(getPrevNext(last.route).next, null);
  });

  it("is symmetric: next(a) === b implies prev(b) === a", () => {
    for (const article of articles) {
      const { next } = getPrevNext(article.route);
      if (!next) continue;
      assert.equal(getPrevNext(next.route).prev?.route, article.route);
    }
  });

  it("returns nulls for an unknown route rather than throwing", () => {
    assert.deepEqual(getPrevNext("/does/not/exist"), { prev: null, next: null });
  });
});

describe("topics", () => {
  it("derives slugs consistently with the link builder", () => {
    for (const topic of getTopics()) {
      assert.equal(topicSlug(topic.label), topic.slug);
    }
  });

  it("never invents a topic that no article declares", () => {
    const declared = new Set(articles.flatMap((a) => a.topics.map(topicSlug)));
    for (const topic of getTopics()) {
      assert.ok(declared.has(topic.slug));
    }
  });

  it("produces URL-safe slugs", () => {
    for (const topic of getTopics()) {
      assert.match(topic.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });
});

describe("related articles", () => {
  it("never includes the article itself", () => {
    for (const article of articles) {
      const related = getRelatedArticles(article.route);
      assert.ok(!related.some((r) => r.route === article.route));
    }
  });

  it("respects the requested limit", () => {
    for (const article of articles) {
      assert.ok(getRelatedArticles(article.route, 2).length <= 2);
    }
  });

  it("returns a stable selection across calls", () => {
    const target = articles[0].route;
    assert.deepEqual(
      getRelatedArticles(target).map((a) => a.route),
      getRelatedArticles(target).map((a) => a.route),
    );
  });

  it("returns nothing for an unknown route", () => {
    assert.deepEqual(getRelatedArticles("/does/not/exist"), []);
  });

  it("prefers same-section articles over unrelated ones", () => {
    const withSiblings = articles.find(
      (a: ArticleMeta) => articles.filter((b) => b.section === a.section).length > 1,
    );
    if (!withSiblings) return; // corpus has no multi-article section
    const related = getRelatedArticles(withSiblings.route);
    assert.ok(related.length > 0);
    assert.equal(related[0].section, withSiblings.section);
  });
});

describe("formatArticleType", () => {
  it("title-cases a hyphenated type", () => {
    assert.equal(formatArticleType("model-report"), "Model Report");
    assert.equal(formatArticleType("engineering-deep-dive"), "Engineering Deep Dive");
  });
});
