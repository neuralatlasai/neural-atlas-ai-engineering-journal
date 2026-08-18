# Neural Atlas

Neural Atlas is a static-first AI engineering and research journal built with
Next.js, React, TypeScript, KaTeX, and Shiki. It recursively compiles the
Markdown corpus in `docs/` into accessible, searchable, deployment-ready HTML.

## Core behavior

- Recursive Markdown discovery with deterministic, collision-checked routes.
- Build-time mathematics and syntax highlighting; no browser Markdown runtime.
- Static search index, article outlines, feeds, sitemap, and structured data.
- Responsive images generated before export.
- Light/dark themes and progressive enhancement.
- Static export to `out/` for GitHub Pages.
- Postbuild gates for broken math, leaked TeX, links, assets, and HTML structure.

## Local development

Requirements: Node.js 22 and npm.

```bash
npm ci
npm run dev
```

Open the local URL printed by the development server.

## Verification

```bash
npm run typecheck
npm test
npm run build
```

`npm run build` performs image preprocessing, a production static export, math
verification, and an exported-HTML audit. The complete local gate is:

```bash
npm run verify
```

## Add an article

Add a Markdown file anywhere under `docs/`. Corpus discovery derives the route
from its location; normal articles do not require a route registry entry.

Rendering defects should be fixed in the shared content pipeline rather than by
rewriting individual articles.

## Project documentation

- [`AGENTS.md`](./AGENTS.md): authoritative engineering contract, architecture,
  known failure modes, validation rules, and release procedure.
- [`plan.md`](./plan.md): current implementation status and long-term product,
  compiler, design, accessibility, performance, and testing roadmap.

## Deployment

Pushes to `main` run the GitHub Pages workflow. It installs the pinned lockfile,
typechecks, tests, builds, audits, uploads `out/`, and deploys only after all
required build steps pass.
