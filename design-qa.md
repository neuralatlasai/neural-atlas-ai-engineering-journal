# Blogs article-template design QA

## Comparison target

- Source visual truth: `build/design-qa/reference-anthropic-top-1440.png` and `build/design-qa/reference-anthropic-body-1440.png`, captured from `https://www.anthropic.com/claude-fable-and-mythos-5-1`.
- Browser-rendered implementation: `build/design-qa/anthropic-blog-final2-article-light-top-1440.png`.
- Responsive implementation: `build/design-qa/anthropic-blog-final2-article-light-top-390.png`.
- Technical-diagram evidence: `build/design-qa/anthropic-blog-final2-article-light-mermaid-1440.png` and `build/design-qa/anthropic-blog-final2-article-light-mermaid-390.png`.
- Route: `http://127.0.0.1:3000/blogs/adaptive-agentic-cyber-defense-with-nvidia-nemotron/`.

## Capture normalization

- Source and implementation desktop captures: 1440 x 1024 pixels at a 1440 x 1024 CSS viewport and device scale factor 1.
- Responsive capture: 390 x 844 pixels at a matching CSS viewport and device scale factor 1.
- Density normalization: source and implementation desktop captures were each resampled to 720 x 512 and joined without browser chrome. Both source captures and implementation captures have identical aspect ratio and density.
- State: light article, top and body reading positions. The source site's cookie panel is external chrome and was excluded from fidelity findings.

## Full-view comparison evidence

- Top comparison: `build/design-qa/blog-reference-vs-implementation-top.png` (reference left, implementation right).
- Body comparison: `build/design-qa/blog-reference-vs-implementation-body.png` (reference left, implementation right).
- The implementation matches the reference composition: restrained global header, full-width atmospheric masthead, centred white editorial title, short dotted contents index, warm reading canvas, narrow serif measure, oversized section headings, and a quiet left progress rail.
- Product-specific differences are intentional: Neural Atlas retains its own name and navigation, and article text comes only from the repository source document.

## Focused comparison evidence

- Mermaid detail: `build/design-qa/anthropic-blog-final2-article-light-mermaid-1440.png` and `build/design-qa/anthropic-blog-final2-article-light-mermaid-390.png`.
- The reference has no equivalent system diagram in the compared state, so this application-specific surface was verified independently: all three Mermaid fences render as labelled SVG flowcharts, source is hidden, no source controls are published, and wide geometry scrolls inside the figure without widening the document.

## Required fidelity surfaces

- Fonts and typography: Newsreader preserves the reference's high-contrast editorial serif role; Inter remains limited to interface labels. Display weights, compact tracking, title wrapping, body leading, and heading hierarchy were checked at both viewports.
- Spacing and layout rhythm: desktop content follows the reference's offset reading axis and minimal left progress field. Mobile removes the repeated outline panel, uses one column, and has no page-level horizontal overflow.
- Colors and visual tokens: warm ivory canvas, near-black type, restrained rules, and the pale blue masthead image match the reference balance in light mode. Dark mode retains equivalent semantic contrast.
- Image quality and asset fidelity: the fallback masthead uses the generated 1536 x 1024 WebP atmosphere asset without stretching. A blog's own discovered lead image takes precedence, so future illustrated blogs receive content-specific mastheads.
- Copy and content: all article-facing text is derived from the existing Markdown and corpus metadata. No reference-site copy or invented technical claims were introduced.
- Accessibility and interaction: the page retains one article H1, labelled SVG diagrams, keyboard-reachable navigation, visible focus, local diagram scrolling, no-JavaScript source fallback, reduced-motion behavior, and print-safe content.

## Findings

No actionable P0, P1, or P2 findings remain.

## Comparison history

### Initial article pass

- P1: the standard article shell used a right-side labelled `On this page` panel, unlike the reference's quiet left field. Fix: scope a left progress rail to `docs/Blogs/`, limit it to top-level headings, and remove the labelled mobile disclosure.
- P2: every Blog reused one masthead image. Fix: prefer each article's resolved lead figure and use the shared atmosphere only as a fallback.
- Post-fix evidence: `build/design-qa/blog-reference-vs-implementation-top.png` and `build/design-qa/blog-reference-vs-implementation-body.png`.

### Mermaid pass

- P1: Mermaid source appeared as a code block instead of a diagram in some captures. The experimental ELK integration also failed against React-owned DOM state. Fix: use Mermaid's stable built-in Dagre layout, strict security mode, font-ready measurement, bounded input limits, a hidden pending source, and local SVG scrolling.
- P2: Source and Copy controls exposed implementation syntax in the published article. Fix: remove both controls from Mermaid figures while preserving the exact source as the failure and no-JavaScript fallback.
- Post-fix evidence: `build/design-qa/anthropic-blog-final2-article-light-mermaid-1440.png` and `build/design-qa/anthropic-blog-final2-article-light-mermaid-390.png`.

## Interactions and runtime checks

- Mermaid: 3 of 3 diagrams rendered; source hidden; canvas visible; no source controls; every SVG labelled; every wide diagram locally scrollable.
- Mobile: no document overflow; wide mathematics and diagrams remain locally contained.
- Search: dialog opened and received focus; Escape closed it.
- Navigation: mobile dialog opened with nine real links, filled the viewport, received focus, and was removed after resizing to desktop.
- Theme: theme state changed successfully.
- Desktop: primary navigation and progress rail visible; compact menu hidden.
- Console errors: none during captures or interaction checks.

## Verification

- Typecheck passed.
- Full test suite passed: 400 tests across 62 suites.
- Fresh production build passed: 83 static pages.
- Math verification passed: 14,539 equations, 0 strict errors, 0 warnings, 0 source fallbacks, 0 unrendered equations.
- HTML audit passed: 73 pages, 0 errors, 0 warnings.

## Final result

final result: passed
