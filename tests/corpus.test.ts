import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatArticleType,
  getAllArticles,
  getContentFolders,
  getFolderContents,
  getPrevNext,
  getRelatedArticles,
  getSections,
  getTopics,
  topicSlug,
  readSource,
  type ArticleMeta,
} from "../lib/content/corpus";
import { estimateReadingMinutes } from "../lib/content/reading";

/** Mirrors how the image pipeline slugifies a source filename. */
function slugLike(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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

  it("assigns every article a semantic title", () => {
    for (const article of articles) {
      assert.match(article.title, /[\p{L}\p{N}]/u, article.documentId);
    }
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

  it("never shows one article's figure as another's hero", () => {
    // Regression: the hero was chosen by scanning the article's *folder*, so
    // two documents sharing a directory were given the same image — and a
    // document with no figures of its own was given a sibling's. `Vortral.md`
    // references no images at all yet displayed `Voxtral_Realtime1.png`.
    const heroes = articles
      .filter((a) => a.hero)
      .map((a) => ({ route: a.route, src: a.hero!.src }));
    const bySrc = new Map<string, string[]>();
    for (const { route, src } of heroes) {
      bySrc.set(src, [...(bySrc.get(src) ?? []), route]);
    }
    for (const [src, routes] of bySrc) {
      assert.equal(routes.length, 1, `${src} is the hero of ${routes.join(" and ")}`);
    }
  });

  it("takes each hero from a figure the document itself references", () => {
    const IMAGE = /!\[[^\]]*\]\(\s*([^)\s]+)/g;
    for (const article of articles) {
      if (!article.hero) continue;
      const source = readSource(article.sourcePath);
      const referenced = [...source.matchAll(IMAGE)].map((m) =>
        m[1].split("/").pop()!.replace(/\.[a-z0-9]+$/i, "").toLowerCase(),
      );
      if (referenced.length === 0) continue; // alone in its folder; fallback allowed
      const heroName = article.hero.src.split("/").pop()!.toLowerCase();
      assert.ok(
        referenced.some((name) => heroName.includes(slugLike(name))),
        `${article.documentId}: hero ${heroName} is not among its own figures (${referenced.join(", ")})`,
      );
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

  it("never leaks TeX markup into a page title", () => {
    // Page titles are plain `<h1>` text and metadata; unlike body mathematics,
    // they are never processed by KaTeX.
    for (const article of articles) {
      assert.doesNotMatch(
        article.title,
        /\\[A-Za-z]+|[{}$]/,
        `${article.documentId} title contains raw TeX: ${article.title}`,
      );
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

describe("recursive folders", () => {
  const folders = getContentFolders();

  it("assigns every article to one published source folder", () => {
    for (const article of articles) {
      const contents = getFolderContents(article.folderSegments);
      assert.ok(contents, `missing folder for ${article.documentId}`);
      assert.ok(
        contents.articles.some((candidate) => candidate.documentId === article.documentId),
        `${article.documentId} is not a direct member of ${article.folderSegments.join("/")}`,
      );
    }
  });

  it("emits unique, URL-safe library routes", () => {
    const routes = folders.map((folder) => folder.route);
    assert.equal(new Set(routes).size, routes.length);
    for (const folder of folders) {
      assert.equal(folder.route, `/library/${folder.routeSegments.join("/")}`);
      for (const segment of folder.routeSegments) {
        assert.match(segment, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      }
    }
  });

  it("forms a gap-free parent chain for every nested folder", () => {
    const routes = new Set(folders.map((folder) => folder.route));
    for (const folder of folders) {
      if (folder.depth === 1) {
        assert.equal(folder.parentRoute, "/library");
      } else {
        assert.ok(routes.has(folder.parentRoute), `missing parent ${folder.parentRoute}`);
      }
    }
  });

  it("aggregates recursive counts and reading time exactly", () => {
    for (const folder of folders) {
      const descendants = articles.filter((article) =>
        folder.routeSegments.every(
          (segment, index) => article.folderSegments[index] === segment,
        ),
      );
      assert.equal(folder.articleCount, descendants.length, folder.route);
      assert.equal(
        folder.readingMinutes,
        descendants.reduce((total, article) => total + article.readingMinutes, 0),
        folder.route,
      );
    }
  });

  it("returns only direct children and direct articles from a folder", () => {
    for (const folder of folders) {
      const contents = getFolderContents(folder.routeSegments);
      assert.ok(contents);
      assert.ok(
        contents.childFolders.every((child) => child.depth === folder.depth + 1),
        folder.route,
      );
      assert.ok(
        contents.articles.every(
          (article) => article.folderSegments.length === folder.depth,
        ),
        folder.route,
      );
    }
  });

  it("is deterministic across repeated index reads", () => {
    assert.deepEqual(
      folders.map((folder) => folder.route),
      getContentFolders().map((folder) => folder.route),
    );
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
