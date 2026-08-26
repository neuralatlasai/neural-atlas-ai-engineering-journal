import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildArticleMarkdown,
  buildArticleMarkdownFiles,
  buildLlmsFullTxt,
  buildLlmsTxt,
  LLMS_FULL_TXT_PATH,
  LLMS_TXT_PATH,
  markdownPathFor,
} from "../lib/content/llms";
import { assetResolverFor, getAllArticles, getSections, readSource } from "../lib/content/corpus";
import { absoluteAssetUrl, absoluteUrl, site } from "../lib/site";

/**
 * These run against the real corpus, so they assert what the llmstxt.org format
 * requires of *any* corpus rather than the titles this one happens to contain.
 */
const index = buildLlmsTxt();
const lines = index.split("\n");
const articles = getAllArticles();

/** Every Markdown list item in the index, as `[name, url, detail]`. */
const items = lines
  .filter((line) => line.startsWith("- ["))
  .map((line) => {
    const match = /^- \[(.*?)\]\((\S+?)\)(?:: (.*))?$/.exec(line);
    assert.ok(match, `unparseable list item: ${line}`);
    return { name: match[1], url: match[2], detail: match[3] ?? "" };
  });

describe("llms.txt format", () => {
  it("opens with a single H1 naming the publication", () => {
    assert.equal(lines[0], `# ${site.name}`);
    assert.equal(lines.filter((line) => /^# /.test(line)).length, 1);
  });

  it("follows the H1 with exactly one blockquote summary", () => {
    assert.equal(lines[1], "");
    assert.match(lines[2], /^> \S/);
    assert.equal(lines[3], "");
    // A single line: a wrapped blockquote would be two consecutive `>` lines.
    assert.ok(!lines.slice(3).some((line) => line.startsWith("> ")));
  });

  it("uses only H1 and H2 headings", () => {
    for (const line of lines) {
      if (!line.startsWith("#")) continue;
      assert.match(line, /^#{1,2} \S/, `unsupported heading level: ${line}`);
    }
  });

  it("gives every H2 section a non-empty link list", () => {
    const starts = lines.flatMap((line, i) => (line.startsWith("## ") ? [i] : []));
    assert.ok(starts.length > 0);

    for (const [n, start] of starts.entries()) {
      const body = lines.slice(start + 1, starts[n + 1] ?? lines.length);
      assert.ok(
        body.some((entry) => entry.startsWith("- [")),
        `section has no links: ${lines[start]}`,
      );
    }
  });

  it("places `## Optional` last, as the format reserves it", () => {
    const headings = lines.filter((line) => line.startsWith("## "));
    assert.equal(headings.at(-1), "## Optional");
    assert.equal(headings.filter((line) => line === "## Optional").length, 1);
  });

  it("keeps every list item on one line and parseable", () => {
    assert.ok(items.length >= articles.length);
    for (const item of items) {
      assert.match(item.name, /\S/);
      assert.ok(!item.detail.includes("\n"));
    }
  });

  it("emits only absolute URLs", () => {
    for (const item of items) {
      const url = new URL(item.url); // throws on a relative href
      assert.equal(url.origin, site.origin, item.url);
    }
  });

  it("lists every article exactly once, as Markdown", () => {
    const urls = items.map((item) => item.url);
    for (const article of articles) {
      const url = absoluteUrl(markdownPathFor(article));
      assert.ok(url.endsWith(".md"), url);
      assert.equal(
        urls.filter((candidate) => candidate === url).length,
        1,
        `${article.route} is not listed exactly once as Markdown`,
      );
    }

    const sectionLabels = getSections().map((section) => section.label);
    for (const label of sectionLabels) {
      assert.ok(lines.includes(`## ${label}`), `missing section heading: ${label}`);
    }
  });

  it("links the full-text companion", () => {
    assert.ok(items.some((item) => item.url === absoluteUrl(LLMS_FULL_TXT_PATH)));
  });

  it("is deterministic", () => {
    assert.equal(buildLlmsTxt(), index);
  });
});

describe("llms-full.txt", () => {
  const full = buildLlmsFullTxt();

  it("references the index and the site origin in its header", () => {
    assert.ok(full.startsWith(`# ${site.name} — Complete Corpus`));
    assert.ok(full.includes(absoluteUrl(LLMS_TXT_PATH)));
  });

  it("carries every article's body and canonical URL", () => {
    for (const article of articles) {
      assert.ok(
        full.includes(`> Page: ${absoluteUrl(article.route)}`),
        `${article.route} is missing from the full text`,
      );
    }
    // One metadata block per document. Bodies contain `---` rules of their own,
    // so the metadata block — not the separator — is what delimits a document.
    assert.equal((full.match(/^> Page: /gm) ?? []).length, articles.length);
  });

  it("strips front matter rather than emitting it as content", () => {
    assert.ok(!/\n---\ntitle:/i.test(full));
  });

  it("resolves document-relative image references to absolute URLs", () => {
    /**
     * The rule, not the artifact. `build/image-manifest.json` is written by the
     * prebuild step, and `npm test` runs before it on a fresh checkout — so an
     * assertion that *no* relative target survives only passes on a machine
     * that happens to have built before, and fails in CI. What must hold either
     * way is that a target survives relative exactly when the manifest cannot
     * resolve it, and that a resolvable one is rewritten to its published URL.
     */
    const starts = [...full.matchAll(/^> Page: .+$/gm)].map((match) => match.index ?? 0);
    assert.equal(starts.length, articles.length);

    for (const [i, article] of articles.entries()) {
      const body = full.slice(starts[i], starts[i + 1] ?? full.length);
      const resolve = assetResolverFor(article.sourcePath);

      for (const [, target] of body.matchAll(/!\[[^\]]*\]\((\.{1,2}\/[^)\s]*)\)/g)) {
        assert.equal(resolve(target), null, `${article.documentId}: ${target} was resolvable`);
      }

      for (const [, target] of readSource(article.sourcePath).matchAll(
        /!\[[^\]]*\]\((\.{1,2}\/[^)\s]*)\)/g,
      )) {
        const resolved = resolve(target);
        if (!resolved) continue;
        assert.ok(
          body.includes(absoluteAssetUrl(resolved.src)),
          `${article.documentId}: ${target} was not rewritten`,
        );
      }
    }
  });

  it("normalizes mathematics into remark-math delimiters", () => {
    // The authored convention (a lone `[` opening a display block) must not
    // survive into the file an LLM reads.
    assert.ok(!/\n\[\n\\boxed/.test(full));
  });

  it("is deterministic", () => {
    assert.equal(buildLlmsFullTxt(), full);
  });

  it("embeds each document exactly as its own `.md` file serves it", () => {
    // The drift guard: one renderer feeds both surfaces, and a passage quoted
    // from either must be findable in the other.
    for (const article of articles) {
      assert.ok(
        full.includes(buildArticleMarkdown(article)),
        `${article.documentId} differs between its .md file and the full text`,
      );
    }
  });
});

describe("per-document Markdown", () => {
  const files = buildArticleMarkdownFiles();

  it("publishes one file per document, at its page path plus `.md`", () => {
    assert.equal(files.length, articles.length);
    for (const [i, article] of articles.entries()) {
      assert.equal(files[i].path, `${article.route}.md`);
    }
    assert.equal(new Set(files.map((file) => file.path)).size, files.length);
  });

  it("keeps the pairing derivable in both directions", () => {
    for (const article of articles) {
      const md = markdownPathFor(article);
      assert.ok(md.endsWith(".md"));
      // Dropping the extension must land back on the page route exactly — the
      // property an agent relies on when it rewrites one URL into the other.
      assert.equal(md.slice(0, -".md".length), article.route);
      // A dot in a route segment would make the extension ambiguous.
      assert.ok(!article.route.includes("."), article.route);
    }
  });

  it("names its own page and Markdown URLs in every document", () => {
    for (const [i, article] of articles.entries()) {
      const content = files[i].content;
      assert.ok(content.startsWith(`# `));
      assert.ok(content.includes(`> Page: ${absoluteUrl(article.route)}`));
      assert.ok(content.includes(`> Markdown: ${absoluteUrl(markdownPathFor(article))}`));
      assert.ok(content.includes(`> Source: ${article.documentId}`));
      assert.ok(content.endsWith("\n"));
    }
  });

  it("is deterministic", () => {
    assert.deepEqual(buildArticleMarkdownFiles(), files);
  });
});
