# Neural Atlas AI Research Publication Platform — `plan.md`

**Document type:** UI/UX and frontend implementation blueprint  
**Audience:** UI/UX designers, design-system engineers, frontend engineers, content-compiler engineers, QA engineers, and technical editors  
**Status:** Living roadmap; a production static subset is implemented and the remaining requirements are targets
**Default delivery model:** Next.js static export to GitHub Pages; no production application server
**Primary source format:** Arbitrarily nested Markdown (`.md`); restricted MDX is a future capability
**Primary framework:** Next.js App Router + React + TypeScript  
**Quality level:** Research-laboratory publication system, not a generic blog theme

---

## 0. Executive mandate

### 0.1 How to read this plan

This document defines the product direction and the intended quality ceiling. It
is not evidence that every requirement below is implemented. The current code,
tests, workflow, and [`AGENTS.md`](./AGENTS.md) are the authority for shipped
behavior. Requirements in later sections remain roadmap items unless the status
snapshot below marks them implemented or the repository proves otherwise.

This distinction is deliberate. The earlier version of this plan mixed desired
architecture, future commands, and acceptance criteria with current behavior.
That made unimplemented systems appear complete. From this revision onward:

- **Implemented** means executable code exists and is covered by the current
  verification pipeline.
- **Partial** means a useful subset exists but the full requirement does not.
- **Planned** means the requirement is retained as a target only.
- **Deferred** means the feature is intentionally outside the current static
  product scope.

No roadmap item may be reported as shipped without code and verification.

### 0.2 Current implementation snapshot

| Capability | Status | Current truth |
|---|---|---|
| Recursive corpus discovery | Implemented | Markdown is discovered recursively under `docs/`; normal articles need no route registry edit. |
| Deterministic routes | Implemented | Corpus-derived routes are stable and collision checked. |
| Static article rendering | Implemented | Next.js exports complete article HTML to `out/`. |
| Markdown support | Implemented | Unified/remark/rehype pipeline with GFM and repository-specific normalization. |
| Restricted MDX | Planned | `.mdx` is not an enabled authoring contract. |
| Mathematics | Implemented with compatibility risk | KaTeX renders at build time; preprocessing repairs bounded conversion scars; postbuild audits catch parse errors, corruption signatures, and leaked raw TeX. |
| Code highlighting | Implemented | Shiki renders syntax highlighting at build time. |
| Responsive images | Implemented | A prebuild script generates static variants with cache-aware reuse; Next runtime optimization is disabled. |
| Static search | Implemented | A generated local index and client search UI are available without a search server. |
| Article outline | Implemented | Compiled headings produce on-page navigation. |
| Feed, sitemap, robots, metadata | Implemented | Static endpoints and structured metadata are generated. |
| Base-path deployment | Implemented | Shared URL helpers and export audits support GitHub Pages project paths. |
| Theme and reading enhancements | Implemented | Light/dark theme, reading progress, search dialog, and related client enhancements exist. |
| Server rendering profile | Deferred | Production is a static export. |
| Authenticated/private content | Deferred | There is no authentication or application server. |
| Per-user annotations | Deferred | No user data store exists. |
| Full author and series system | Planned | Do not assume the target route model is available. |
| Rich citation graph/BibTeX pipeline | Planned | Source-token cleanup exists, but the full scholarly citation system does not. |
| General diagram compiler | Planned | No complete Mermaid/Graphviz build pipeline is guaranteed. |
| Restricted interactive article registry | Partial | Application-level client components exist; the full allowlisted content-directive system is not complete. |
| Browser E2E tests | Planned | The current automated suite is Node-based and export-audit based. |
| Automated visual regression | Planned | Visual inspection is currently manual. |
| Automated accessibility browser suite | Planned | Structural export checks exist; Playwright/Axe coverage is not yet a release gate. |
| Modern lint gate | Blocked by configuration debt | The current `next lint` script is stale for the installed Next version and is not a valid release signal. |
| Determinism verification | Implemented | A dedicated script pins the build ID and compares repeatable output. |
| GitHub Pages deployment | Implemented | Pushes to `main` typecheck, test, build, audit, upload, and deploy. |

### 0.3 Current production architecture

```text
docs/**/*.md
    ↓
recursive corpus discovery and route compilation
    ↓
bounded Markdown/TeX preprocessing
    ↓
remark/rehype compilation + build-time KaTeX and Shiki
    ↓
React Server Component page rendering
    ↓
Next.js static export in out/
    ↓
strict math verification + exported-HTML audit
    ↓
GitHub Pages artifact deployment
```

Search indexing intentionally uses a structural extraction path instead of the
full expensive article renderer. Images are optimized before the Next build.
Development compiler state lives in `.next-dev`; production build state lives in
`.next`. This separation prevents the old dev/build manifest race, although
concurrent operations can still compete for CPU, memory, generated images, and
the export directory.

### 0.4 Current quality gates

The executable local gate is:

```bash
npm run verify
```

It runs:

1. `npm run typecheck`;
2. `npm test`;
3. `npm run build`, whose lifecycle includes image preprocessing, static export,
   math verification, and exported-HTML audit.

The Pages workflow uses Node.js 22 and `npm ci`, then repeats typecheck, tests,
and the complete build under the repository base path. Deployment cannot start
unless the build job succeeds.

The current gates prove only what they inspect. They do not replace browser E2E,
screen-reader, 200% zoom, cross-browser, or visual-regression testing. A locally
successful build also does not prove that a commit was pushed or deployed.

### 0.5 Current content-normalization policy

New documents sometimes expose equations or paragraph alignment incorrectly
because the corpus contains multiple delimiter conventions and lossy conversion
scars. The production rule is:

1. Do not edit an article merely to make the renderer accept it unless editorial
   change is explicitly requested.
2. Diagnose whether the defect belongs to source-token cleanup, preprocessing,
   AST compilation, KaTeX, renderer markup, CSS, base-path handling, or export.
3. Implement a shared syntax- or structure-based rule.
4. Bound ambiguous matches at blank lines, headings, fences, balanced groups, or
   another explicit grammar boundary.
5. Add the failing shape and a valid counterexample to the regression suite.
6. Run the corpus-wide tests and a fresh build so both math and HTML audits see
   the new output.

Article names, paths, titles, section numbers, and exact prose are forbidden as
dispatch keys for rendering repairs. The goal is not to make one screenshot pass;
the goal is to extend the accepted input grammar without damaging valid input.

### 0.6 Current repository shape

The implemented repository is a single application:

```text
app/                 routes, endpoints, global styles
components/          publication UI and client enhancements
lib/content/         corpus discovery, preprocessing, compilation
lib/search/          local search behavior
docs/                canonical Markdown corpus
public/              static and generated media assets
scripts/             development, optimization, and verification tools
tests/               unit, regression, corpus, and hostile fixtures
.github/workflows/   GitHub Pages deployment
```

The multi-package `apps/` and `packages/` layout described later is a target
architecture, not the present filesystem. A migration should occur only when
module boundaries, independent testing, or build scaling justify the cost.

### 0.7 Near-term priorities

Priorities are ordered by publication risk rather than novelty:

1. Continue replacing intermittent content-specific failures with bounded,
   generalized parser rules and hostile fixtures.
2. Add browser-level E2E coverage for representative articles, fragments,
   search, theme, mobile navigation, and no-JavaScript reading.
3. Add automated visual regression for long equations, tables, code, provenance
   markers, side rails, narrow layouts, zoom, dark mode, and print.
4. Repair the lint command with a supported ESLint configuration and make it a
   real CI gate.
5. Add automated accessibility checks, then document required manual assistive
   technology verification.
6. Publish measured bundle, build-time, memory, and Web Vitals budgets using the
   current corpus; do not reuse historical measurements as targets.
7. Expand citation, author, series, diagram, and media systems only after the
   core compiler and regression harness are stable.

### 0.8 Explicit non-goals for the current release

- Introducing a backend solely because Next.js can run one.
- Moving canonical articles into a proprietary CMS or database.
- Shipping a client-side Markdown, TeX, or syntax-highlighting runtime.
- Executing arbitrary JSX or JavaScript from documents.
- Adding article-specific parsing exceptions.
- Copying a reference laboratory’s brand identity.
- Treating decorative motion, cards, or dashboards as product progress.
- Claiming “lossless arbitrary Markdown” before the preservation model and
  unsupported-syntax representation in this roadmap are fully implemented.

Build a production-grade AI research and engineering publication platform that converts an arbitrary recursively structured Markdown corpus into a deterministic, lossless, accessible, high-performance, interactive website.

The publication experience should synthesize the strongest characteristics of leading research-lab websites:

- **Kimi Research:** compact model/research indexing, direct artifact linkage, high information density.
- **Google DeepMind:** clear hierarchy, disciplined visual storytelling, large technical media, strong category navigation.
- **Anthropic Research and Engineering:** long-form readability, restrained visual system, evidence-oriented structure, explicit research-program organization.
- **OpenAI Research and Engineering:** clean editorial pages, clear separation between research, engineering, safety, releases, and product material.

These references define a quality bar, not a cloning target. Do not copy proprietary typography, icons, illustrations, layouts, interaction signatures, or brand assets. Build an original Neural Atlas design system from open, licensable components.

The system must preserve source semantics while progressively enhancing the rendered publication. A user must be able to read every article, equation, table, code block, citation, and essential figure without client-side JavaScript.

---

# 1. Product objective

## 1.1 Required outcome

A researcher writes articles inside one or more folders using Markdown. The build system automatically:

1. Discovers Markdown documents and associated assets recursively.
2. Preserves the original source bytes and source-level structure.
3. Parses the content into a typed intermediate representation.
4. Validates metadata, links, citations, headings, equations, code, diagrams, and assets.
5. Constructs deterministic routes and navigation.
6. Renders the corpus into a professional research website.
7. Adds optional interactive behavior through explicitly declared, lazy-loaded components.
8. Produces static HTML, typed manifests, search indexes, diagnostics, and preservation reports.
9. Deploys the result through a CDN or equivalent static/edge delivery layer.
10. Rejects lossy, ambiguous, inaccessible, insecure, or nondeterministic output.

## 1.2 Non-goals

The platform is not:

- A visual page builder.
- A CMS that stores canonical content in a proprietary database.
- A client-side Markdown renderer.
- A generic documentation template.
- A marketing landing-page generator.
- A system that requires authors to understand React.
- A runtime that executes arbitrary JSX or JavaScript from untrusted content.
- A renderer that silently converts unsupported syntax into plain text.
- A site that uses cards, animations, gradients, or metrics without informational purpose.

---

# 2. Architectural decision

## 2.1 Selected stack

| Layer | Selected implementation | Reason |
|---|---|---|
| Application framework | Next.js App Router | Static generation, React Server Components, route metadata, streaming where required, mature deployment support |
| Language | TypeScript with `strict: true` | Typed content contracts and predictable component APIs |
| UI runtime | React Server Components by default | Minimizes browser JavaScript and hydration |
| Styling | CSS custom properties + CSS Modules or typed vanilla CSS | Stable tokens, small runtime, explicit component boundaries |
| Content parsing | Unified / remark / rehype ecosystem with explicit adapters | Typed syntax-tree pipeline and extensibility |
| Markdown | CommonMark + configurable GFM extensions | Predictable baseline with optional capability matrix |
| MDX | Disabled by default; restricted and allowlisted when enabled | Interactivity without arbitrary execution |
| Mathematics | KaTeX rendered at build time with MathML/HTML output | Fast static rendering, accessible fallback, no article-level math hydration |
| Code highlighting | Shiki at build time | Accurate highlighting with zero client-side highlighter runtime |
| Diagrams | Build-time SVG where possible; isolated lazy renderer otherwise | Preserves performance and security |
| Search | Provider abstraction; static local index by default | Fast, deployable without an application server |
| Validation | Runtime schemas + AST validators + build gates | Fails invalid content before publication |
| Testing | Unit, integration, Playwright E2E, accessibility, visual regression | Verifies compiler and presentation invariants |
| Deployment | Static CDN-first; server mode only for justified dynamic features | Lowest latency, cost, and browser work |

## 2.2 Framework mode

Use the Next.js App Router and React Server Components as the default rendering model.

```text
Markdown corpus
    ↓
standalone content compiler
    ↓
versioned typed artifacts
    ↓
Next.js Server Components
    ↓
static HTML + minimal RSC payload
    ↓
optional lazy client islands
```

The content compiler must not import Next.js, React, DOM APIs, browser APIs, or deployment-provider APIs. Framework-specific rendering consumes compiler artifacts through a stable interface.

## 2.3 Static-first policy

Default every public article, listing page, author page, topic page, and report page to prerendered output.

Use runtime rendering only when one of the following is proven necessary:

- Authenticated private content.
- Per-user annotations.
- Server-authorized previews.
- Non-static search provider.
- Rapid publication requiring incremental regeneration.
- Live data that cannot be represented as a versioned snapshot.

Runtime rendering must not be selected merely because the framework supports it.

---

# 3. Governing invariants

## 3.1 Source fidelity

Preserve:

- Original bytes and encoding.
- Original path and relative path.
- Newline convention.
- Front-matter source, order, and unknown fields.
- Markdown block and inline order.
- Heading text and explicit identifiers.
- Code fence delimiter, info string, indentation, and exact code.
- Mathematical source.
- Diagram source.
- Raw HTML and comments.
- Link source and reference identifiers.
- Footnote and citation identifiers.
- Media paths and attributes.
- Unsupported syntax as typed opaque nodes.
- Source positions for every parseable node.

## 3.2 Determinism

For identical source bytes, configuration, dependency versions, and build environment, the content-addressed output must be identical.

Do not use:

- Random IDs.
- Filesystem traversal order.
- Locale-dependent implicit sorting.
- Current timestamps inside content hashes.
- Network-fetched metadata during deterministic builds.
- Unpinned parser behavior.
- Array positions as stable identifiers.
- Last-write-wins conflict resolution.

## 3.3 Progressive enhancement

The following must work before JavaScript executes:

- Article reading.
- Heading navigation.
- Links and citations.
- Images and captions.
- Code and copyable source text.
- Equations and their original TeX source.
- Tables.
- Audio and video controls.
- Previous/next navigation.
- Search fallback route, when local client search is unavailable.

JavaScript may enhance, but never define, essential content.

## 3.4 Failure visibility

The build must fail on:

- Data loss.
- Route collisions.
- Duplicate explicit heading IDs.
- Broken required internal links.
- Missing required assets.
- Invalid metadata.
- Cyclic navigation.
- Unsafe executable content.
- Unsupported lossy transformations.
- Accessibility blockers.
- Nondeterministic output.
- Bundle or performance budget violations.
- Invalid generated manifests.

---

# 4. Content-source model

## 4.1 Generalized corpus discovery

The compiler must support:

- One or more configurable content roots.
- Arbitrary recursive folder depth.
- Flat or hierarchical corpora.
- Multiple publications or volumes.
- Configurable include/exclude patterns.
- Configurable hidden-file and symbolic-link policy.
- Markdown and asset extension registries.
- Cross-platform path normalization.
- Stable lexical discovery ordering.
- Incremental change detection.
- Content hashing.

No fixed folder convention is mandatory.

## 4.2 Recommended authoring convention

The following convention is recommended for maintainability but must remain optional:

```text
content/
├── research/
│   └── kimi-k3-architecture/
│       ├── index.md
│       ├── references.bib
│       └── assets/
│           ├── architecture.svg
│           ├── benchmark.avif
│           └── demo.mp4
├── engineering/
│   └── paged-attention/
│       ├── article.md
│       └── assets/
└── reports/
    └── model-report/
        └── report.md
```

The compiler may also ingest:

```text
content/chapter-01.md
content/a/b/c/topic.md
external-volume/**/*.md
```

Filesystem hierarchy is evidence, not unquestioned publication semantics.

## 4.3 Front-matter contract

Use a versioned schema. Only `title` and publication status are hard requirements after configured derivation.

```yaml
---
schemaVersion: "1.0"
title: "Kimi K3 Architecture: End-to-End Systems Analysis"
description: "Mechanism-level analysis of architecture, training, inference, and agentic execution."
articleType: "model-report"
status: "published"

publishedAt: "2026-07-20"
updatedAt: "2026-07-20"
authors:
  - id: "hemanth"
topics:
  - model-architecture
  - long-context
  - agentic-systems

hero:
  src: "./assets/architecture.svg"
  alt: "Kimi K3 architecture and data-flow overview"
  width: 1920
  height: 1080

toc:
  enabled: true
  minDepth: 2
  maxDepth: 4

math:
  enabled: true
  macros:
    "\\E": "\\mathbb{E}"

code:
  defaultTheme: "neural-atlas"
  lineNumbers: false

canonicalUrl: null
draft: false
---
```

## 4.4 Metadata origin

Every effective metadata value must retain origin:

```ts
type ValueOrigin =
  | "source"
  | "configuration"
  | "derived"
  | "defaulted"
  | "generated";
```

Do not overwrite authored metadata with generated values. Store source, configured, derived, and effective records separately.

## 4.5 Article types

```ts
type ArticleType =
  | "research-explainer"
  | "engineering-deep-dive"
  | "model-report"
  | "benchmark-report"
  | "reproduction-study"
  | "system-design"
  | "survey"
  | "release-note"
  | "technical-opinion";
```

Article type controls presentation metadata and optional structural validation. It must not silently reorder article content.

---

# 5. Compilation pipeline

## 5.1 End-to-end flow

```text
content roots
    ↓
recursive discovery
    ↓
byte-preserving source registry
    ↓
parser selection
    ↓
typed Markdown / MDX AST
    ↓
front-matter and metadata extraction
    ↓
syntax capability validation
    ↓
typed intermediate representation
    ↓
heading, link, citation, equation, code, diagram, and asset indexes
    ↓
content graph construction
    ↓
route and navigation compilation
    ↓
source-aware transformation pipeline
    ↓
build-time math / code / diagram rendering
    ↓
preservation and security validation
    ↓
search-index compilation
    ↓
versioned build artifacts
    ↓
Next.js rendering
    ↓
HTML, CSS, RSC payload, media manifests, and optional client islands
```

## 5.2 Compiler phases

Each phase must be independently testable:

1. `discover`
2. `registerSources`
3. `selectParser`
4. `parse`
5. `extractMetadata`
6. `normalizeWithoutLoss`
7. `compileDocumentIR`
8. `compileContentGraph`
9. `compileRoutes`
10. `resolveLinks`
11. `resolveCitations`
12. `resolveAssets`
13. `renderMath`
14. `highlightCode`
15. `renderDiagrams`
16. `compileSearch`
17. `validate`
18. `emitArtifacts`
19. `renderApplication`
20. `verifyOutput`

## 5.3 Intermediate representation

```ts
interface CompiledDocument {
  irVersion: string;
  documentId: string;
  source: SourceRecordReference;
  metadata: MetadataRecord;
  root: DocumentNode;

  headings: HeadingRecord[];
  paragraphs: ParagraphRecord[];
  links: LinkRecord[];
  assets: AssetReference[];
  citations: CitationRecord[];
  footnotes: FootnoteRecord[];
  tables: TableRecord[];
  codeBlocks: CodeBlockRecord[];
  equations: EquationRecord[];
  algorithms: AlgorithmRecord[];
  diagrams: DiagramRecord[];
  media: MediaRecord[];
  interactiveNodes: InteractiveNodeRecord[];

  diagnostics: Diagnostic[];
  provenance: ProvenanceRecord[];
}
```

Unknown syntax must remain representable.

## 5.4 Transformation policy

Every transformation records:

- Transform ID and version.
- Input and output node IDs.
- Mutation type.
- Justification.
- Reversibility.
- Source spans.
- Validation result.

```ts
type MutationType =
  | "preserve"
  | "annotate"
  | "normalize"
  | "rewrite"
  | "expand"
  | "remove";
```

`remove` is disabled by default and treated as a fatal violation unless explicitly authorized.

---

# 6. Information architecture

## 6.1 Primary navigation

Use a shallow, stable global navigation:

```text
Research
Engineering
Reports
Topics
About
Search
```

Do not place every topic in the global header.

## 6.2 Route model

```text
/
├── /research
├── /engineering
├── /reports
├── /topics
│   └── /topics/[topic]
├── /authors
│   └── /authors/[author]
├── /series
│   └── /series/[series]
├── /search
└── /[section]/[slug]
```

Routes must be deterministic pure functions of document identity, configured hierarchy, metadata, and route policy.

## 6.3 Home page

The home page is editorial, not dashboard-like.

Required order:

1. Compact global header.
2. One primary featured article.
3. Latest research.
4. Latest engineering.
5. Selected reports.
6. Topic index.
7. Minimal publication statement.
8. Footer.

Do not include:

- Decorative metrics.
- Artificial activity feeds.
- Unnecessary testimonials.
- Carousel autoplay.
- More than one dominant hero.
- Repeated card containers around every item.

## 6.4 Section index pages

Each section page includes:

- Section title and one-sentence scope.
- Optional featured article.
- Filter controls only when the corpus justifies them.
- Chronological article list.
- Topic and article-type filters.
- Stable pagination or incremental static pages.
- Accessible no-JavaScript filter fallback where practical.

Prefer editorial rows with borders over floating cards.

## 6.5 Article page anatomy

```text
global header
article breadcrumb or section label
title
technical deck / abstract
publication metadata
authors
artifact links
hero figure or media
article body
references
version history
related articles
previous / next navigation
footer
```

Desktop may add a non-semantic visual rail:

```text
[left optional context] [main article] [right outline]
```

The DOM order remains:

```text
header → article → supporting navigation → footer
```

Visual columns must not damage keyboard or screen-reader order.

---

# 7. Design system

## 7.1 Design principles

1. Information before decoration.
2. Typography is the primary interface.
3. Whitespace encodes hierarchy.
4. Borders separate; shadows are exceptional.
5. Cards group functional units, not arbitrary text.
6. Motion communicates state, not personality.
7. Media earns visual width through technical value.
8. One accent color is sufficient.
9. The reading column remains stable across articles.
10. Every visual token has light and dark semantic equivalents.

## 7.2 Color system

Use semantic tokens rather than direct component colors.

### Light mode

```css
:root {
  --color-canvas: #FCFCF9;
  --color-surface: #FFFFFF;
  --color-surface-subtle: #F5F5F0;
  --color-text: #151515;
  --color-text-secondary: #575752;
  --color-text-tertiary: #777771;
  --color-border: #D9D9D2;
  --color-border-strong: #B9B9B1;

  --color-accent: #315EF5;
  --color-accent-hover: #2448C9;
  --color-accent-soft: #EAEFFF;
  --color-accent-contrast: #FFFFFF;

  --color-success: #18794E;
  --color-warning: #9A6700;
  --color-danger: #C9372C;
  --color-code-bg: #F3F3EF;
}
```

### Dark mode

```css
[data-theme="dark"] {
  --color-canvas: #111210;
  --color-surface: #171815;
  --color-surface-subtle: #1D1E1A;
  --color-text: #F3F3EE;
  --color-text-secondary: #C2C2BA;
  --color-text-tertiary: #98988F;
  --color-border: #34352F;
  --color-border-strong: #505149;

  --color-accent: #8AA4FF;
  --color-accent-hover: #A9BAFF;
  --color-accent-soft: #202B52;
  --color-accent-contrast: #0E1325;

  --color-code-bg: #191A17;
}
```

### Color constraints

- Body text contrast must meet WCAG 2.2 AA.
- Accent is reserved for links, active states, focus, and essential diagrams.
- Do not place body paragraphs in muted gray.
- Do not use gradients for generic cards or section backgrounds.
- Status colors must always include text or icon semantics.
- Technical figures may define their own accessible categorical palette.

## 7.3 Typography families

Use open-source fonts that can be self-hosted and subset.

| Role | Font | Fallback |
|---|---|---|
| UI, metadata, navigation, headings | `Inter Variable` | `ui-sans-serif, system-ui, sans-serif` |
| Long-form article body | `Source Serif 4 Variable` | `ui-serif, Georgia, serif` |
| Code, algorithm lines, identifiers | `IBM Plex Mono` | `ui-monospace, SFMono-Regular, Consolas, monospace` |
| Mathematical notation | KaTeX fonts / MathML fallback | browser math stack |

Do not attempt to copy proprietary fonts used by reference organizations.

### Font loading

- Self-host WOFF2.
- Create required language subsets.
- Preload only the primary UI regular subset and body regular subset.
- Use `font-display: swap` or `optional` based on measured layout stability.
- Define accurate fallback metrics through `size-adjust`, `ascent-override`, `descent-override`, and `line-gap-override`.
- Avoid more than three initially requested font files.
- Load mono font only when a page contains code or algorithms.

## 7.4 Type scale

```css
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-reader: 1.125rem; /* 18px desktop */
--text-lg: 1.25rem;      /* 20px */
--text-xl: 1.5rem;       /* 24px */
--text-2xl: 2rem;        /* 32px */
--text-3xl: 2.75rem;     /* 44px */
--text-4xl: 4rem;        /* 64px */
```

Use fluid title sizes:

```css
.article-title {
  font-size: clamp(2.4rem, 5vw, 4.5rem);
  line-height: 0.98;
  letter-spacing: -0.035em;
}
```

Article-body defaults:

```css
.article-body {
  font-family: var(--font-reader);
  font-size: clamp(1.0625rem, 0.98rem + 0.25vw, 1.125rem);
  line-height: 1.72;
  letter-spacing: -0.006em;
}
```

## 7.5 Fixed paragraph length requirement

“Fixed paragraph length” must be implemented as a controlled typographic measure, not a fixed number of words, lines, pixels, or a fixed-height box.

Required rule:

```css
.article-prose {
  inline-size: min(100%, 72ch);
  margin-inline: auto;
}
```

Permitted range:

```text
68ch ≤ paragraph measure ≤ 74ch
```

Constraints:

- Do not inject manual line breaks into prose.
- Do not truncate or clamp article paragraphs.
- Do not set fixed paragraph heights.
- Do not justify text.
- Do not widen text merely because the viewport is large.
- Preserve authored paragraph boundaries.
- Let inline code, citations, and URLs wrap safely.
- Use `overflow-wrap: anywhere` only for pathological unbroken tokens.
- Use nonbreaking behavior only where semantic, such as units or equation labels.

This produces visually consistent paragraph width while remaining responsive and accessible.

## 7.6 Heading scale and spacing

```css
.article-body h2 {
  margin-block: 4.5rem 1.25rem;
  font-family: var(--font-ui);
  font-size: clamp(1.75rem, 1.5rem + 0.8vw, 2.25rem);
  line-height: 1.12;
  letter-spacing: -0.025em;
}

.article-body h3 {
  margin-block: 3rem 0.875rem;
  font-family: var(--font-ui);
  font-size: clamp(1.35rem, 1.2rem + 0.45vw, 1.65rem);
  line-height: 1.2;
}
```

Rules:

- A heading must remain visually attached to the following content.
- Avoid a heading at the bottom of a viewport followed by no body content where browser fragmentation rules apply.
- Do not use more than one `h1`.
- Heading levels reflect semantics, not desired size.
- Heading anchors must not obscure the title under sticky navigation.

## 7.7 Spacing scale

Use an 8px-derived scale with limited 4px exceptions:

```css
--space-1: 0.25rem;  /* 4 */
--space-2: 0.5rem;   /* 8 */
--space-3: 0.75rem;  /* 12 */
--space-4: 1rem;     /* 16 */
--space-5: 1.5rem;   /* 24 */
--space-6: 2rem;     /* 32 */
--space-7: 3rem;     /* 48 */
--space-8: 4rem;     /* 64 */
--space-9: 6rem;     /* 96 */
--space-10: 8rem;    /* 128 */
```

Article rhythm:

| Relationship | Spacing |
|---|---:|
| Paragraph → paragraph | `1.25em` |
| Paragraph → list | `1.25em` |
| List item → list item | `0.5em` |
| Heading 2 → previous block | `4.5rem` |
| Heading 2 → next block | `1.25rem` |
| Heading 3 → previous block | `3rem` |
| Figure → caption | `0.75rem` |
| Figure group → surrounding prose | `2.5rem` |
| Code block → surrounding prose | `2rem` |
| Section → section | `5–7rem`, responsive |

## 7.8 Radius, borders, and shadows

```css
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 16px;
```

- Article containers have no outer card.
- Standard cards use a 1px border and no shadow.
- Floating overlays may use a restrained shadow.
- Code blocks, callouts, interactive panels, and media controls may use `--radius-md`.
- Do not place rounded containers around ordinary paragraphs.
- Avoid pill-shaped containers except compact tags and status labels.

---

# 8. Responsive layout

## 8.1 Breakpoints

Use content-driven breakpoints:

```css
--bp-sm: 40rem;   /* 640px */
--bp-md: 48rem;   /* 768px */
--bp-lg: 64rem;   /* 1024px */
--bp-xl: 75rem;   /* 1200px */
--bp-2xl: 90rem;  /* 1440px */
```

Do not design only against named devices.

## 8.2 Shell dimensions

```css
--shell-max: 90rem;       /* 1440px */
--reader-max: 72ch;
--wide-content-max: 72rem; /* 1152px */
--side-rail: 15rem;       /* 240px */
--page-gutter: clamp(1rem, 3vw, 3rem);
```

## 8.3 Article grid

Desktop:

```css
.article-layout {
  display: grid;
  grid-template-columns:
    minmax(0, 1fr)
    minmax(0, 72ch)
    minmax(12rem, 15rem);
  column-gap: clamp(2rem, 4vw, 5rem);
}
```

Use the first column as flexible visual balance or optional context. Do not insert empty semantic elements merely to occupy it.

At narrower widths:

- `< 1200px`: remove left context rail.
- `< 1024px`: move table of contents into an expandable block before article body.
- `< 768px`: single-column layout.
- `< 480px`: reduce title scale and gutters; preserve at least 16px edge space.

## 8.4 Wide-content breakout

Tables, diagrams, benchmark plots, and architecture figures may exceed the prose column.

```css
.article-wide {
  inline-size: min(var(--wide-content-max), calc(100vw - 2 * var(--page-gutter)));
  margin-inline: 50%;
  transform: translateX(-50%);
}
```

Do not widen ordinary paragraphs.

## 8.5 Orientation behavior

Landscape tablets must not inherit desktop rails if the remaining reader measure is below 60ch.

Use container queries for local component adaptation where possible.

---

# 9. Component architecture

## 9.1 Component layers

```text
tokens/
primitives/
content-renderers/
publication-components/
interactive-islands/
page-layouts/
```

### Tokens

Colors, typography, spacing, radii, motion, elevations, and layout constants.

### Primitives

`Text`, `Link`, `Button`, `IconButton`, `Divider`, `Stack`, `Cluster`, `VisuallyHidden`, `FocusRing`.

### Content renderers

Typed renderers for Markdown/IR nodes.

### Publication components

Article header, metadata, author list, citation list, topic list, related articles, previous/next navigation.

### Interactive islands

Search, expandable diagrams, data explorers, copy controls, optional annotations.

### Page layouts

Home, section index, article, report, author, topic, search, and error pages.

## 9.2 Renderer registry

```ts
interface NodeRenderer<TNode extends DocumentNode> {
  nodeType: TNode["type"];
  render(
    node: TNode,
    context: RenderContext
  ): React.ReactNode;
}
```

Every supported node type must have:

- A renderer.
- A source-preserving fallback.
- Accessibility behavior.
- Print behavior.
- Visual regression fixture.
- Error boundary policy if interactive.

## 9.3 Client component policy

A component may use `"use client"` only when it needs:

- Local state.
- Event handlers.
- Browser APIs.
- Mutable visualization state.
- Client-side search.
- Media playback orchestration.
- User preference controls.

Do not mark page layouts or complete articles as client components.

---

# 10. Markdown rendering contract

## 10.1 Baseline syntax

Support through a configurable capability matrix:

- CommonMark.
- GitHub-Flavored Markdown.
- YAML, TOML, or JSON front matter.
- Paragraphs.
- Heading levels 1–6.
- Ordered and unordered lists.
- Nested lists.
- Task lists.
- Blockquotes.
- Inline code.
- Fenced and indented code.
- Tables.
- Autolinks.
- Reference-style links.
- Footnotes.
- Raw HTML under trust policy.
- Inline and display mathematics.
- Explicit heading IDs.
- Definitions and abbreviations.
- Admonitions.
- Tabs.
- Details/disclosure blocks.
- Mermaid and other diagram fences.
- Citation syntax.
- Custom directives.
- Restricted MDX components when enabled.

Unknown syntax must be preserved as a raw node and surfaced in diagnostics.

## 10.2 Paragraph renderer

Requirements:

- Preserve authored paragraph boundaries.
- Apply the fixed reader measure.
- Avoid orphan-prone manual breaks.
- Handle inline code without changing line height excessively.
- Render citations without disturbing word spacing.
- Keep links visually distinct without saturating the paragraph in accent color.
- Use `text-decoration-skip-ink: auto`.
- Expose external-link semantics to assistive technology only when useful; avoid repeated visual noise.

## 10.3 Link behavior

All links must be real anchors with valid `href` values.

Internal links:

- Resolve source-relative Markdown targets before route transformation.
- Validate target document and fragment.
- Use framework navigation where appropriate.
- Preserve open-in-new-tab behavior only when authored or policy-defined.
- Never override modified-click behavior.

External links:

- Do not rewrite the authored URL.
- Add `rel="noopener noreferrer"` when opened in a new browsing context.
- Display an external-link icon only in metadata/action areas, not after every inline citation.
- Validate protocols against an allowlist.
- Record broken links through scheduled validation, not during deterministic offline builds unless snapshots are supplied.

Heading links:

- Generate deterministic, collision-checked IDs.
- Provide a copy-link affordance on hover and keyboard focus.
- Keep the heading itself the anchor target.
- Apply `scroll-margin-top`.

## 10.4 Lists

- Preserve authored numbering.
- Support nested depth without collapsing indentation.
- Use hanging markers.
- Keep list measure aligned with paragraphs.
- Do not convert lists to cards.
- Use semantic `ol`, `ul`, and `li`.
- For procedural lists, permit optional step-number emphasis without changing semantics.

## 10.5 Blockquotes and callouts

Ordinary blockquote:

- Thin left rule.
- No oversized quotation marks.
- Same reading measure.
- Explicit citation footer when supplied.

Callouts are explicit directives, not inferred from arbitrary bold paragraphs.

```md
:::note
This transformation preserves source order.
:::

:::warning
Route collisions fail the build.
:::
```

Allowed kinds:

```ts
type CalloutKind =
  | "note"
  | "important"
  | "warning"
  | "limitation"
  | "observation"
  | "implementation";
```

Use icons and labels; do not rely on color alone.

## 10.6 Footnotes and citations

- Preserve authored identifiers.
- Render backlinks.
- Use deterministic numbering based on document traversal.
- Keep citation source separate from rendered label.
- Support DOI, arXiv, repository, documentation, and dataset links.
- Render references as a semantic ordered list or definition list.
- Permit hover previews only as optional lazy enhancements.
- Keep full references accessible without hover.

---

# 11. Mathematical content

## 11.1 Supported authoring forms

```md
Inline mathematics: $p_\theta(y \mid x)$

Display mathematics:

$$
\mathcal{L}(\theta)
=
-\sum_{t=1}^{T}\log p_\theta(x_t \mid x_{<t})
$$
```

Also support configured delimiters:

```text
\(...\)
\[...\]
```

Avoid ambiguous single-dollar parsing inside currency-heavy documents unless enabled.

## 11.2 Rendering pipeline

```text
TeX source
    ↓
delimiter-aware math AST
    ↓
macro validation
    ↓
KaTeX build-time render
    ↓
HTML + MathML
    ↓
source-preserving equation record
    ↓
static article output
```

No article-wide KaTeX JavaScript should ship to the browser.

## 11.3 Equation record

```ts
interface EquationRecord {
  equationId: string;
  source: string;
  displayMode: "inline" | "block";
  label?: string;
  number?: string;
  sourceSpan: SourceSpan;
  macrosUsed: string[];
  rendered?: MathRenderArtifact;
  diagnostics: Diagnostic[];
}
```

## 11.4 Required equation behavior

- Preserve original TeX.
- Support aligned, gathered, cases, matrices, sums, integrals, tensor notation, and common AMS constructs supported by the selected renderer.
- Validate macros against per-document and global allowlists.
- Prevent global macro leakage between documents.
- Render MathML for accessibility.
- Provide a “copy TeX” action as progressive enhancement.
- Support equation labels and internal references.
- Allow controlled horizontal overflow for genuinely wide equations.
- Do not scale equations below legibility to avoid overflow.
- Display original source in a controlled fallback if rendering fails.
- Do not replace failed equations with an error icon alone.

## 11.5 Equation layout

```css
.equation-block {
  margin-block: 2rem;
  overflow-x: auto;
  overflow-y: hidden;
  padding-block: 0.5rem;
}

.equation-number {
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}
```

Wide equation scrollers must retain keyboard accessibility and visible focus.

---

# 12. Algorithms and pseudocode

## 12.1 Authoring directive

Support scientific pseudocode as a first-class node instead of treating every algorithm as generic source code.

```md
:::algorithm{#alg:decode title="Paged decode scheduling"}
Input: active requests $\mathcal{R}$, free blocks $\mathcal{B}$
Output: scheduled batch $\mathcal{S}$

1. Rank requests by scheduling policy.
2. Reserve logical KV blocks.
3. Map logical blocks through the block table.
4. Execute one decode step.
5. Commit token and cache metadata.
:::
```

## 12.2 Algorithm record

```ts
interface AlgorithmRecord {
  algorithmId: string;
  title?: string;
  label?: string;
  inputs: RichInlineNode[];
  outputs: RichInlineNode[];
  initialization?: RichBlockNode[];
  lines: AlgorithmLine[];
  sourceSpan: SourceSpan;
}
```

## 12.3 Rendering requirements

- Stable line numbering.
- Mathematical rendering inside algorithm lines.
- Optional indentation and branch guides.
- Inputs, outputs, and initialization shown explicitly.
- Copy-source action.
- Print-safe output.
- No runtime code editor.
- No fixed height.
- Controlled horizontal overflow only when required.
- Accessible text order identical to visual order.

---

# 13. Code blocks

## 13.1 Preservation

Store exact source separately from highlighted output.

```ts
interface CodeBlockRecord {
  rawCode: string;
  language?: string;
  infoString?: string;
  filename?: string;
  metadata: Record<string, unknown>;
  sourceSpan: SourceSpan;
  highlightedRepresentation?: HighlightedCode;
}
```

## 13.2 Build-time highlighting

- Use Shiki at build time.
- Initialize and reuse one highlighter instance per build worker.
- Load only languages discovered in the corpus.
- Use a custom light/dark theme derived from semantic tokens.
- Ship highlighted HTML without the highlighter runtime.
- Render unknown languages as unmodified plain code.
- Reject malformed metadata but preserve code.

## 13.3 Code UI

Optional features:

- Language label.
- Filename.
- Copy button.
- Line numbers.
- Highlighted lines.
- Diff markers.
- Collapsible display for very long blocks.
- Download source when explicitly supplied.

Rules:

- Underlying code remains selectable.
- Copy action copies raw code, not line numbers.
- Line wrapping is off by default for source code.
- Mobile uses local horizontal scrolling.
- Scrollbars are visible or discoverable.
- Code is never rendered below 13px.
- A collapsed block must remain fully accessible through a button.
- Do not hydrate a code block solely to display syntax highlighting.

---

# 14. Tables

## 14.1 Semantic rendering

Use:

- `table`
- `caption`
- `thead`
- `tbody`
- `th`
- `td`
- `scope`
- Header associations for complex tables

Preserve:

- Column order.
- Row order.
- Alignment.
- Cell contents.
- Inline Markdown.
- Source spans.

## 14.2 Responsive behavior

Default:

```css
.table-viewport {
  max-inline-size: 100%;
  overflow-x: auto;
  overscroll-behavior-inline: contain;
}

table {
  inline-size: max-content;
  min-inline-size: 100%;
  border-collapse: collapse;
}
```

Rules:

- Do not convert technical tables into cards automatically.
- Do not hide columns on mobile.
- A sticky first column is allowed only when measured useful.
- Sticky headers are allowed only inside bounded long tables.
- Numeric columns align using tabular numerals.
- Header text may wrap.
- Body cells use at least 14px.
- Zebra stripes are optional and subtle.
- Borders must remain visible in high-contrast mode.
- Provide a downloadable CSV only when a structured source is available.

---

# 15. Figures, images, and diagrams

## 15.1 Figure model

```ts
interface FigureRecord {
  figureId: string;
  sourceAssetId: string;
  alt: string;
  caption?: RichInlineNode[];
  label?: string;
  credit?: string;
  width: number;
  height: number;
  variants: AssetVariant[];
  sourceSpan: SourceSpan;
}
```

## 15.2 Image pipeline

For raster images:

- Preserve original.
- Generate AVIF and WebP variants.
- Retain PNG/JPEG fallback when required.
- Generate responsive widths based on observed layout slots.
- Include intrinsic width and height.
- Emit `srcset` and `sizes`.
- Remove unnecessary metadata from generated derivatives only.
- Preserve source color profile or perform explicit documented conversion.
- Never enlarge low-resolution originals.
- Use an LQIP only when it does not increase layout complexity.
- Lazy-load below-the-fold images.
- Prioritize only the actual LCP image.
- Do not preload every hero candidate.

For SVG:

- Preserve original source.
- Sanitize according to trust level.
- Avoid converting text-heavy technical SVGs to raster.
- Ensure `viewBox` exists.
- Provide title/description or adjacent caption.
- Do not inline untrusted executable SVG.

## 15.3 Figure layout

- Standard figures align to prose width.
- Architecture figures and benchmark plots may use wide breakout.
- Full-bleed media is exceptional and never reduces readability.
- Captions use UI font at 14–15px.
- Captions align with the figure, not necessarily the prose column.
- Figure numbers and references are deterministic.
- Clicking an image may open a high-resolution viewer only as an optional lazy island.
- The base image remains available without the viewer.

## 15.4 Diagrams

Supported diagram strategies:

1. Authored SVG or image.
2. Mermaid source rendered to SVG at build time.
3. Graphviz source rendered to SVG at build time.
4. Interactive diagram component explicitly declared and lazy-loaded.

Each diagram retains:

- Original source.
- Renderer version.
- Rendered artifact hash.
- Accessibility description.
- Diagnostics.
- Fallback source or static image.

Do not execute diagram scripts in the main page context.

---

# 16. Audio and video

## 16.1 Media principles

- No autoplay with sound.
- No video required for understanding without a transcript or equivalent text.
- No large media transfer before user intent unless it is the page’s primary content.
- Use native controls as the baseline.
- Preserve direct media links.
- Reserve dimensions to prevent layout shift.
- Load enhanced controls only when needed.

## 16.2 Video pipeline

Preferred production path:

```text
master video
    ↓
transcode job
    ├── H.264 MP4 fallback
    ├── WebM/AV1 where justified
    ├── HLS or DASH adaptive renditions for long video
    ├── poster images
    ├── WebVTT captions
    └── media manifest
```

Default embed:

```html
<video
  controls
  preload="metadata"
  playsinline
  width="1280"
  height="720"
  poster="/media/poster.avif"
>
  <source src="/media/video.webm" type="video/webm" />
  <source src="/media/video.mp4" type="video/mp4" />
  <track
    kind="captions"
    src="/media/captions.en.vtt"
    srclang="en"
    label="English"
    default
  />
</video>
```

For long-form streaming:

- Store media in object storage behind a CDN.
- Support byte-range requests.
- Use adaptive bitrate manifests.
- Use a small lazy-loaded player only when adaptive playback or synchronized chapters require it.
- Keep a native MP4 fallback.
- Segment and cache immutable media.
- Keep poster image below the article’s LCP budget.
- Provide transcript and chapter links.
- Avoid background video on article pages.

## 16.3 Audio pipeline

- Use native audio controls by default.
- `preload="none"` or `metadata` based on placement.
- Provide transcript.
- Provide duration and downloadable source when licensed.
- Lazy-load waveform visualizations.
- Do not decode audio merely to draw a decorative waveform.
- Keep playback state local to the media component unless global playback is a product requirement.

## 16.4 Third-party embeds

Third-party embeds must use click-to-load placeholders.

Before activation, render:

- Provider name.
- Title.
- Poster or neutral placeholder.
- Privacy/network disclosure.
- Open-directly link.

Do not load YouTube, social-media, analytics, or notebook iframes during initial article rendering.

---

# 17. Interactive content

## 17.1 Interaction model

Interactive elements are opt-in, typed, and isolated.

Examples:

- Architecture explorer.
- Benchmark selector.
- Tensor-shape stepper.
- Attention-memory calculator.
- Ablation comparison.
- Timeline.
- Audio alignment viewer.
- Search interface.

## 17.2 Declaration

Prefer safe directives:

```md
:::interactive{type="attention-memory-calculator" data="./assets/config.json"}
:::
```

Restricted MDX may be enabled only for reviewed content:

```mdx
<AttentionMemoryCalculator config="./assets/config.json" />
```

## 17.3 Island contract

```ts
interface InteractiveNodeRecord {
  componentId: string;
  componentVersion: string;
  props: unknown;
  fallback: StaticFallbackRecord;
  estimatedBundleBytes: number;
  hydrationPolicy:
    | "on-visible"
    | "on-interaction"
    | "idle"
    | "eager";
}
```

Rules:

- Every interactive node has a complete static fallback.
- Validate props against a runtime schema.
- Lazy-load component code.
- Prefer `on-interaction` or `on-visible`.
- Hydrate `eager` only when the interaction is in the first viewport and essential.
- Isolate failures with an error boundary.
- Track per-component bundle size.
- Do not let one interactive component hydrate the full article.
- Avoid WebGL unless the visualization materially requires it.
- Pause animations and rendering work outside the viewport.
- Respect reduced motion.
- Release event listeners and GPU resources on unmount.

---

# 18. Navigation and reading UX

## 18.1 Global header

Desktop:

- Logo/wordmark.
- Primary sections.
- Search.
- Theme control in utility area.
- No oversized product menu.

Mobile:

- Compact logo.
- Search button.
- Menu button.
- Full-screen or sheet navigation with focus trap.
- Body scroll lock only while open.

## 18.2 Article outline

Build outline records from the AST, never DOM scraping.

Desktop:

- Sticky right rail.
- Show `h2` and optionally `h3`.
- Highlight current section using a lightweight observer.
- Do not continuously update URL while scrolling unless explicitly required.

Mobile/tablet:

- Render outline as an expandable “On this page” block before content.
- All links remain normal anchors.

## 18.3 Reading position

Optional reading progress must be:

- Thin and non-obtrusive.
- Disabled under reduced motion if animated.
- Computed without high-frequency scroll handlers.
- Excluded if it adds no clear reader value.

Do not display percentage metrics inside the article header.

## 18.4 Previous and next navigation

Generated from the deterministic primary navigation order.

Display:

- Previous/next direction.
- Article title.
- Section or series context.

Do not derive traversal from publication timestamps unless configured.

## 18.5 Search

Search index records must preserve:

- Document ID.
- Route.
- Heading ID.
- Field type.
- Source span.
- Text.
- Weight.
- Topic and article type.

Index separately:

- Titles.
- Descriptions.
- Headings.
- Body text.
- Code.
- Captions.
- Metadata.
- Citations.

Do not concatenate the corpus into one unstructured text blob.

Search UI:

- Keyboard accessible.
- Query visible in URL.
- Results grouped by document.
- Heading-level deep links.
- Search term highlighting with safe markup.
- No initial search bundle on pages where search is unopened, unless proven small.
- Static `/search` fallback page.

---

# 19. Motion and interaction design

## 19.1 Motion tokens

```css
--duration-fast: 120ms;
--duration-normal: 180ms;
--duration-slow: 260ms;

--ease-standard: cubic-bezier(0.2, 0, 0, 1);
--ease-emphasized: cubic-bezier(0.2, 0, 0, 1);
```

## 19.2 Allowed motion

- Menu opening.
- Disclosure expansion.
- Focus/hover state transitions.
- Route loading feedback.
- Diagram state interpolation.
- Media viewer transitions.

## 19.3 Disallowed motion

- Parallax article backgrounds.
- Continuous decorative loops.
- Cursor-following effects.
- Auto-advancing carousels.
- Scroll-jacking.
- Entrance animation for every paragraph.
- Animated gradients.
- Motion that delays access to content.

Under `prefers-reduced-motion: reduce`, remove nonessential transitions and all continuous animation.

---

# 20. Accessibility

Target WCAG 2.2 AA.

Required:

- Semantic landmarks.
- One valid page `h1`.
- Correct heading hierarchy.
- Skip link.
- Visible keyboard focus.
- Keyboard-operable navigation.
- No keyboard traps.
- Route-change announcements for client navigation.
- Focus management after navigation and modal actions.
- Accessible names for controls.
- Accessible tables.
- Alt text and captions.
- Long descriptions for complex diagrams where needed.
- MathML or equivalent mathematical accessibility.
- Captions and transcripts for media.
- Reduced-motion support.
- High-contrast compatibility.
- Logical DOM order independent of visual columns.
- Minimum 44×44 CSS pixel target for primary touch controls where feasible.
- Zoom to 200% without loss of content or function.
- Reflow at 320 CSS pixels.
- Language metadata at document and inline language boundaries.
- Directionality support for RTL and bidirectional content.

Do not use ARIA to repair invalid native semantics when native elements suffice.

---

# 21. Performance architecture

## 21.1 Performance strategy

Move expensive work to build time:

- Markdown parsing.
- Syntax highlighting.
- Equation rendering.
- Diagram rendering.
- Image variant generation.
- Route generation.
- Search indexing.
- Citation compilation.
- Metadata validation.
- Link validation.
- Social image generation.

Runtime work should primarily be:

- HTML parsing and rendering.
- CSS layout.
- Native media handling.
- Small navigation transitions.
- Explicit interactive islands.

## 21.2 Browser workload constraints

For ordinary article pages:

- No client-side Markdown parser.
- No client-side syntax highlighter.
- No client-side math renderer.
- No full-site state manager.
- No animation framework.
- No charting library unless the article declares a chart.
- No global media player unless required.
- No hydration of static figures.
- No monolithic design-system bundle.
- No GPU-intensive canvas in the initial viewport.

## 21.3 Core Web Vitals budgets

Measured at the 75th percentile, separated by mobile and desktop:

| Metric | Required |
|---|---:|
| LCP | `≤ 2.5 s` |
| INP | `≤ 200 ms` |
| CLS | `≤ 0.10` |
| TTFB for cached public pages | target `≤ 500 ms` |
| First content render | target `≤ 1.5 s` on tested mobile profile |

## 21.4 Asset budgets

Default article-route budgets, measured compressed:

| Resource | Budget |
|---|---:|
| Shared + route JavaScript before interaction | `≤ 80 KiB gzip` |
| Article-specific eager client JavaScript | `≤ 15 KiB gzip` |
| Critical CSS | `≤ 20 KiB gzip` |
| Total initial CSS | `≤ 40 KiB gzip` |
| Initially loaded font data | `≤ 140 KiB` |
| Mobile LCP image | `≤ 220 KiB` |
| Total first-viewport image transfer | `≤ 350 KiB` |
| Third-party initial requests | `0` by default |

Interactive component budgets are tracked separately and loaded only by policy.

## 21.5 CPU and memory budgets

Test on representative mid-tier mobile hardware or calibrated throttling:

- Main-thread blocking task: no task longer than 50ms during initial article load.
- Hydration/boot work: target below 100ms total for non-interactive article routes.
- Scroll must remain responsive with long code blocks and equations.
- Intersection observers must be shared, not instantiated per heading where avoidable.
- Do not virtualize normal article prose.
- Virtualize very large navigation trees only above measured thresholds.
- Destroy offscreen WebGL contexts and expensive media observers.

## 21.6 Caching

Immutable hashed assets:

```text
Cache-Control: public, max-age=31536000, immutable
```

HTML:

- CDN cache with explicit revalidation strategy.
- Do not cache previews as public.
- Use stale-while-revalidate only where publication semantics permit it.

Media:

- Long cache lifetime for content-addressed variants.
- Byte-range support for audio/video.
- Correct content types.
- Cross-origin policy defined explicitly.

## 21.7 Prefetch policy

- Prefetch likely internal routes when links enter the viewport and network conditions permit.
- Do not prefetch all topic or pagination links.
- Disable or reduce prefetch under data-saver or constrained network conditions.
- Never prefetch large media.
- Do not use hover prefetch to trigger expensive dynamic data requests.

---

# 22. Security model

## 22.1 Trust levels

```ts
type ContentTrustLevel =
  | "trusted-static"
  | "reviewed"
  | "untrusted";
```

## 22.2 Required controls

- Sanitize raw HTML according to trust level.
- Disable arbitrary JSX and JavaScript by default.
- Allowlist MDX components and properties.
- Validate URL protocols.
- Apply Content Security Policy.
- Escape unknown content.
- Isolate diagrams.
- Prevent DOM clobbering.
- Prevent prototype pollution through metadata.
- Validate generated artifacts before rendering.
- Avoid exposing local filesystem paths.
- Prohibit inline executable script from Markdown.
- Restrict iframe origins.
- Require integrity and version control for external scripts when external scripts are unavoidable.
- Keep publication pages functional when third-party scripts are blocked.

Security transformations must escape, quarantine, annotate, or reject content. They must not silently delete it.

---

# 23. SEO, metadata, and scholarly discoverability

Generate:

- `<title>`.
- Meta description.
- Canonical URL.
- Open Graph metadata.
- Social preview images.
- Robots directives.
- Sitemap.
- RSS/Atom feeds by section.
- Structured author pages.
- `TechArticle` or `ScholarlyArticle` JSON-LD where semantically correct.
- `datePublished` and `dateModified`.
- Breadcrumb structured data.
- Citation and repository links.
- Version history.

Do not mark every page as `ScholarlyArticle`; article type controls schema.

Social images must be generated from stable templates and must not become the primary article design language.

---

# 24. Printing and export

Article pages must print cleanly.

Print requirements:

- Hide global navigation, search, theme controls, and interactive-only controls.
- Expand disclosures containing article content.
- Print URLs for external references where useful.
- Avoid splitting headings from the following paragraph.
- Avoid splitting figures from captions.
- Preserve code formatting.
- Allow wide tables to scale or continue across pages with repeated headers where browser support permits.
- Use light background.
- Preserve equation numbering.
- Include article title, authors, publication date, canonical URL, and version.
- Interactive nodes print their static fallback.

Optional PDF generation must use the same compiled document and print styles, not a separate lossy conversion pipeline.

---

# 25. Content author experience

## 25.1 Author commands

Current executable commands:

```bash
npm ci
npm run dev
npm run content:validate
npm run typecheck
npm test
npm run build
npm run verify
npm run verify:determinism
```

The dedicated `content:build`, `content:watch`, `content:links`, and
`content:preservation` commands from the original blueprint do not currently
exist. Their intended behavior remains a roadmap target and must not be included
in user instructions until corresponding scripts and tests are implemented.

## 25.2 Author diagnostics

Diagnostics must include:

- Stable code.
- Severity.
- File.
- Line and column.
- Node type.
- Explanation.
- Remediation.
- Related locations.

Example:

```text
NA-LINK-004 error
content/research/kimi-k3/index.md:184:7
Internal fragment "#training-objective" does not exist.
Nearest headings:
  - "#training-objectives"
  - "#post-training-objective"
```

## 25.3 Preview behavior

- Draft routes are excluded from production output.
- Local preview shows source-aware diagnostics.
- Preview may expose source locations and IR inspection.
- Production must not expose absolute paths or internal diagnostics.
- Draft mode must be authenticated if deployed.

---

# 26. Testing strategy

## 26.1 Unit tests

Test:

- Parser adapters.
- Metadata schemas.
- Route generation.
- Heading ID generation.
- Link classification.
- Citation parsing.
- Math extraction.
- Code metadata.
- Asset resolution.
- Design-token contracts.
- Component variants.
- Serialization.

## 26.2 Golden preservation fixtures

Include fixtures for:

- Empty document.
- Very long document.
- Mixed newline styles.
- Unknown front matter.
- Raw HTML.
- Nested lists.
- Deep blockquotes.
- Wide tables.
- Inline and display math.
- Matrix and aligned equations.
- Algorithms.
- Mermaid and SVG.
- Code fences with unusual delimiters.
- Invalid code fence.
- Reference links.
- Footnotes.
- Citations.
- Unicode and bidirectional text.
- CJK content.
- RTL content.
- Audio and video.
- Restricted MDX.
- Unknown directives.
- Invalid UTF.
- Very large file.

Verify:

- No dropped nodes.
- Exact code preservation.
- Exact equation source.
- Exact diagram source.
- Stable ordering.
- Stable identifiers.
- Stable routes.
- Stable output hashes.

## 26.3 Component visual regression

Test at:

```text
320 × 800
390 × 844
768 × 1024
1024 × 768
1280 × 800
1440 × 900
1920 × 1080
```

Capture:

- Light mode.
- Dark mode.
- High contrast.
- Reduced motion.
- 200% zoom.
- Long title.
- No hero image.
- Wide code.
- Wide table.
- Long equation.
- Multiple figures.
- Embedded media.
- Broken optional media fallback.

## 26.4 End-to-end tests

- Direct article route.
- Fragment route.
- Internal link.
- External link.
- Heading copy-link.
- Search to heading.
- Previous/next traversal.
- Mobile navigation.
- Theme behavior.
- Keyboard-only operation.
- Media caption selection.
- Video poster and lazy loading.
- Audio transcript.
- Interactive fallback.
- Interactive lazy hydration.
- Print rendering.
- Offline static pages.
- 404 and invalid fragment behavior.
- Draft exclusion.
- Static export deployment.

## 26.5 Accessibility tests

Automated:

- Axe or equivalent.
- HTML validity.
- Color contrast.
- Landmark presence.
- Heading structure.
- Control names.
- Table semantics.

Manual:

- Keyboard navigation.
- Screen-reader article traversal.
- Equation reading.
- Diagram alternatives.
- Media captions.
- Zoom/reflow.
- High contrast.
- Reduced motion.

Automated checks do not replace manual verification.

---

# 27. CI/CD quality gates

The pipeline must fail on:

- Type errors.
- Lint errors.
- Unit failures.
- Integration failures.
- E2E failures.
- Accessibility violations at blocking severity.
- Unapproved visual diffs.
- Route collisions.
- Broken required internal links.
- Missing required assets.
- Data-loss violations.
- Unknown syntax without an explicit policy.
- Invalid manifest schemas.
- Search-index inconsistency.
- Bundle-budget violations.
- Core Web Vitals laboratory regression beyond threshold.
- Dependency vulnerability beyond configured severity.
- Nondeterministic build output.

Run the full deterministic content build twice and compare content hashes.

Recommended CI order:

```text
install with frozen lockfile
    ↓
typecheck
    ↓
lint
    ↓
content schema validation
    ↓
unit tests
    ↓
content compilation
    ↓
preservation verification
    ↓
application build
    ↓
repeat deterministic build
    ↓
artifact hash comparison
    ↓
bundle budget
    ↓
component tests
    ↓
E2E
    ↓
accessibility
    ↓
visual regression
    ↓
performance audit
    ↓
deploy immutable preview
```

---

# 28. Observability

## 28.1 Build telemetry

Record:

- Documents discovered.
- Documents parsed.
- Parse failures.
- Unsupported nodes.
- Transform counts.
- Validation failures.
- Assets and generated variants.
- Broken links.
- Route collisions.
- Build duration by phase.
- Cache hit rate.
- Incremental rebuild time.
- Search-index size.
- JavaScript and CSS output by route.
- Font and media transfer estimates.

## 28.2 Runtime telemetry

Optional and privacy-preserving:

- Route transition latency.
- Search latency.
- Client exceptions.
- Interactive component failures.
- Media failures.
- Web Vitals.
- Diagram failures.

Do not collect article source, selected text, annotations, code snippets, queries, or reading behavior unless explicitly authorized and documented.

---

# 29. Target repository structure

The following is a possible future modular layout. It is not the current
filesystem. The current single-application structure is documented in Section
0.6 and `AGENTS.md`.

```text
repository/
├── apps/
│   └── web/
│       ├── app/
│       ├── components/
│       ├── styles/
│       ├── public/
│       └── next.config.ts
├── packages/
│   ├── content-compiler/
│   │   ├── discovery/
│   │   ├── parsers/
│   │   ├── ir/
│   │   ├── transforms/
│   │   ├── graph/
│   │   ├── routes/
│   │   ├── links/
│   │   ├── citations/
│   │   ├── assets/
│   │   ├── math/
│   │   ├── code/
│   │   ├── diagrams/
│   │   ├── search/
│   │   ├── validation/
│   │   └── emit/
│   ├── content-schema/
│   ├── design-tokens/
│   ├── content-renderers/
│   ├── publication-ui/
│   ├── interactive-registry/
│   └── test-fixtures/
├── content/
├── config/
│   ├── publication.config.ts
│   ├── content.config.ts
│   └── security.config.ts
├── build/
│   ├── manifests/
│   ├── documents/
│   ├── search/
│   ├── media/
│   └── diagnostics/
├── tests/
└── plan.md
```

Avoid circular dependencies:

```text
content-schema
    ↑
content-compiler
    ↑
content-renderers
    ↑
publication-ui
    ↑
web application
```

---

# 30. Build artifacts

Generate versioned artifacts:

```text
build/
├── corpus-manifest.json
├── source-manifest.json
├── document-manifest.json
├── content-graph.json
├── navigation-manifest.json
├── route-manifest.json
├── redirect-manifest.json
├── heading-index.json
├── link-graph.json
├── citation-graph.json
├── asset-manifest.json
├── media-manifest.json
├── interactive-manifest.json
├── search-index/
├── rendered-documents/
├── diagnostics.json
├── preservation-report.json
├── transformation-report.json
└── build-metadata.json
```

Every artifact includes:

- Schema version.
- Compiler version.
- Configuration hash.
- Corpus hash.
- Dependency versions.
- Compatibility metadata.
- Generation timestamp excluded from content hashes.

---

# 31. Roadmap implementation phases

These phases describe capability groups, not a claim of linear completion. The
current application implements useful portions of Phases 0 through 8, but no
phase is considered fully closed while its listed exit gate remains unverified.
In particular, the browser E2E, automated accessibility, visual regression,
formal preservation artifacts, complete interactive registry, and production
performance-budget gates remain incomplete.

## Phase 0 — Requirements and corpus audit

Deliver:

- Sample corpus inventory.
- Syntax capability matrix.
- Asset inventory.
- Article-type inventory.
- Reference-site visual analysis.
- Accessibility target.
- Performance target.
- Browser support matrix.
- Explicit decisions and rejected alternatives.

Exit gate:

- At least 30 representative Markdown fixtures.
- All known syntax classified.
- No unresolved mandatory content type.

## Phase 1 — Content compiler foundation

Deliver:

- Recursive discovery.
- Source registry.
- Parser registry.
- Versioned IR.
- Metadata schema.
- Source maps.
- Preservation verifier.
- Structured diagnostics.

Exit gate:

- Golden fixtures pass.
- Unknown syntax preserved.
- Exact code/math/diagram source retained.

## Phase 2 — Content graph and routing

Deliver:

- Hierarchy policy.
- Topic graph.
- Route compiler.
- Heading index.
- Link resolver.
- Citation graph.
- Navigation manifests.
- Collision detection.

Exit gate:

- Deterministic repeated builds.
- No unresolved required internal link.
- Primary navigation trace is explainable.

## Phase 3 — Design system

Deliver:

- Semantic color tokens.
- Typography implementation.
- Spacing and layout tokens.
- Primitive components.
- Focus styles.
- Light/dark/high-contrast behavior.
- Component workbench fixtures.

Exit gate:

- Tokens approved.
- All primitives keyboard-accessible.
- Paragraph measure remains 68–74ch across target widths.

## Phase 4 — Core publication UI

Deliver:

- Header and footer.
- Home page.
- Section indexes.
- Article page.
- Topic and author pages.
- Article outline.
- Previous/next navigation.
- Responsive behavior.
- Print styles.

Exit gate:

- Complete static article works with JavaScript disabled.
- Mobile, tablet, and desktop visual regressions approved.

## Phase 5 — Advanced technical content

Deliver:

- KaTeX pipeline.
- Equation references.
- Shiki pipeline.
- Algorithm component.
- Table system.
- Figure and diagram pipeline.
- Citation rendering.
- Media components.

Exit gate:

- Scientific fixtures render correctly.
- No client math/highlighting runtime.
- Accessible equation and media alternatives verified.

## Phase 6 — Search and interactivity

Deliver:

- Search provider abstraction.
- Static local index.
- Search UI.
- Interactive registry.
- Lazy island policies.
- Static fallbacks.
- Per-island bundle reporting.

Exit gate:

- Search deep links to headings.
- Interactive failure does not remove source content.
- Ordinary articles remain within JS budget.

## Phase 7 — Performance, security, and accessibility hardening

Deliver:

- Image/media optimization.
- Cache policy.
- CSP.
- Sanitization.
- Bundle budgets.
- Lighthouse/Web Vitals checks.
- Manual accessibility audit.
- Load and stress tests for large corpora.

Exit gate:

- All release budgets pass.
- No blocking accessibility issue.
- No unsafe content execution path.

## Phase 8 — Deployment and operations

Deliver:

- Static and server deployment profiles.
- CDN configuration.
- Preview deployment.
- Rollback procedure.
- Build observability.
- Production monitoring.
- Author documentation.
- Maintainer runbook.

Exit gate:

- Reproducible release.
- Hash-addressed rollback.
- Production smoke tests pass.

---

# 32. Developer definition of done

A feature is complete only when:

- Typed schema exists.
- Source preservation behavior is defined.
- Renderer exists.
- Static fallback exists where interactive.
- Keyboard behavior is documented.
- Screen-reader behavior is verified.
- Responsive behavior is verified.
- Light and dark tokens are used.
- Print behavior is defined.
- Unit tests exist.
- Visual fixture exists.
- Error state exists.
- Diagnostics are source-aware.
- Bundle effect is measured.
- No unnecessary client component is introduced.
- Documentation is updated.

---

# 33. Target acceptance criteria

The complete roadmap is accepted only when every item below is supported by
executable evidence. The current production site is an implemented subset and
does not yet satisfy every criterion:

1. Arbitrary recursive Markdown structures are ingestible through configuration.
2. No fixed directory or filename convention is required.
3. Original source bytes remain available.
4. Unknown metadata remains available.
5. Unknown syntax is preserved or explicitly rejected.
6. No content node is silently removed.
7. Every transformation is versioned and traceable.
8. Generated identifiers and routes are deterministic.
9. Routes are collision-free.
10. Internal links and fragments are validated.
11. All source assets are tracked.
12. Every rendered block is traceable to source.
13. Preservation reports show no unauthorized data loss.
14. Repeated builds produce identical content hashes.
15. Articles render without browser-side Markdown parsing.
16. Equations render statically and preserve TeX.
17. Code highlights statically and preserves exact code.
18. Tables retain full data on mobile.
19. Media uses lazy, dimension-stable, captioned delivery.
20. Interactive content has static fallbacks and isolated hydration.
21. Paragraph measure remains within 68–74ch for standard prose.
22. The site is usable at 320 CSS pixels and 200% zoom.
23. WCAG 2.2 AA gates pass.
24. Core Web Vitals budgets pass at the defined percentile.
25. Static article routes remain within JavaScript, CSS, font, and image budgets.
26. Security gates pass.
27. Generated manifests validate against published schemas.
28. The corpus can grow to thousands of documents without restructuring.
29. UI remains clean, restrained, and research-oriented.
30. No design choice copies proprietary reference-site identity.

---

# 34. Reference baseline

The implementation team should periodically reassess current official pages and documentation before major redesigns or framework upgrades.

Publication references:

- Kimi Research: `https://www.kimi.com/blog/`
- Google DeepMind News and research navigation: `https://deepmind.google/blog/`
- Anthropic Research: `https://www.anthropic.com/research`
- Anthropic Engineering: `https://www.anthropic.com/engineering`
- OpenAI Research: `https://openai.com/research/`
- OpenAI Engineering: `https://openai.com/news/engineering/`

Technical references:

- Next.js App Router: `https://nextjs.org/docs/app`
- Next.js static exports: `https://nextjs.org/docs/app/guides/static-exports`
- MDX: `https://mdxjs.com/docs/`
- KaTeX: `https://katex.org/docs/`
- Shiki: `https://shiki.style/guide/`
- Core Web Vitals: `https://web.dev/articles/vitals`
- MDN media and performance guidance: `https://developer.mozilla.org/`

Reference observations must be converted into explicit requirements, tokens, fixtures, and tests. “Make it look like DeepMind, Anthropic, OpenAI, or Kimi” is not an implementable acceptance criterion by itself.
