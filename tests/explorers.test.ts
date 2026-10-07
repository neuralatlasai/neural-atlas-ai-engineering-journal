import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { explorers, explorerRoute, explorersForFolder } from "../lib/explorers/catalog";
import { prepareExplorerDocument } from "../lib/explorers/document";
import { getContentFolders } from "../lib/content/corpus";

interface Graph {
  width: number;
  height: number;
  svg: string;
  nodes: { id: string; rect: { x: number; y: number; w: number; h: number } }[];
  edges: { id: string; from: { node: string }; to: { node: string } }[];
  steps: { nodes: string[]; edges: string[] }[];
}

describe("published architecture explorers", () => {
  it("publishes the authored HTML without changing its architecture or scripts", () => {
    for (const explorer of explorers) {
      const source = fs.readFileSync(path.join(process.cwd(), explorer.source), "utf8");
      const published = fs.readFileSync(`public/explorers/${explorer.id}.html`, "utf8");
      // Git checkouts may translate text line endings on Windows.
      assert.equal(published.replace(/\r\n/g, "\n"), prepareExplorerDocument(source).replace(/\r\n/g, "\n"));
      assert.match(published, /\.\/explorer\.css/);
      assert.match(published, /\.\/host\.js/);
      assert.match(published, /<noscript>/);
      assert.match(published, /<svg[^>]+data-view="model"/);
      const inlineScripts = (html: string) => Array.from(html.matchAll(/<script>([\s\S]*?)<\/script>/g), (match) => match[1].replace(/\r\n/g, "\n"));
      assert.deepEqual(inlineScripts(published), inlineScripts(source));
      for (const anchor of published.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
        assert.match(anchor[0], /rel="[^"]*noopener/);
      }
      assert.match(explorerRoute(explorer), /^\/explorers\/[a-z0-9-]+\/$/);
    }
    assert.throws(() => prepareExplorerDocument("<div>partial document</div>"));
    const fixture = '<html><head></head><body><a href="https://example.com" target="_blank">Source</a><script>const template = \'<a target="_blank">\';</script></body></html>';
    const hosted = prepareExplorerDocument(fixture);
    assert.match(hosted, /target="_blank" rel="noopener"/);
    assert.ok(hosted.includes("const template = '<a target=\"_blank\">';"));
  });

  it("keeps the tool discoverable in its model folders without leaking to other domains", () => {
    const folders = new Set(getContentFolders().map(({ key }) => key));
    assert.equal(new Set(explorers.map(({ id }) => id)).size, explorers.length);
    for (const { folder } of explorers) assert.ok(folders.has(folder.join("/")));
    assert.equal(explorersForFolder(["models"]).length, 1);
    assert.equal(explorersForFolder(["models", "autoregressive-language-model"]).length, 1);
    assert.equal(explorersForFolder(["models", "diffusion"]).length, 0);
    assert.equal(explorersForFolder(["engineering"]).length, 0);
  });

  it("renders every source view and context with valid graph endpoints at narrow and wide sizes", () => {
    for (const explorer of explorers) {
      const source = fs.readFileSync(explorer.source, "utf8");
      const engineScript = source.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];
      assert.ok(engineScript);
      const context = vm.createContext({ module: { exports: {} } });
      vm.runInContext(engineScript, context, { timeout: 2000 });
      const engine = context.module.exports as { views: { id: string }[]; render: (view: string, mode: string, width: number) => Graph };
      assert.deepEqual(Array.from(engine.views, ({ id }) => id), explorer.views.map(({ id }) => id));
      for (const view of explorer.views) for (const mode of ["training", "inference"]) for (const width of [280, 680, 1100]) {
        const graph = engine.render(view.id, mode, width);
        const nodes = new Set(graph.nodes.map(({ id }) => id));
        const edges = new Set(graph.edges.map(({ id }) => id));
        assert.ok(graph.height > 0 && graph.height < 16000);
        assert.equal(nodes.size, graph.nodes.length);
        assert.equal(edges.size, graph.edges.length);
        assert.doesNotMatch(graph.svg, /NaN|undefined/);
        assert.match(graph.svg, /<title>/);
        for (const { from, to } of graph.edges) {
          assert.ok(nodes.has(from.node), `${view.id}: missing source ${from.node}`);
          assert.ok(nodes.has(to.node), `${view.id}: missing destination ${to.node}`);
        }
        for (const step of graph.steps) {
          for (const id of step.nodes) assert.ok(nodes.has(id));
          for (const id of step.edges) assert.ok(edges.has(id));
        }
      }
    }
  });
});
