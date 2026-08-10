import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

/**
 * Robustness of corpus handling against arbitrary author input.
 *
 * These run against `tests/fixtures/corpus`, a deliberately hostile corpus:
 * empty files, malformed front matter, unclosed maths, unsluggable file names,
 * colliding routes, CRLF + BOM, deep nesting, mixed scripts, raw HTML.
 *
 * The property under test is not "these particular files work" — it is that
 * *adding a document can never break the site*. Every real defect this session
 * started as a new document behaving differently from the ones already there.
 *
 * `node --test` runs each file in its own process, so pointing the content root
 * at the fixtures here cannot affect the other suites.
 */
process.env.NEURAL_ATLAS_CONTENT_ROOTS = path.join("tests", "fixtures", "corpus");

type CorpusModule = typeof import("../lib/content/corpus");
type CompileModule = typeof import("../lib/content/compile");

let corpus: CorpusModule;
let compile: CompileModule;

before(async () => {
  // Imported dynamically so the env var above is set before module load.
  corpus = await import("../lib/content/corpus");
  compile = await import("../lib/content/compile");
});

describe("discovery survives hostile input", () => {
  it("does not throw", () => {
    assert.doesNotThrow(() => corpus.getAllArticles());
  });

  it("publishes the documents that have content", () => {
    const routes = corpus.getAllArticles().map((a) => a.route);
    assert.ok(routes.length >= 9, `expected most fixtures to publish, got ${routes.length}`);
  });

  it("keeps a file with malformed front matter instead of dropping the site", () => {
    // Regression: `gray-matter` threw out of discovery, so one bad file took
    // every page down with it.
    const article = corpus.getAllArticles().find((a) => a.documentId.includes("broken-front-matter"));
    assert.ok(article, "document with invalid front matter must still publish");
    assert.ok(article.description.length > 0, "its body is still readable");
    const codes = corpus.getCorpusDiagnostics().map((d) => d.code);
    assert.ok(codes.includes("invalid-front-matter"), "and the problem is reported");
  });

  it("skips empty documents and says so", () => {
    const routes = corpus.getAllArticles().map((a) => a.documentId);
    assert.ok(!routes.some((id) => id.endsWith("empty.md")));
    assert.ok(!routes.some((id) => id.endsWith("whitespace.md")));
    assert.ok(!routes.some((id) => id.endsWith("front-matter-only.md")));
    const empties = corpus.getCorpusDiagnostics().filter((d) => d.code === "empty-document");
    assert.equal(empties.length, 3);
  });

  it("never emits a route that is not URL-safe", () => {
    for (const article of corpus.getAllArticles()) {
      for (const segment of article.routeSegments) {
        assert.match(segment, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `${article.documentId} → ${segment}`);
      }
    }
  });

  it("gives an unsluggable file name a usable route", () => {
    // `___.md` slugifies to nothing, which would produce `/gamma/` and collide
    // with the section index.
    const article = corpus.getAllArticles().find((a) => a.documentId.includes("___"));
    assert.ok(article);
    assert.notEqual(article.route, `/${article.section}`);
    assert.equal(article.routeSegments.length, 2);
  });

  it("never collides two documents onto one route", () => {
    const routes = corpus.getAllArticles().map((a) => a.route);
    assert.equal(new Set(routes).size, routes.length, `collision in ${routes.join(", ")}`);
  });

  it("never collides an article route with a section index route", () => {
    const sections = new Set(corpus.getSections().map((s) => `/${s.section}`));
    for (const article of corpus.getAllArticles()) {
      assert.ok(!sections.has(article.route), `${article.route} shadows a section index`);
    }
  });

  it("preserves every level of deeply nested source folders", () => {
    const deep = corpus
      .getAllArticles()
      .find((article) => article.documentId.endsWith("Beta/Nested/Deep/deep.md"));
    assert.ok(deep);
    assert.deepEqual(deep.folderSegments, ["beta", "nested", "deep"]);

    for (let depth = 1; depth <= deep.folderSegments.length; depth++) {
      assert.ok(
        corpus.getFolderContents(deep.folderSegments.slice(0, depth)),
        `missing depth ${depth}`,
      );
    }
  });

  it("publishes one collision-free route per recursive folder", () => {
    const folders = corpus.getContentFolders();
    const routes = folders.map((folder) => folder.route);
    assert.equal(new Set(routes).size, routes.length);
    for (const folder of folders) {
      assert.match(folder.route, /^\/library(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)+$/);
    }
  });

  it("gives every published document a non-empty title", () => {
    for (const article of corpus.getAllArticles()) {
      assert.ok(article.title.trim().length > 0, article.documentId);
    }
  });

  it("falls back to the filename for a damaged math opener", () => {
    const article = corpus
      .getAllArticles()
      .find((candidate) => candidate.documentId.endsWith("delimiter-scar.md"));
    assert.ok(article);
    assert.equal(article.title, "Delimiter Scar");
  });

  it("is deterministic across repeated discovery", () => {
    const first = corpus.getAllArticles().map((a) => a.route);
    const second = corpus.getAllArticles().map((a) => a.route);
    assert.deepEqual(first, second);
  });
});

describe("compilation survives hostile input", () => {
  it("renders every discovered document without throwing", async () => {
    for (const article of corpus.getAllArticles()) {
      const source = corpus.readSource(article.sourcePath);
      const compiled = await compile.compileArticle(
        source,
        article.title,
        corpus.assetResolverFor(article.sourcePath),
      );
      assert.equal(typeof compiled.html, "string", article.documentId);
    }
  });

  it("indexes every discovered document without throwing", async () => {
    for (const article of corpus.getAllArticles()) {
      const source = corpus.readSource(article.sourcePath);
      const indexed = await compile.extractArticleIndex(source, article.title);
      assert.ok(Array.isArray(indexed.headings), article.documentId);
    }
  });

  it("leaves unclosed display maths as authored rather than swallowing the rest", async () => {
    const article = corpus.getAllArticles().find((a) => a.documentId.includes("unclosed-math"));
    assert.ok(article);
    const compiled = await compile.compileArticle(
      corpus.readSource(article.sourcePath),
      article.title,
    );
    // The prose after the unterminated block must still reach the page.
    assert.ok(compiled.html.includes("No closing bracket"), "content after the block is preserved");
  });

  it("handles CRLF and a byte-order mark", async () => {
    const article = corpus.getAllArticles().find((a) => a.documentId.includes("crlf-bom"));
    assert.ok(article, "a CRLF/BOM document is discovered");
    assert.ok(article.title.length > 0);
    assert.ok(!article.title.includes("﻿"), "the BOM does not leak into the title");
    const compiled = await compile.compileArticle(
      corpus.readSource(article.sourcePath),
      article.title,
    );
    assert.ok(compiled.html.includes("Windows line endings"));
  });

  it("produces valid heading ids for mixed scripts and emoji", async () => {
    const article = corpus.getAllArticles().find((a) => a.documentId.includes("unicode"));
    assert.ok(article);
    const compiled = await compile.compileArticle(
      corpus.readSource(article.sourcePath),
      article.title,
    );
    for (const heading of compiled.headings) {
      assert.ok(heading.id.length > 0, "every heading gets an id");
      assert.ok(!/\s/.test(heading.id), `id must not contain whitespace: ${heading.id}`);
    }
  });

  it("keeps every outline anchor present in the rendered HTML", async () => {
    for (const article of corpus.getAllArticles()) {
      const compiled = await compile.compileArticle(
        corpus.readSource(article.sourcePath),
        article.title,
      );
      for (const heading of compiled.headings) {
        assert.ok(
          compiled.html.includes(`id="${heading.id}"`),
          `${article.documentId}: dead outline anchor #${heading.id}`,
        );
      }
    }
  });

  it("emits no duplicate heading ids within a document", async () => {
    for (const article of corpus.getAllArticles()) {
      const compiled = await compile.compileArticle(
        corpus.readSource(article.sourcePath),
        article.title,
      );
      const ids = compiled.headings.map((h) => h.id);
      assert.equal(new Set(ids).size, ids.length, article.documentId);
    }
  });

  it("never starts a document's headings below h2 or skips a level", async () => {
    for (const article of corpus.getAllArticles()) {
      const compiled = await compile.compileArticle(
        corpus.readSource(article.sourcePath),
        article.title,
      );
      const levels = [...compiled.html.matchAll(/<h([1-6])[^>]*>/g)].map((m) => Number(m[1]));
      assert.ok(levels.every((l) => l >= 2), `${article.documentId} uses <h1> in the body`);
      for (let i = 1; i < levels.length; i++) {
        assert.ok(
          levels[i] - levels[i - 1] <= 1,
          `${article.documentId}: heading jump h${levels[i - 1]} → h${levels[i]}`,
        );
      }
    }
  });
});

describe("search index survives hostile input", () => {
  it("builds without throwing and covers every published document", async () => {
    const search = await import("../lib/content/search");
    const index = await search.buildSearchIndex();
    assert.equal(index.documents.length, corpus.getAllArticles().length);
    for (const doc of index.documents) {
      assert.ok(doc.route.startsWith("/"), doc.route);
      assert.equal(typeof doc.title, "string");
      assert.ok(Array.isArray(doc.sections));
    }
  });

  it("serialises to JSON that round-trips", async () => {
    const search = await import("../lib/content/search");
    const index = await search.buildSearchIndex();
    assert.doesNotThrow(() => JSON.parse(JSON.stringify(index)));
  });
});
