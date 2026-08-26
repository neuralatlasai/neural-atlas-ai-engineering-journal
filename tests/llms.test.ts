import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildLlmsFullTxt,
  buildLlmsTxt,
  LLMS_FULL_TXT_PATH,
  LLMS_TXT_PATH,
} from "../lib/content/llms";
import { getAllArticles, getSections } from "../lib/content/corpus";
import { absoluteUrl, site } from "../lib/site";

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

  it("lists every article exactly once, under its own section", () => {
    const urls = items.map((item) => item.url);
    for (const article of articles) {
      const url = absoluteUrl(article.route);
      assert.equal(
        urls.filter((candidate) => candidate === url).length,
        1,
        `${article.route} is not listed exactly once`,
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
        full.includes(`> URL: ${absoluteUrl(article.route)}`),
        `${article.route} is missing from the full text`,
      );
    }
    // One metadata block per document. Bodies contain `---` rules of their own,
    // so the metadata block — not the separator — is what delimits a document.
    assert.equal((full.match(/^> URL: /gm) ?? []).length, articles.length);
  });

  it("strips front matter rather than emitting it as content", () => {
    assert.ok(!/\n---\ntitle:/i.test(full));
  });

  it("resolves document-relative image references to absolute URLs", () => {
    const relative = full.match(/!\[[^\]]*\]\(\.{1,2}\//g) ?? [];
    assert.deepEqual(relative, [], "found unresolved relative image targets");
  });

  it("normalizes mathematics into remark-math delimiters", () => {
    // The authored convention (a lone `[` opening a display block) must not
    // survive into the file an LLM reads.
    assert.ok(!/\n\[\n\\boxed/.test(full));
  });

  it("is deterministic", () => {
    assert.equal(buildLlmsFullTxt(), full);
  });
});
