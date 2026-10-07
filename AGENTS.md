# Neural Atlas Agent Operating Contract

## 1. Authority and purpose

This file is the repository-level operating contract for every coding agent that
changes Neural Atlas. It describes the application that exists now, the failure
modes already observed in production, the validation required before delivery,
and the limits that must be stated honestly.

The repository is a static AI-engineering publication. It recursively discovers
Markdown under `docs/`, repairs a constrained set of known conversion scars,
compiles the corpus at build time, and exports a complete website to `out/`.
There is no production application server, database, CMS, authentication layer,
or runtime Markdown compiler.

When sources disagree, use this order of authority:

1. Current user instructions.
2. Executable code and the pinned dependency lockfile.
3. Tests, build gates, and deployment workflow.
4. This operating contract.
5. `plan.md`, which contains both implemented requirements and future work.
6. Historical comments, benchmark notes, and assumptions.

Never claim that a planned feature exists because it appears in `plan.md`.
Never claim that a build is correct merely because TypeScript compiled. If code
and this file disagree, verify the code, fix the mismatch, and update this file.

## 2. Non-negotiable repository rules

### 2.1 Fix the compiler, not the articles

The files under `docs/` are the source corpus. They may contain valid Markdown,
unusual TeX, damaged conversion artifacts, bare citation tokens, or formatting
that exposes a compiler weakness. Unless the user explicitly asks for editorial
changes, do not modify article content to hide a rendering defect.

A rendering fix must be generalized in shared code and supported by regression
tests. A valid fix:

- is based on syntax, grammar, or document structure;
- works independently of a document path, title, section number, or exact prose;
- preserves ordinary Markdown and already-valid TeX;
- is bounded so an ambiguous opener cannot consume the rest of a document;
- is idempotent where the preprocessing stage may see repaired input again;
- adds a hostile or representative fixture that fails before the fix; and
- passes corpus-wide math and exported-HTML verification.

Do not add filename checks, title checks, section-number checks, exact-sentence
replacements, or one-article exceptions. A narrowly recognized conversion scar
is acceptable only when its complete structural signature is specific enough
to avoid changing ordinary prose, and its rationale is documented in code.

### 2.2 Preserve user work

The working tree is shared with the user and may already be dirty.

- Run `git status --short --branch` before editing and again before staging.
- Treat every pre-existing modification as user-owned unless provenance proves
  otherwise.
- Do not rewrite, discard, restore, or reformat unrelated files.
- Do not use `git reset --hard`, broad checkout/restore commands, or destructive
  cleanup.
- Do not normalize the whole corpus for line endings or encoding.
- Stage only the intended files unless the user explicitly requests a broader
  command such as `git add *`.
- Recheck the diff immediately before committing because long builds and a live
  dev server can update generated files.

### 2.3 State evidence, not confidence

Use precise completion language:

- “Typecheck passed” means only `npm run typecheck` passed.
- “Tests passed” means only the named test command passed.
- “Build passed” means image preprocessing, Next export, math verification, and
  HTML audit completed for the current working tree.
- “Pushed” means Git accepted the push and the remote branch contains the SHA.
- “Deployed” means the Pages workflow for that exact SHA completed successfully
  and, when requested, the live URL was checked.

Do not call a queued workflow deployed. Do not infer the live site from a local
build. Do not quote old performance figures as current measurements.

## 3. Current architecture

### 3.1 Production pipeline

```text
docs/**/*.md
    -> lib/content/corpus.ts          recursive discovery, identity, routes
    -> lib/content/preprocess.ts      bounded corpus normalization and repair
    -> lib/content/compile.ts         remark/rehype, KaTeX, Shiki, link rewriting
    -> React Server Components        metadata, navigation, article shell
    -> Next.js static export          out/**
    -> scripts/verify-math.mjs        strict and semantic math audit
    -> scripts/audit-html.mjs         exported-page and link audit
    -> GitHub Pages                   immutable deployment artifact
```

The search index follows a cheaper structural path. It extracts searchable
document text and headings without paying the full KaTeX and Shiki rendering
cost for every indexing operation.

Image optimization runs before the build. `scripts/optimize-images.mjs` creates
responsive static variants and uses content-aware caching so unchanged source
images are not re-encoded unnecessarily. Next image optimization is disabled
because the deployed site has no image server.

### 3.2 Route model

- Markdown is discovered recursively under `docs/`.
- Routes are derived deterministically from corpus structure.
- The catch-all article route is `app/[...slug]/page.tsx`.
- Static pages include home, search, topics, library, about, sitemap, robots,
  feed, and search-index endpoints.
- Route collisions are errors; last-write-wins behavior is forbidden.
- `trailingSlash: true` is part of the deployment contract.
- Empty Markdown files are skipped rather than converted into broken pages.
- Front matter is optional; malformed or absent metadata must degrade through
  documented derivation instead of crashing corpus discovery.

Adding a normal article must not require a route registry edit. Add the Markdown
under the intended `docs/` hierarchy and let discovery derive its route.

### 3.3 Rendering model

Every essential article element is emitted as HTML during the build:

- headings, prose, lists, tables, blockquotes, links, and footnotes;
- KaTeX HTML plus MathML;
- Shiki-highlighted code;
- responsive images with stable dimensions where metadata is available;
- article outline, metadata, related navigation, and structured data.

JavaScript enhances search, theme controls, reading progress, dialogs, and
similar controls. It must not be required to read article text, equations,
tables, code, links, or figures.

Article links intentionally use ordinary anchors where prefetching or retaining
large React Server Component payloads would waste memory. Do not replace them
wholesale with eager framework links without measuring heap and navigation cost.

### 3.4 Base-path contract

GitHub Pages project sites live under `/<repository>/`. `next.config.mjs` applies
`NEXT_PUBLIC_BASE_PATH` to framework-owned routes and assets. Raw HTML URLs,
forms, fetches, generated feeds, canonical URLs, and compiler-emitted links must
use the shared helpers in `lib/site.ts`; Next cannot prefix those automatically.

An internal exported route must normally end in `/`. File routes such as
`/feed.xml`, `/robots.txt`, and generated assets are exceptions. A root-relative
URL that works locally can still be broken on Pages if the base path is missing.
The postbuild HTML audit explicitly checks this condition.

## 4. Content and math contract

### 4.1 Why intermittent defects recur

The source corpus is not a single Markdown dialect. New documents can introduce
new combinations of:

- conventional `$...$` and `$$...$$` math;
- bare parenthesized TeX used as inline math;
- display math delimited by lone `[` and `]` lines;
- an opening `[` attached to preceding prose;
- TeX split one token per line;
- braces, brackets, and row separators whose meaning depends on context;
- GFM table pipes that are also mathematical conditional bars;
- conversion scars that removed part of `\boxed`, `\text`, or delimiters;
- literal citation placeholders from an upstream tool;
- display equations placed inside a continuing prose sentence; and
- compact labels or values authored as display blocks.

A fix can therefore pass one article while being too narrow for the next shape,
or too broad and damage valid content. The solution is not an ever-growing list
of article exceptions. The solution is conservative structural recognition,
explicit boundaries, semantic verification, and corpus-wide regression tests.

### 4.2 Preprocessor invariants

`lib/content/preprocess.ts` is a source-aware compatibility layer, not a generic
TeX beautifier. Maintain these invariants:

- Never transform fenced code blocks.
- Never reinterpret Markdown reference definitions as math.
- Never split a GFM table row around an ambiguous display opener.
- Match ambiguous display blocks only when a real bounded closer exists and the
  body contains mathematical evidence.
- Track TeX brace and delimiter balance before treating `]` as a block closer.
- Restore table pipes only while structurally inside an unclosed mathematical
  group; retain real cell separators.
- Use `\vert` after delimiter-sizing commands and `\mid` for ordinary
  conditional relations.
- Keep structured math such as fractions, sums, alignments, algorithms, and
  boxes as display equations.
- Inline a compact equation only when surrounding prose grammatically owns it.
- A formula with terminal punctuation may close the preceding sentence; an
  uppercase label normally starts a new block.
- Do not collapse blank-line paragraph boundaries merely to make a screenshot
  look tighter.
- Strip only internal citation tokens recognized by the dedicated source-token
  parser; preserve real links and authored reference text.
- Preserve escaped characters and structural braces required by TeX.
- A repair must be safe on valid input and bounded in time and memory.

### 4.3 Alignment is semantic

“Alignment issue” may refer to different root causes:

1. A compact formula was emitted as its own display paragraph even though it is
   grammatically part of a sentence.
2. A label or new sentence was incorrectly joined to the previous display.
3. Raw TeX leaked because a display opener was not recognized.
4. KaTeX rendered valid but semantically corrupted TeX.
5. A long equation overflowed instead of scrolling within its own container.
6. A provenance marker such as `[DERIVED]` has the same visual weight as the
   technical content.

Diagnose the AST and exported HTML before changing CSS. CSS cannot repair a
paragraph boundary or raw TeX. Preprocessing must not be used to solve a purely
visual overflow problem.

Provenance markers (`REPORTED`, `DERIVED`, `VERIFIED`, `UNDISCLOSED`) are quiet
annotations. They must remain legible but visually subordinate to equations and
prose. Their placement must not create a large empty column or change equation
centering. Implement this through shared renderer markup and CSS, not article
edits.

### 4.4 Math verification truth

KaTeX success alone is insufficient. KaTeX can render syntactically valid but
wrong input after a lossy conversion. `scripts/verify-math.mjs` therefore:

- extracts the exact TeX embedded in generated MathML annotations;
- re-renders it with strict diagnostics;
- rejects parse failures and known semantic corruption signatures; and
- reports issues against exported pages.

`scripts/audit-html.mjs` separately scans visible page text for leaked TeX such
as `\boxed`, `\frac`, `\begin`, `\operatorname`, and related commands. Both
checks are required: the math verifier cannot inspect a formula that was never
recognized as math, and the HTML leak detector cannot prove an equation is
semantically correct.

Source-preserving fallback is useful for diagnostics, but visible raw TeX is a
publication failure and must fail the production gate.

### 4.5 Citation handling

Upstream citation artifacts such as private tool tokens must not be published as
visible square boxes or strings. Recognition belongs in
`lib/content/source-tokens.ts` and must be syntax-based. Do not delete arbitrary
bracketed text, valid Markdown citations, or external links. Add positive and
negative tests whenever the token grammar changes.

## 5. UI and accessibility invariants

- One semantic `<main>` landmark per page.
- One meaningful `<h1>` per normal page; article body headings begin below it.
- Heading levels must not jump solely for visual sizing.
- Keyboard focus must be visible in light and dark themes.
- Navigation landmarks require distinct accessible labels.
- Images require `alt`; content images should have stable dimensions.
- Tables and wide math scroll inside their own wrapper and must not force the
  whole viewport wider.
- Long URLs, code, and identifiers must wrap or scroll without covering the
  article outline.
- Desktop side rails must not alter logical DOM or keyboard order.
- At 320 CSS pixels and at 200% zoom, essential content remains reachable.
- Reduced-motion preferences disable non-essential transitions.
- Print output hides application controls and preserves article semantics.
- Color is never the only carrier of state.

The visual system is deliberately editorial: stable reading measure, restrained
color, semantic typography, borders before shadows, and no decorative card
grid around every paragraph. Light and dark themes use semantic tokens rather
than article-specific colors.

### Article graphical abstracts

Homepage covers use accessible, server-rendered SVG illustrations in
`components/visuals/CoverArtwork.tsx`, with a detailed line-symbol vocabulary in
`CoverSymbols.tsx`. `lib/visuals/home-covers.ts` curates separate domain and
article compositions; a domain never borrows an article's cover. Soft, pale
backgrounds and legible strokes remain consistent across themes, in uncropped
8:5 frames. These editorial previews do not assert a complete architecture or
measured results. `lib/home-selection.ts` supplies the homepage's bounded,
linear selection. `tests/home-cover.test.ts` checks that every selected card has
its own curated cover and geometry, plus canvas bounds and symbol contrast.
Newly selected articles need a distinct cover to pass that gate. The previous
raster assets in `public/images/home/`, their original PNGs and prompts, and
authored hero images remain available as fallbacks outside the curated set.

Every current non-empty article has a curated conceptual figure in
`lib/visuals/catalog.ts`, mapped by repository-relative source identity. The
figure introduces the article's main mechanism before its technical body;
authored body figures retain their existing positions. These are explanatory
schematics, not measured charts or assertions of undisclosed model internals.

`components/visuals/DiagramArtwork.tsx` renders accessible inline SVG during
static export. `ArticleVisualFigure.tsx` supplies a caption, a native explanation
disclosure, and an optional checkbox-controlled CSS flow animation. Comparison
figures are static. Motion starts only on reader request, respects reduced-motion
preferences, and is disabled in print. No client JavaScript is required.

Standalone SVG copies live in `public/figures/`. After editing the visual catalog
or artwork renderer, run `node --import tsx scripts/generate-article-visuals.ts`.
`tests/article-visuals.test.ts` checks complete corpus coverage, unique mappings,
source existence, accessible markup, and exact agreement between the shared
renderer and checked-in exports. Adding an article requires an editorial figure
entry to satisfy that coverage gate; route discovery remains automatic.

Authored body figures can opt into local interactive documents with
`<figure data-interactive-src="/interactive/example/flow.html">` around a
Markdown fallback image. `lib/content/interactive-figures.ts` validates the
local HTML path and applies the deployment prefix. `lib/interactive-figures.ts`
loads the sandboxed frame near the viewport, validates resize messages against
its exact window, and propagates theme, visibility, and reduced-motion settings.
Frames receive script permission without same-origin access. Static fallback
images remain readable without JavaScript, on loading failure, and in print.
Each embed has a full-view link and stays within the prose column. System theme
changes propagate unless the reader selected an explicit palette. Playback
starts paused, including with reduced motion; an explicit Play or Replay is a
per-figure choice. Enabling reduced motion stops playback until another choice.
The Habitat figures under `public/interactive/habitat/` retain the source
article's explanatory simulations; they do not expose production telemetry.

### Standalone architecture explorers

Curated self-contained HTML tools are registered in `lib/explorers/catalog.ts`;
they do not enter Markdown discovery. `npm run explorers` preserves each source
document in `docs/` and generates its hosted copy in `public/explorers/` with a
shared presentation layer. Prebuild runs this generator automatically. Run it
after editing an explorer during development. The dedicated `/explorers/[id]/`
page embeds the tool with scripts and SVG downloads enabled inside an isolated
sandbox. Protected external reference links can open in new tabs. A source-checked
message bridge handles theme, bounded document height,
and view deep links. The static overview remains readable without JavaScript.
Homepage and owning model folders link to the tool; sitemap entries use shared
base-path helpers. The supplied architecture's symbolic dimensions and scope
remain authored facts rather than inferred numerical model specifications.

## 6. Search, navigation, and metadata

- Search data is generated statically at `/search-index.json`.
- Search normalization and query behavior live under `lib/search/` and must be
  deterministic.
- Search results should deep-link to stable heading IDs when applicable.
- The article outline is derived from compiled headings, not duplicated source
  metadata.
- Feed, sitemap, robots, canonical URLs, Open Graph data, and JSON-LD must honor
  the configured public origin and base path.
- Dates may be derived when source metadata is sparse. Never describe a derived
  date as an authored publication fact.
- Topics are currently exposed through the implemented topic experience; do not
  claim dedicated author, series, or arbitrary dynamic topic routes unless the
  code actually provides them.

## 7. Repository map

```text
app/                         Next.js routes, metadata endpoints, global styles
  [...slug]/page.tsx         catch-all static article route
components/                  server and client presentation components
lib/content/                 discovery, preprocessing, compilation, metadata
lib/search/                  static query normalization and result logic
lib/site.ts                  origin, base-path, and URL helpers
lib/structured-data.ts       JSON-LD generation
docs/                        canonical article corpus; do not patch for renderer bugs
public/                      static assets and generated responsive image output
scripts/                     dev wrapper, image build, verification, audits
tests/                       unit, regression, corpus, and hostile fixtures
.github/workflows/deploy.yml GitHub Pages release pipeline
next.config.mjs              export, base path, cache separation, build ID
package.json                 executable command contract
plan.md                      current roadmap plus future target requirements
AGENTS.md                    this operating contract
```

This is currently a single Next.js application, not the aspirational monorepo
shown in older planning material. Do not invent `apps/` or `packages/` boundaries
unless a measured scaling problem justifies a migration plan.

## 8. Commands and their actual meaning

Use the pinned npm lockfile. CI uses Node.js 22 and `npm ci`.

| Command | Meaning |
|---|---|
| `npm ci` | Reproducible install from `package-lock.json`; fails on manifest drift. |
| `npm run dev` | Starts the wrapped development server using `.next-dev`. |
| `npm run typecheck` | Runs `tsc --noEmit`; does not render the corpus. |
| `npm test` | Runs Node tests in `tests/*.test.ts` through `tsx`. |
| `npm run content:validate` | Runs content-specific validation only. |
| `npm run images` | Runs responsive image generation/cache logic. |
| `npm run explorers` | Generates hosted HTML tools from their registered source documents. |
| `npm run build` | Generates explorers and images, runs `next build`, math verification, and HTML audit. |
| `npm run verify:math` | Audits math in an existing `out/`; it does not rebuild first. |
| `npm run verify:html` | Audits an existing `out/`; it does not rebuild first. |
| `npm run verify:determinism` | Builds comparable outputs with a pinned build ID and compares them. |
| `npm run verify` | Runs typecheck, tests, and the complete build pipeline. |
| `npm run start` | Exists in the manifest, but production delivery is static export, not a Next server. |
| `npm run lint` | Currently invokes `next lint`, which is not a dependable gate with the installed Next version. |

Brutal truth about the command surface:

- The full build can take minutes because the corpus is large and build-time
  KaTeX/Shiki work is intentional.
- `verify:math` and `verify:html` can pass stale output if code changed after the
  last build. Use `npm run build` when freshness matters.
- The repository does not currently have a working modern ESLint gate. Do not
  report lint as passed unless lint configuration and invocation are repaired.
- The project uses npm, not the pnpm commands retained in parts of the original
  blueprint.
- `next-env.d.ts` is generated and may point at `.next-dev/types` after dev or
  `.next/types` after a production build. Treat unexplained churn carefully.

## 9. Development and build isolation

Development writes compiler state to `.next-dev`; production builds use `.next`
and export to `out/`. This separation fixes the former failure where `next dev`
and `next build` truncated each other’s manifests.

The library root and nested folder pages share `app/library/[[...path]]/page.tsx`.
One route entry gives them one client-reference manifest, avoiding equivalent
navigation chunk aliases in exported HTML and Flight payloads. Keep the two-build
determinism check when changing these route boundaries or upgrading Next.

The separation does not make every concurrent operation safe. A dev server and
build still compete for CPU and memory, and scripts may share generated public
image assets or the export directory. Prefer a quiet full verification run when
proving release readiness. Never delete build directories broadly without first
resolving and checking the exact workspace path.

In development, `output: "export"` is intentionally disabled so the root
catch-all can return the local not-found page for unmatched browser and HMR
requests. Production builds enable static export and enforce export constraints.

## 10. Verification policy by change type

### Preprocessor, Markdown, citation, or math change

Required minimum:

1. Add focused positive and negative regression tests.
2. Run `npm test`.
3. Run `npm run typecheck`.
4. Run `npm run build` so both postbuild audits inspect fresh output.
5. Inspect representative generated HTML or the rendered page for semantic
   paragraph boundaries, not only the absence of red raw TeX.

### Route, URL, metadata, feed, or base-path change

Required minimum:

1. Run relevant corpus/site/base-path tests.
2. Run the whole unit suite.
3. Build once without a base path.
4. When deployment behavior changed, build with representative
   `NEXT_PUBLIC_BASE_PATH` and `NEXT_PUBLIC_SITE_URL` values.
5. Confirm trailing slashes, canonical URLs, assets, fragments, and raw links.

### Shared UI or CSS change

Required minimum:

1. Run typecheck and tests, including design-system assertions.
2. Run a production build.
3. Inspect desktop and narrow layouts in light and dark modes.
4. Check long equations, tables, code, provenance markers, article outline,
   keyboard focus, zoom/reflow, and print behavior when affected.

### Build, script, image, or dependency change

Required minimum:

1. Run the changed script directly where safe.
2. Run tests and typecheck.
3. Run the full build.
4. Run determinism verification if output ordering, caching, IDs, hashes, or
   build metadata changed.
5. Inspect dependency and lockfile diffs together.

### Documentation-only operating change

Inspect the Markdown diff, validate every command and path against the current
repository, and do not imply that unimplemented plan items are complete.

## 11. Deployment contract

`.github/workflows/deploy.yml` runs on pushes to `main` and manual dispatch.
The current release sequence is:

1. Checkout.
2. Install Node.js 22 and the exact npm lockfile.
3. Typecheck.
4. Run unit tests.
5. Build and verify with the repository-derived Pages base path and site origin.
6. Upload `out/` as the Pages artifact.
7. Deploy only after the build job succeeds.

The workflow uses a single `pages` concurrency group with
`cancel-in-progress: false`. New deployments queue behind an active deployment;
they do not cancel it. This protects an in-progress Pages publication from being
interrupted, but means the newest commit may not be live immediately.

Before reporting a release:

- record the local commit SHA;
- confirm the remote branch contains that SHA;
- identify the workflow run for that SHA;
- wait for both build and deploy jobs to succeed; and
- if the user asked for live verification, check representative live routes and
  assets under the repository base path.

## 12. Git and release procedure

1. Inspect branch, status, and upstream.
2. Inspect the complete diff, including untracked files.
3. Run verification proportional to the change.
4. Recheck status after verification.
5. Stage only authorized scope.
6. Review the staged diff with `git diff --cached`.
7. Commit with a message describing the generalized behavior, not one affected
   screenshot.
8. Push the current branch only when explicitly requested.
9. Verify remote SHA.
10. Monitor deployment only when requested or necessary to satisfy “deploy.”

If the user explicitly requests `git add *`, execute that intent within the
current directory, but still review what it stages and disclose unexpected
files. PowerShell wildcard behavior does not stage deleted dotfiles the same way
as `git add -A`; never silently substitute broader semantics without checking.

## 13. Performance and determinism

Current performance choices:

- build-time KaTeX and Shiki eliminate browser math/highlighter runtimes;
- Shiki loading and compilation caching avoid repeated expensive setup;
- structural search extraction avoids full article rendering;
- responsive image generation caches by source content and transform settings;
- article links avoid indiscriminate prefetch of large payloads;
- stable lexical ordering and collision checks make corpus output predictable;
- `NEXT_BUILD_ID` may pin Next’s normally random ID for determinism checks.

Historical measurements in the former README recorded improvements such as
roughly 55 seconds to 0.35 seconds for an unchanged image pass, 55 seconds to 30
seconds for a cold image pass, 16.7 seconds to 6.9 seconds for sequential article
compilation, and 17.1 seconds to 7.2 seconds for the structural search path.
Those numbers came from an earlier corpus and machine state. They document why
the optimizations exist; they are not current budgets or guaranteed results.
Rebenchmark on the current corpus before quoting performance.

Avoid unbounded quadratic work over documents, headings, links, or search
records. Prefer maps/sets and a linear scan over repeated whole-corpus searches.
For a proposed optimization, include corpus size, cold/warm state, command,
hardware context, and before/after measurements.

## 14. Known limitations and debt

The following are facts, not hidden defects:

- The corpus compatibility layer necessarily uses heuristics because upstream
  source conversions are inconsistent. Regression coverage reduces risk but
  cannot prove every future document shape.
- There is no browser E2E suite or automated screenshot regression gate in the
  current command pipeline.
- Accessibility audits are partly structural; automated output checks do not
  replace keyboard, screen-reader, zoom, and contrast verification.
- The lint script is stale for the installed Next.js version.
- The implementation is a single application rather than the modular compiler
  monorepo proposed by the original blueprint.
- Restricted MDX, arbitrary interactive article directives, full author/series
  systems, rich citation graphs, and media pipelines described in the original
  plan are not all implemented.
- Search is a static local index, not a server-backed ranking system.
- Production is static export; authenticated content, per-user annotations,
  server previews, and live data require a separate architecture.
- Sparse or damaged source metadata forces derivation. Derived values must be
  labeled honestly.
- Build success proves the implemented gates, not visual perfection on every
  browser or semantic correctness of every possible new equation.
- `README.md` is intentionally concise. Detailed engineering and agent behavior
  belongs here; the long-term target architecture belongs in `plan.md`.

Do not solve these limitations opportunistically unless they are in scope. Do
not describe them as implemented roadmap items.

## 15. Safe implementation workflow

1. Read this file, `package.json`, the relevant source, tests, and current git
   status.
2. Reproduce or locate the failure at the earliest observable pipeline stage.
3. Classify it as discovery, preprocessing, AST compilation, rendering, CSS,
   export URL, audit, deployment, or source-content behavior.
4. Write the smallest generalized invariant that distinguishes valid input from
   the broken class.
5. Add a regression fixture plus a nearby counterexample that must remain
   unchanged.
6. Implement in shared code without article identity knowledge.
7. Run focused tests, then corpus-wide tests and a fresh production build.
8. Inspect semantic HTML or a rendered page for the original and counterexample
   cases.
9. Review all generated and source diffs.
10. Commit, push, and deploy only to the extent explicitly requested.

When the failure cannot be generalized safely, stop and state the ambiguity.
Do not guess at author intent in a way that silently rewrites the corpus.

## 16. Definition of done

A change is complete only when all applicable statements are true:

- The root cause is identified at the correct pipeline layer.
- The implementation is independent of a specific article identity.
- Valid existing Markdown/TeX behavior is preserved.
- A regression test covers the defect and a counterexample covers overreach.
- Complexity is bounded for user-controlled corpus size.
- Typecheck and relevant tests pass.
- A fresh production build passes when exported output is affected.
- Math and HTML audits inspect the fresh export.
- Responsive, accessible, base-path, and no-JavaScript behavior remain correct
  where relevant.
- The working tree contains no accidental edits or generated churn.
- Documentation reflects architecture changes without turning goals into facts.
- Commit, push, workflow, and live deployment states are reported separately and
  accurately.

## 17. Environment variables

| Variable | Purpose | Local default |
|---|---|---|
| `NEXT_PUBLIC_BASE_PATH` | Prefix for GitHub Pages project-site routing and raw generated URLs. | Empty |
| `NEXT_PUBLIC_SITE_URL` | Public origin used for canonical URLs, sitemap, feeds, and structured metadata. | Repository-defined fallback |
| `NEXT_BUILD_ID` | Optional deterministic Next build ID used by reproducibility checks. | Next-generated ID |

Normalize a base path to either an empty string or one leading-slash prefix with
no trailing slash. Never embed a repository name or deployment origin directly
in components when the shared URL helpers can derive it.

## 18. Final truth

Neural Atlas is already a capable static research publication, but its hardest
problem is adversarial content normalization: new documents can reveal syntax
combinations that previous fixtures did not contain. Reliability comes from
bounded parsing rules, generalized regression tests, strict fresh-output audits,
and honest release verification. It does not come from editing the article until
one screenshot looks correct.
