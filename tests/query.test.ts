import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildSnippet, highlightParts, search, tokenize } from "../lib/search/query";
import { SEARCH_INDEX_VERSION, type SearchDocument, type SearchIndex } from "../lib/search/types";

function doc(overrides: Partial<SearchDocument> = {}): SearchDocument {
  return {
    route: "/models/example",
    title: "Example Model Report",
    description: "An analysis of the example model.",
    section: "models",
    sectionLabel: "Models",
    articleType: "model-report",
    topics: [],
    displayDate: null,
    readingMinutes: 5,
    sections: [],
    ...overrides,
  };
}

function index(documents: SearchDocument[]): SearchIndex {
  return { version: SEARCH_INDEX_VERSION, documents };
}

describe("tokenize", () => {
  it("lowercases and splits on punctuation", () => {
    assert.deepEqual(tokenize("Paged Attention, KV-cache!"), ["paged", "attention", "kv-cache"]);
  });

  it("keeps identifier characters that matter in technical queries", () => {
    assert.deepEqual(tokenize("head_dim c++ v2.1"), ["head_dim", "c++", "v2.1"]);
  });

  it("returns nothing for an empty or punctuation-only query", () => {
    assert.deepEqual(tokenize(""), []);
    assert.deepEqual(tokenize("   ,,, "), []);
  });
});

describe("search", () => {
  it("returns nothing without an index or a query", () => {
    assert.deepEqual(search(null, "attention"), []);
    assert.deepEqual(search(index([doc()]), "   "), []);
  });

  it("requires every query term to appear somewhere in the document", () => {
    const documents = [
      doc({ route: "/a", title: "Attention mechanisms" }),
      doc({
        route: "/b",
        title: "Attention and routing",
        sections: [{ id: "s", title: "Routing", text: "expert routing details", code: "" }],
      }),
    ];
    const hits = search(index(documents), "attention routing");
    assert.equal(hits.length, 1);
    assert.equal(hits[0].document.route, "/b");
  });

  it("ranks a title match above a body-only match", () => {
    const documents = [
      doc({
        route: "/body",
        title: "Unrelated heading",
        description: "",
        sections: [{ id: "x", title: "Notes", text: "mentions quantization once", code: "" }],
      }),
      doc({ route: "/title", title: "Quantization in practice", description: "" }),
    ];
    const hits = search(index(documents), "quantization");
    assert.equal(hits[0].document.route, "/title");
  });

  it("deep-links to the matching section", () => {
    const documents = [
      doc({
        sections: [
          { id: "", title: "Example Model Report", text: "lead paragraph", code: "" },
          { id: "kv-cache", title: "KV cache", text: "paged blocks and eviction", code: "" },
        ],
      }),
    ];
    const [hit] = search(index(documents), "paged blocks");
    assert.equal(hit.href, "/models/example#kv-cache");
    assert.equal(hit.section?.id, "kv-cache");
  });

  it("falls back to the article route when only document fields match", () => {
    const documents = [doc({ sections: [] })];
    const [hit] = search(index(documents), "example model report");
    assert.equal(hit.href, "/models/example");
  });

  it("scores whole-word matches above substring matches", () => {
    const documents = [
      doc({ route: "/sub", title: "Preattentive processing", description: "" }),
      doc({ route: "/word", title: "Attention explained", description: "" }),
    ];
    const hits = search(index(documents), "attention");
    assert.equal(hits[0].document.route, "/word");
  });

  it("weights code matches below prose matches", () => {
    const documents = [
      doc({
        route: "/code",
        title: "A",
        description: "",
        sections: [{ id: "s", title: "S", text: "", code: "head_dim = 128" }],
      }),
      doc({
        route: "/prose",
        title: "B",
        description: "",
        sections: [{ id: "s", title: "S", text: "the head_dim field", code: "" }],
      }),
    ];
    const hits = search(index(documents), "head_dim");
    assert.equal(hits[0].document.route, "/prose");
    assert.equal(hits.length, 2, "code matches are still findable, just ranked lower");
  });

  it("matches the route slug, which may be the only authored signal", () => {
    // This corpus has no front matter, so `/components/attention` is titled
    // "MHA" — its slug is the only place the word "attention" appears in its
    // metadata, and it must still outrank a passing mention elsewhere.
    const documents = [
      doc({
        route: "/components/attention",
        title: "MHA",
        description: "",
        sections: [],
      }),
      doc({
        route: "/models/other",
        title: "Other",
        description: "",
        sections: [{ id: "s", title: "Notes", text: "one attention mention", code: "" }],
      }),
    ];
    const hits = search(index(documents), "attention");
    assert.equal(hits[0].document.route, "/components/attention");
  });

  it("finds a document whose only match is its slug", () => {
    const documents = [doc({ route: "/models/glm-5-2", title: "Report", description: "" })];
    assert.equal(search(index(documents), "glm").length, 1);
  });

  it("honours the result limit", () => {
    const documents = Array.from({ length: 10 }, (_, i) =>
      doc({ route: `/r${i}`, title: `Attention ${i}` }),
    );
    assert.equal(search(index(documents), "attention", { limit: 3 }).length, 3);
  });

  it("orders ties deterministically by title", () => {
    const documents = [
      doc({ route: "/b", title: "Beta attention", description: "" }),
      doc({ route: "/a", title: "Alpha attention", description: "" }),
    ];
    const first = search(index(documents), "attention").map((h) => h.document.route);
    const second = search(index(documents), "attention").map((h) => h.document.route);
    assert.deepEqual(first, second);
    assert.deepEqual(first, ["/a", "/b"]);
  });
});

describe("buildSnippet", () => {
  it("centres the excerpt on the first match", () => {
    const text = `${"filler ".repeat(40)}needle${" trailing".repeat(40)}`;
    const snippet = buildSnippet(text, ["needle"], 30);
    assert.ok(snippet.includes("needle"));
    assert.ok(snippet.startsWith("…"));
    assert.ok(snippet.endsWith("…"));
  });

  it("does not begin or end mid-word", () => {
    const snippet = buildSnippet(`${"alpha ".repeat(30)}needle ${"omega ".repeat(30)}`, ["needle"], 25);
    const inner = snippet.replace(/^…|…$/g, "").trim();
    assert.ok(!/^\w*?(?:lpha|mega)\b/.test(inner) || inner.startsWith("alpha") || inner.startsWith("omega"));
  });

  it("returns the head of the text when nothing matches", () => {
    assert.equal(buildSnippet("short text", ["absent"]), "short text");
  });

  it("returns an empty string for empty input", () => {
    assert.equal(buildSnippet("", ["x"]), "");
  });
});

describe("highlightParts", () => {
  it("splits into alternating matched and unmatched runs", () => {
    assert.deepEqual(highlightParts("the attention head", ["attention"]), [
      { text: "the ", match: false },
      { text: "attention", match: true },
      { text: " head", match: false },
    ]);
  });

  it("preserves the original casing of the matched text", () => {
    const parts = highlightParts("Attention", ["attention"]);
    assert.deepEqual(parts, [{ text: "Attention", match: true }]);
  });

  it("merges overlapping matches instead of nesting them", () => {
    const parts = highlightParts("attention", ["atten", "tention"]);
    assert.deepEqual(parts, [{ text: "attention", match: true }]);
  });

  it("round-trips to the original string", () => {
    const text = "paged attention with kv cache";
    const parts = highlightParts(text, ["attention", "cache"]);
    assert.equal(parts.map((p) => p.text).join(""), text);
  });

  it("returns a single unmatched run when there are no terms", () => {
    assert.deepEqual(highlightParts("text", []), [{ text: "text", match: false }]);
  });
});
