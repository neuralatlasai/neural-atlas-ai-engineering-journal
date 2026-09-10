# Homepage and Blogs design QA

## Comparison target

- Source visual truth: `build/design-qa/reference-claude-academy-light-1900x880.png`, captured from `https://academy.claude.com/`.
- Browser-rendered homepage: `build/design-qa/pass5-homepage-light-top-1900.png`.
- Full source-to-implementation comparison: `build/design-qa/reference-vs-homepage-final-light.png`.
- Focused homepage regions: `build/design-qa/pass4-homepage-light-domains-1900.png`, `build/design-qa/pass4-homepage-light-featured-1900.png`, and `build/design-qa/pass4-homepage-light-latest-1900.png`.
- Responsive states: `build/design-qa/final-homepage-light-top-390.png`, `build/design-qa/final-homepage-dark-top-390.png`, and `build/design-qa/final-homepage-light-top-320.png`.
- Blog rail regression: `build/design-qa/rail-removed-article-light-body-1440.png`.
- Local preview: `http://127.0.0.1:3000/`.

## Capture normalization

- Reference and implementation desktop captures use a 1900 x 880 CSS viewport at device scale factor 1.
- Responsive captures use 390 x 844 and 320 x 700 CSS viewports at device scale factor 1.
- Light mode is the fidelity target; dark mode verifies equivalent hierarchy and contrast.
- The comparison artifact vertically joins unscaled reference and implementation captures at identical width and density.

## Full-view comparison evidence

- The implementation follows the reference's editorial-academy language: restrained global header, warm neutral surfaces, display-serif hierarchy, compact technical labels, direct actions, three-column discovery cards, large image-led feature, subtle borders, and low-elevation cards.
- Neural Atlas retains its own technical information architecture, source-derived copy, and cobalt accent. Reference-site copy and branding were not copied.
- At the first desktop viewport, the opening domain cards remain visible below the hero, preserving the reference's discovery cue without weakening the technical masthead.

## Focused comparison evidence

- Domain cards use six separate generated, optimized illustrations with consistent 3:1 crops and collection-level art direction.
- The featured cyber-defense analysis and the AI-capabilities Blog use two additional distinct illustrations. Article cards prefer an authored hero automatically; unillustrated articles retain a deterministic section fallback.
- The Blogs template now uses one bounded masthead contents index. The duplicate desktop outline and its visually hidden labels are not emitted, eliminating both the unexplained tick pattern and its reserved grid column.

## Required fidelity surfaces

- Fonts and typography: Newsreader carries the editorial display role; Inter remains limited to navigation, metadata, descriptions, and actions. Weight, optical sizing, line height, tracking, title wrapping, and truncation were inspected at all captured widths.
- Spacing and layout: desktop discovery uses 3 columns, moves to 2 columns below 68rem, and becomes one column below 48rem. Hero and section spacing preserve a clear scan rhythm without detached empty rails.
- Colors and tokens: warm ivory, near-black text, quiet neutral rules, and restrained cobalt labels match the target's hierarchy. Dark mode maps the same semantics to charcoal surfaces without changing document structure.
- Image quality: all new assets are real generated raster artwork, exported to AVIF and WebP at 1440 x 480. Cards use `object-fit: cover`, intrinsic dimensions, and stable aspect ratios.
- Copy and content: the homepage uses existing project copy and corpus metadata. No article Markdown was modified by this UI change.
- Icons and controls: the existing icon family remains consistent; search, theme, and menu controls retain visible focus and practical touch dimensions.
- Accessibility: one homepage H1, semantic lists and headings, labelled dialogs, keyboard focus containment, Escape dismissal, reduced-motion support, decorative card artwork hidden from assistive technology, and no page-level horizontal overflow.

## Findings

No actionable P0, P1, or P2 findings remain.

## Comparison history

### Homepage pass 1

- P1: the prior homepage had an oversized bespoke visual language that diverged from the supplied academy-card reference. Fix: introduce the warm editorial token scope, compact header, bounded hero, image-led domain cards, wide feature, and responsive analysis grid.
- P1: card artwork was repeated by section, so the Blogs domain, featured Blog, and latest Blog appeared identical. Fix: retain all six category artworks, add distinct feature and article artwork, and prefer source-authored article heroes automatically.
- P2: the initial revised hero delayed discovery too far below the first viewport. Fix: reduce its display scale and block padding while retaining the technical headline hierarchy.

### Blog spacing pass

- P1: the removed `On this page` labels left a desktop column of short ticks and unused space. Fix: derive `showRailOutline` from document type, omit the rail for Blogs, retain a single bounded masthead index, and use the no-outline single-column geometry.
- Post-fix evidence: `build/design-qa/rail-removed-article-light-body-1440.png`.

## Interactions and runtime checks

- Mobile navigation opened with nine real links, moved focus inside the dialog, reported `aria-expanded=true`, closed with Escape, and remained hidden on desktop.
- Search opened as a labelled dialog, focused its input, and closed with Escape.
- Theme control changed the explicit theme state.
- Desktop primary navigation exposed three direct routes while retaining the complete navigation sheet.
- Viewports at 1900, 390, and 320 CSS pixels reported no page-level horizontal overflow.
- Browser console and runtime error collections were empty during final captures.

## Verification

- Typecheck passed.
- Full test suite passed: 399 tests across 62 suites.
- Fresh production build passed without CSS compatibility warnings: 84 static routes.
- Math verification passed: 14,593 equations, 0 strict errors, 0 warnings, 0 source fallbacks, 0 unrendered equations.
- HTML audit passed: 74 pages, 0 errors, 0 warnings.
- Exported Blog HTML contains no `article-rail`; exported homepage HTML references both distinct Blog-specific artwork sets.

## Final result

final result: passed
