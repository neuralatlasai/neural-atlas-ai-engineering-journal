import fs from "node:fs";
import path from "node:path";
import { explorers } from "../lib/explorers/catalog";
import { prepareExplorerDocument } from "../lib/explorers/document";

const root = process.cwd();
const target = path.join(root, "public", "explorers");
fs.mkdirSync(target, { recursive: true });
for (const explorer of explorers) {
  if (!/^[a-z0-9-]+$/.test(explorer.id)) throw new Error("Invalid explorer identity");
  const source = fs.readFileSync(path.join(root, explorer.source), "utf8");
  const document = prepareExplorerDocument(source);
  const output = path.join(target, `${explorer.id}.html`);
  if (!fs.existsSync(output) || fs.readFileSync(output, "utf8") !== document) {
    fs.writeFileSync(output, document, "utf8");
  }
}
console.log(`Explorers: ${explorers.length} self-contained document(s) published`);
