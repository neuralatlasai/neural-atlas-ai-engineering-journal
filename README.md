# Neural Atlas

A static-first research-publication website that turns the Markdown corpus under
`docs/` into a readable, accessible, high-fidelity AI engineering journal. It
implements the architecture and quality bar defined in [`plan.md`](./plan.md).

## What it does

- **Recursively discovers** Markdown under `docs/` and compiles deterministic,
  collision-checked routes (`/<section>/<slug>`).
- **Renders at build time** — no client-side Markdown, math, or highlighter
  runtime ships to the browser:
  - GFM tables, lists, task lists, autolinks, footnotes
  - **KaTeX** math (HTML + MathML for accessibility), with a source-preserving
    fallback when an equation is malformed
  - **Shiki** syntax highlighting with a dual light/dark theme
  - Responsive **AVIF/WebP** image variants with intrinsic dimensions
- **Renumbers headings into a valid outline** from nesting depth, so an article
  never jumps `h1 → h3` regardless of how the author numbered its sections.
- Derives article metadata (title, deck, date, reading time) from source while
  preserving authored front matter when present. The deck extractor skips
  images, display maths, tables, and prose-styled front matter, and returns
  nothing rather than a line of TeX when a document opens with no prose.
- Smooth navigation: route-change fade (never on first paint, so LCP is
  untouched), full-row click targets in every article list, anchor targets that
  land clear of the sticky header, and press feedback on controls.

## Build and dev performance

Three measured fixes, after profiling the pipeline rather than guessing:

| | Before | After |
|---|---:|---:|
| Image pipeline (nothing changed) | 55 s | 0.35 s |
| Image pipeline (cold) | 55 s | 30 s |
| Compile whole corpus (cold) | 16.7 s | 6.9 s |
| Compile whole corpus (warm) | 6.8 s | 0.005 s |
| Build the search index | 8–12 s | 0.64 s |
| `npm run verify` end to end | 109 s | 53 s |

Measured in the dev server, first request vs. repeat:

| Route | Before | 1st | Repeat |
|---|---:|---:|---:|
| `/search-index.json` | 8.8–12.1 s | 2.6 s | 17 ms |
| `/components/attention/` | 3.1 s | 1.8 s | 309 ms |
| `/models/glm-5-2/` | 3.0 s | 1.5 s | 275 ms |
| `/search/` | 1.4 s | 0.8 s | 98 ms |

- **The syntax highlighter was initialised for every document.** Shiki costs
  ~10 s to start (regex engine, themes, grammars), and four of the five articles
  contain no code at all. It is now loaded only when a document has a fenced
  block, and only for the grammars that block actually uses. This is what made
  article routes take ten seconds to serve in development.
- **The compiler's memo never hit.** Its key included the asset resolver's
  identity, and `assetResolverFor()` returned a fresh closure per call, so every
  render was a cache miss and recompiled the document from scratch. The resolver
  is now memoized per source path.
- **The search index was built by fully rendering every article.** It called
  `compileArticle`, which rendered 508 equations through KaTeX, ran the
  highlighter, and serialised several megabytes of HTML — then threw all of it
  away, because the index stores plain text. `extractArticleIndex` now runs only
  the *structural* stages (heading levels, ids, outline, indexable text) and
  stops before the compiler. Both pipelines share those stages verbatim, so a
  heading id cannot differ between the page a reader lands on and the search
  result that linked them there; six tests assert that agreement.
- **The image pipeline re-encoded everything on every run.** It deleted its
  output directory and rebuilt all variants even when no image had changed —
  about half of total build time. Encoding is now content-addressed: each
  manifest entry records the source hash and a pipeline version, and an asset is
  re-encoded only when one of those changes or an output file is missing. Stale
  files are pruned, so repeated runs stay deterministic. Bump
  `PIPELINE_VERSION` when changing encoder settings, or run
  `node scripts/optimize-images.mjs --force`.

## Navigation strategy

Articles in this corpus are very large documents — 2–5 MB of rendered HTML and
0.8–2 MB of RSC payload each, dominated by tens of thousands of KaTeX nodes.
Client-side routing handles that badly on two fronts: `next/link` prefetches
every link that enters the viewport (a five-row listing pulled ~6 MB before the
reader clicked anything), and Next's client router cache keeps every visited
route alive for the life of the tab, so the site got progressively slower the
longer it was used.

So the site splits its links:

| Destination | Mechanism | Why |
|---|---|---|
| Articles | plain `<a>` (`components/ArticleLink.tsx`) | The browser discards the previous document, so memory is flat across any number of visits, and the HTML parser beats React reconciliation on a multi-megabyte tree. |
| Sections, topics, about, search (12–18 KB) | `next/link` | Client-side navigation is genuinely instant at this size. |

Because a hand-written `<a>` does not get Next's trailing-slash normalization,
`ArticleLink` routes every href through `internalHref()`, and the HTML audit
fails the build on any internal path missing its trailing slash.
- Surfaces Markdown link-reference definitions as a semantic **References** list.
- Ships an editorial home page, section indexes, topics, an about page, a search
  page, and article pages with a sticky **outline**, breadcrumb, hero, related
  analysis, and previous/next navigation.
- **Search** across titles, headings, prose, and code, from both a `/search`
  page and a `⌘K` / `/` command palette.
- **Discoverability**: sitemap, robots, RSS feed, canonical URLs, Open Graph and
  Twitter metadata, and `TechArticle` / `ScholarlyArticle` JSON-LD chosen by
  article type.
- Semantic landmarks, skip link, visible focus, a keyboard-complete mobile
  navigation sheet, three-state theme control, print styles, forced-colors
  support, and a fixed reading measure per the design system.

## Progressive enhancement

Every page is complete before any JavaScript runs. With scripting disabled you
still get: full article text, headings and anchors, tables, equations, code,
figures, navigation, the article outline, and — on `/search` — the entire
browsable corpus behind a real `GET` form.

JavaScript adds only accelerators: the search palette and live results, the
copy-to-clipboard buttons, the outline's active-section highlight, the reading
progress bar, and the mobile navigation sheet.

## Commands

```bash
npm install                  # install dependencies
npm run dev                  # local dev server at http://localhost:3000
npm run build                # static export into ./out (runs the gates below)
npm test                     # unit tests (node:test)
npm run typecheck            # tsc --noEmit
npm run verify               # typecheck + tests + build
npm run verify:determinism   # build twice, compare exported bytes
npm run content:validate     # content schema checks
```

`npm run build` uses Next.js `output: "export"`, so `./out` is a fully static,
CDN-deployable bundle that needs no server runtime.

### Adding a new article

Drop a `.md` file anywhere under `docs/`. Discovery, routing, the section index,
navigation, the search index, the sitemap, and the feed all pick it up with no
code change.

The gates cover it automatically too. They did not always: `verify-math.mjs`
scanned a hard-coded `out/models`, so it verified two articles and silently
ignored every other section — 1,009 equations, including every equation in any
newly added post. It now walks the whole export, which immediately surfaced two
equations that had been rendering incorrectly on the live site for some time.

### Build gates

`postbuild` runs two gates that fail the build on regression:

- `verify-math.mjs` — every equation on every exported page renders, with no
  source-fallbacks (a reader seeing raw TeX) and no render-safety issues. A
  failure names the offending equation and the article it is in.
- `audit-html.mjs` — one `<h1>` per page, no heading-level jumps, exactly one
  `<main>`, no duplicate `nav` labels, alt text present, no broken internal
  links, no dead in-page anchors, no internal path missing its trailing slash
  (the export is `trailingSlash: true`, so `/search` has no file — only
  `/search/index.html`), and no unwrapped tables.

`verify:determinism` builds twice and compares every exported byte. It pins
`NEXT_BUILD_ID`, because Next.js otherwise embeds a fresh random build ID in
every page; all *content* artifacts (`search-index.json`, `feed.xml`,
`sitemap.xml`, `robots.txt`, and the rendered articles) are byte-stable without
it.

## Configuration

| Variable | Purpose | Default |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for metadata, sitemap, feed, JSON-LD | `https://neural-atlas.example` |
| `NEXT_BUILD_ID` | Pins the Next.js build ID for reproducible builds | random per build |

Set `NEXT_PUBLIC_SITE_URL` before deploying, or every canonical URL, feed link,
and structured-data reference will point at the placeholder origin.

## Handling this corpus

`docs/` was authored with a non-standard, partly lossy math convention (bare
`[`/`]` display blocks, parenthesized inline TeX, and Markdown-conversion
scars). `lib/content/preprocess.ts` normalizes these into standard delimiters and
repairs the obvious scars so KaTeX can render them, while the original source is
always preserved for the fallback path.

Ten of those display blocks carried a stray `#` on their opening delimiter
(`# [`). Those were being parsed as headings whose text is a bracket: the
equation rendered as literal TeX in a paragraph, an empty-id `<h2>[</h2>` entered
the outline, and the raw TeX polluted the search index. `DISPLAY_OPEN` now
tolerates the marker.

A dozen headings are written entirely in TeX
(`\boxed{\text{Algorithm 1: …}}`). KaTeX renders those correctly in the heading,
but the outline and the heading anchors are built from the syntax tree *before*
KaTeX runs — so the sidebar showed backslashes and the anchor was
`#boxedtextalgorithm-1-…`. `lib/content/tex-text.ts` reduces TeX to a readable
label for those three call sites only; the original source still reaches KaTeX
untouched. `rehype-slug` was replaced with a local slug plugin so ids derive
from the readable label, using one `GithubSlugger` per document so uniqueness
still holds by construction.

## Structure

```
app/                 Next.js App Router routes
  ├─ page.tsx        home
  ├─ [...slug]/      section indexes + article pages
  ├─ search/         search page
  ├─ topics/         topic index
  ├─ about/          editorial statement
  ├─ feed.xml/       RSS route handler
  ├─ search-index.json/  static search index route handler
  ├─ sitemap.ts      sitemap
  └─ robots.ts       crawler directives
components/          Header, footer, nav sheet, search, outline, theme (islands)
lib/
  ├─ site.ts         publication identity, origin, global navigation
  ├─ structured-data.ts  schema.org graphs
  ├─ content/
  │   ├─ corpus.ts   discovery, metadata, routing, topics, related, prev/next
  │   ├─ preprocess.ts  source normalization (math delimiters, scars)
  │   ├─ compile.ts  unified/remark/rehype pipeline → static HTML
  │   ├─ lede.ts     deck extraction (prose only, never maths or images)
  │   ├─ tex-text.ts TeX → readable label for outlines, anchors, and search
  │   ├─ reading.ts  reading-time estimation
  │   ├─ dates.ts    authored-date parsing (timezone-independent)
  │   └─ search.ts   build-time search-index producer
  └─ search/
      ├─ types.ts    index wire format
      └─ query.ts    ranking, snippets, highlighting (pure, isomorphic)
tests/               node:test unit tests
scripts/             image pipeline + build gates
docs/                Source Markdown corpus (unchanged)
plan.md              The full implementation blueprint
```

## Deviations from `plan.md`

- **Single app, not a monorepo.** The plan specifies
  `packages/content-compiler` and friends. The compiler is isolated in
  `lib/content/` instead (no Next/React/DOM imports), mirroring the plan's phase
  boundaries without the workspace overhead.
- **Topics are anchored sections of `/topics`, not `/topics/[topic]` routes.**
  A dynamic segment whose `generateStaticParams` can legitimately return an
  empty set cannot be statically exported — Next.js fails the build rather than
  emitting zero pages, and this corpus declares no topics in front matter.
  `/topics#slug` deep-links exactly as a dedicated route would, and the build
  stays valid for any corpus. Promoting these to real routes is a one-file
  change once topics are a guaranteed part of the schema.
- **Shared first-load JavaScript is ~103 kB**, above the plan's 80 KiB budget.
  Almost all of it is the React + Next runtime; route-specific JavaScript is
  1–3 kB, and the search index is fetched only when a reader opens search.
- **Not yet built**: interactive islands, `:::callout` and `:::algorithm`
  directives, author and series pages, visual-regression and E2E suites.

## Known gaps

- `npm run lint` is the deprecated `next lint`, which prompts interactively and
  has no configuration checked in. Typecheck, unit tests, and the two build
  gates are the real quality gates today; wiring up the ESLint CLI is the
  natural next step.
- Article dates are extracted from prose in the body (`**Release date:** …`)
  because the corpus has no front matter. Adding `publishedAt` to front matter
  would make this exact rather than inferred.

## Why `output: "export"` is build-only

`next.config.mjs` applies `output: "export"` to every phase *except* the dev
server. The setting does its real work at build time; in `next dev` it only adds
a guard that turns unmatched URLs into 500s. Because the app has a root-level
catch-all (`app/[...slug]`), that guard fired for anything the router should
simply miss — `/site.webmanifest`, `/apple-touch-icon.png`, webpack HMR probes,
and any mistyped path — so `not-found.tsx` could never render locally.

Export constraints are still enforced on every `npm run build`, which is the
gate that matters.

## Workflow note

`predev` clears `.next/static/webpack/` before the dev server starts. Those
hot-update chunks belong to a single dev session; if `.next` is rewritten while
a server is running — most often by a `next build` in another terminal — the
browser keeps requesting files that no longer exist and the session fails with:

```
⨯ SyntaxError: Unexpected end of JSON input
GET /_next/static/webpack/<hash>.hot-update.json 404
⚠ Fast Refresh had to perform a full reload due to a runtime error
GET /<route>/ 500
```

The page itself is fine — a reload serves it — but it reads like a bug in the
site. Clearing the stale state at startup removes the failure mode without
touching `.next/cache`, so startup stays fast.



`dev` and `build` both use the `.next` cache directory, so don't run them at the
same time — a `build` launched while `dev` is live can corrupt the dev cache and
produce a webpack "Cannot read properties of undefined (reading 'call')" /
missing-manifest error. If that happens, stop all `next` processes, delete
`.next`, and restart. Run only one `dev` server.
