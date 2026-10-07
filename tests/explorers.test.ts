import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { explorers, explorerRoute, explorersForFolder, explorersForArticle, modelArchitectures } from "../lib/explorers/catalog";
import { prepareExplorerDocument } from "../lib/explorers/document";
import { getContentFolders, getAllArticles } from "../lib/content/corpus";
import { createRequire } from "node:module";
import { renderArchitectureDocument } from "../lib/explorers/template";
import type { ModelArchitecture } from "../lib/explorers/schema";

const renderer = createRequire(import.meta.url)("../public/explorers/architecture.js") as {
  create: (model: ModelArchitecture) => { render: (view: string, mode: string, width: number) => Graph };
};

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
    for (const explorer of explorers.filter((item) => !item.architecture)) {
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
    assert.equal(explorersForFolder(["models"]).length, explorers.length);
    assert.equal(explorersForFolder(["models", "autoregressive-language-model"]).length, 4);
    assert.equal(explorersForFolder(["models", "diffusion"]).length, 5);
    assert.equal(explorersForFolder(["engineering"]).length, 0);
  });

  it("renders every source view and context with valid graph endpoints at narrow and wide sizes", () => {
    for (const explorer of explorers) {
      let engine: { views: { id: string }[]; render: (view: string, mode: string, width: number) => Graph };
      if (explorer.architecture) engine = renderer.create(explorer.architecture) as typeof engine;
      else {
        const source = fs.readFileSync(explorer.source, "utf8");
        const engineScript = source.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];
        assert.ok(engineScript);
        const context = vm.createContext({ module: { exports: {} } });
        vm.runInContext(engineScript, context, { timeout: 2000 });
        engine = context.module.exports as typeof engine;
      }
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

  it("covers every non-empty Models article and each subject in the comparison articles", () => {
    const models = getAllArticles().filter((article) => article.section === "models");
    assert.equal(models.length, 9);
    for (const article of models) {
      const owned = explorersForArticle(article.sourcePath);
      assert.ok(owned.length, `Missing architecture for ${article.sourcePath}`);
      for (const explorer of owned) assert.deepEqual(explorer.folder, article.folderSegments);
    }
    assert.equal(explorersForFolder(["models", "vision-model"]).length, 4);
    assert.equal(explorersForArticle("docs/Models/Diffusion/Flow_matching/flow_matching.md").length, 3);
    assert.equal(explorersForArticle("docs/Models/Diffusion/Flow_matching/MM_DiT.md").length, 2);
    assert.equal(explorersForArticle("elsewhere/DeepSeek-V4.1-Flash.md").length, 0);
    assert.equal(explorersForArticle("docs/Engineering/ScalingHabitat.md").length, 0);
  });

  it("preserves algorithm-specific state and supervision boundaries", () => {
    const view = (modelId: string, viewId: string) => {
      const selected = modelArchitectures.find(({ id }) => id === modelId)?.views.find(({ id }) => id === viewId);
      assert.ok(selected, `${modelId}/${viewId}`);
      return selected;
    };
    const connects = (graph: ReturnType<typeof view>, from: string, to: string) => graph.edges.some((edge) => edge.from === from && edge.to === to);
    // Flash's shifted input map is the mechanism that enables a single stream traversal.
    const flash = view("deepseek-v4-1-flash", "mhc"), pro = view("deepseek-v4-pro", "mhc");
    assert.ok(connects(flash, "previous", "aggregate"));
    assert.ok(!connects(flash, "gates", "aggregate"));
    assert.ok(connects(pro, "gates", "aggregate"));
    // Audio-frame IDs, rather than synthesized waveform samples, feed the TTS planner.
    const tts = view("voxtral-tts", "model");
    assert.ok(connects(tts, "semantic", "planner") && connects(tts, "acoustic", "planner"));
    assert.ok(!connects(tts, "decode", "planner"));
    assert.ok(connects(view("voxtral-tts", "flow"), "semantic", "codec"));
    // JEPA targets supervise a loss; target coordinates cannot leak into the forward predictor.
    const jepa = view("jepa-anything", "model");
    assert.ok(connects(jepa, "analyze", "loss") && connects(jepa, "predict", "loss"));
    assert.ok(!connects(jepa, "analyze", "predict"));
    assert.ok(view("kimi-k3-vision", "model").nodes.some(({ id, evidence }) => id === "embedding" && evidence === "undisclosed"));
    for (const id of ["flow-matching", "rectified-flow", "stochastic-interpolants"]) {
      const sampling = view(id, "inference");
      assert.ok(connects(sampling, "solver", "field"));
      assert.ok(!sampling.nodes.some(({ id }) => id === "target"));
    }
  });

  it("publishes deterministic source-cited graphs and complete no-JavaScript disclosures", () => {
    const identities = new Set<string>();
    const controls = fs.readFileSync("public/explorers/controls.js", "utf8");
    // Missing required controls must fail here, before the browser controller can abort startup.
    const requiredIds = new Set(Array.from(controls.matchAll(/document\.getElementById\('([^']+)'\)/g), (match) => match[1]));
    for (const model of modelArchitectures) {
      const render = renderer.create(model).render;
      const document = prepareExplorerDocument(renderArchitectureDocument(model, render));
      assert.equal(fs.readFileSync(`public/explorers/${model.id}.html`, "utf8").replace(/\r\n/g, "\n"), document.replace(/\r\n/g, "\n"));
      assert.match(document, /<noscript><section class="atlas-static-content"/);
      assert.match(document, /Primary sources and scope/);
      const documentIds = new Set(Array.from(document.matchAll(/\bid="([^"]+)"/g), (match) => match[1]));
      for (const id of requiredIds) assert.ok(documentIds.has(id), `${model.id}: missing required control ${id}`);
      assert.ok(fs.existsSync(model.article));
      for (const source of model.sources) {
        const url = new URL(source.href);
        assert.equal(url.protocol, "https:");
        assert.match(url.hostname, /^(arxiv\.org|huggingface\.co|github\.com|www\.deepseek\.com|z\.ai|mistral\.ai)$/);
      }
      for (const view of model.views) {
        const signature = JSON.stringify(view.nodes.map(({ title, input, output, operation, row, column }) => ({ title, input, output, operation, row, column })));
        // Shared mathematical operators may recur; complete model overviews must not be copies.
        if (view.id === "model") { assert.ok(!identities.has(signature), model.id); identities.add(signature); }
        for (const node of view.nodes) {
          assert.ok(node.description && node.operation && node.input && node.output);
          assert.ok(node.references.length);
          for (const index of node.references) assert.ok(model.sources[index], `${model.id}: invalid source index`);
          assert.ok(["code", "reported", "derived", "undisclosed", "proposal"].includes(node.evidence));
        }
      }
    }
  });

  it("rejects malformed graphs and keeps unsafe prose escaped in static and dynamic output", () => {
    const model = modelArchitectures[0];
    assert.throws(() => renderer.create({ ...model, views: [{ ...model.views[0], nodes: [...model.views[0].nodes, model.views[0].nodes[0]] }] }), /Duplicate/);
    assert.throws(() => renderer.create({ ...model, views: [{ ...model.views[0], edges: [{ from: "missing", to: "missing", label: "bad" }] }] }), /endpoint/);
    assert.throws(() => renderer.create({ ...model, views: [{ ...model.views[0], nodes: [{ ...model.views[0].nodes[0], row: 100000 }] }] }), /layout/);
    const hostile = { ...model, title: '</script><script>alert("x")</script>', views: model.views.map((view, viewIndex) => viewIndex ? view : { ...view, nodes: view.nodes.map((node, index) => index ? node : { ...node, title: "<img onerror=x>" }) }) };
    const engine = renderer.create(hostile);
    const html = renderArchitectureDocument(hostile, engine.render);
    assert.doesNotMatch(html, /<script>alert|<img onerror/);
    assert.match(html, /\\u003c\/script>/);
    assert.throws(() => engine.render("missing", "inference", 720), /Unknown/);
    for (const width of [NaN, Infinity, -1, 100000]) assert.ok(engine.render("model", "inference", width).width <= 1280);
  });
});
