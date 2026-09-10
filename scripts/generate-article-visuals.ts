/**
 * Run with: node --import tsx scripts/generate-article-visuals.ts
 * SVG exports use the same renderer as the article, avoiding a second design
 * implementation. Stable identifiers and geometry make output deterministic.
 * Atomic rename prevents readers from seeing a partially written export.
 */
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { mkdir, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { articleVisuals } from "../lib/visuals/catalog";
import { DiagramArtwork } from "../components/visuals/DiagramArtwork";

async function main() {
  const destination = path.resolve("public/figures");
  await mkdir(destination, { recursive: true });
  for (const visual of articleVisuals) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(visual.id)) {
      throw new Error(`Invalid figure identifier: ${visual.id}`);
    }
    const target = path.join(destination, `${visual.id}.svg`);
    const temporary = `${target}.tmp`;
    const svg = renderToStaticMarkup(React.createElement(DiagramArtwork, { visual, standalone: true }));
    await writeFile(temporary, `<?xml version="1.0" encoding="UTF-8"?>\n${svg}\n`, "utf8");
    await rename(temporary, target);
  }
  console.log(`Exported ${articleVisuals.length} article-specific SVG figures.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
