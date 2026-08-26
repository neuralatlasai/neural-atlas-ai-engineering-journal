/**
 * Publish every document's Markdown source beside its rendered page.
 *
 * `/components/rl-grpo/` is the page; `/components/rl-grpo.md` is the same
 * document as source. An agent handed either URL derives the other by adding or
 * dropping the extension, and the `.md` needs no HTML parsing to read — which is
 * what the links in `/llms.txt` point at.
 *
 * Why a postbuild step rather than a route handler, as `llms.txt` and `feed.xml`
 * use: the App Router cannot express a dynamic route whose *segment* carries a
 * literal suffix. `app/[...slug]/route.ts` is the only shape that would produce
 * these paths, and it collides with `app/[...slug]/page.tsx`, which renders the
 * pages themselves. Any alternative that does fit the router (`/md/<route>`,
 * `/<route>/index.md`) breaks the guessable pairing that makes the convention
 * worth having. So the export is written directly, after `next build` has
 * produced it — the same way the prebuild step writes optimized images before it.
 *
 * The content comes from `buildArticleMarkdown`, the renderer `llms-full.txt`
 * also uses, so a document is byte-identical on both surfaces.
 */
import fs from "node:fs";
import path from "node:path";
import { buildArticleMarkdownFiles } from "../lib/content/llms";

/** Next's export directory (`output: "export"` in `next.config.mjs`). */
const OUT_DIR = path.join(process.cwd(), "out");

if (!fs.existsSync(OUT_DIR)) {
  console.error(
    `emit-markdown: ${OUT_DIR} does not exist. This runs as a postbuild step, after \`next build\` has written the export.`,
  );
  process.exit(1);
}

const files = buildArticleMarkdownFiles();
if (files.length === 0) {
  console.error("emit-markdown: the corpus is empty — nothing to publish.");
  process.exit(1);
}

let bytes = 0;
for (const file of files) {
  // Route segments are slugified to `[a-z0-9-]`, so the path cannot escape the
  // export directory; the guard states that invariant rather than trusting it.
  const target = path.join(OUT_DIR, ...file.path.replace(/^\//, "").split("/"));
  if (!target.startsWith(OUT_DIR + path.sep)) {
    console.error(`emit-markdown: refusing to write outside the export: ${file.path}`);
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, file.content, "utf8");
  bytes += Buffer.byteLength(file.content);
}

console.log(
  `Markdown export: ${files.length} document(s), ${(bytes / 1024).toFixed(0)} KiB written to out/.`,
);
