# Homepage design QA

## Comparison target

- Source visual truth: `C:/Users/heman/.codex/generated_images/019fec34-66de-7c73-be86-16a6e288c7bd/exec-5a40c4fe-7e1a-43c5-8a17-790de47f2200.png`
- Product baseline: `build/design-qa/live-neural-atlas-1440.png`
- External quality references: `https://skylabs.it/en/` and `https://skylabs.it/en/success-cases/formazioneai`
- Browser-rendered implementation: `build/design-qa/homepage-option-2-implementation-1440.png`
- Responsive implementation: `build/design-qa/homepage-option-2-implementation-390.png`
- Minimum-width implementation: `build/design-qa/homepage-option-2-implementation-320.png`
- Navigation state: `build/design-qa/homepage-mobile-menu-390.png`
- Route: `http://127.0.0.1:3000/`

## Capture normalization

- Source pixels: 1487 x 1058.
- Implementation pixels: 1440 x 1024 at a 1440 x 1024 CSS viewport and device scale factor 1.
- Responsive pixels: 390 x 844 and 320 x 720 at matching CSS viewports and device scale factor 1.
- Density normalization: the source and desktop implementation were each resampled to 720 x 512 and joined without browser chrome in `build/design-qa/option-2-vs-implementation-final.png`. Their aspect ratios differ by less than 0.1%, so normalization does not change the judged composition.
- State: dark homepage, top of page, no modal open. The responsive menu was evaluated separately in its open state.

## Full-view comparison evidence

- Baseline comparison: `build/design-qa/option-2-vs-live-baseline.png` (source left, deployed baseline right).
- Final comparison: `build/design-qa/option-2-vs-implementation-final.png` (source left, implementation right).
- Full implementation: `build/design-qa/homepage-option-2-implementation-1440-full.png`.
- The final implementation preserves the target hierarchy: compact global header, large technical introduction, research index, evidence topology, featured analysis, and bounded selected-analysis rows.
- Intentional differences are product constraints rather than drift: the user explicitly removed the generic metrics panel; the actual featured article replaces invented content; direct desktop navigation replaces the target's duplicate hamburger because the product brief rejects repeated navigation.

## Focused comparison evidence

No additional crop was required. The 1440 x 512 normalized comparison keeps the header, display typography, index labels, counts, rules, topology, and featured transition legible. The interaction-specific mobile menu is independently captured at native 390 x 844 resolution.

## Required fidelity surfaces

- Fonts and typography: the existing self-hosted editorial display face and UI/mono roles reproduce the intended serif/technical contrast. Optical weights, compact label tracking, headline leading, wrapping, and metadata hierarchy are stable at both tested widths.
- Spacing and layout rhythm: the desktop hero uses one wide editorial measure before the bounded atlas grid; mobile collapses to one column without overlap. The implementation has no horizontal overflow at 390 or 320 CSS pixels.
- Colors and visual tokens: near-black canvas, warm ivory text, muted technical copy, restrained periwinkle accents, and low-contrast rules remain consistent across header, body, overlays, and footer.
- Image quality and asset fidelity: the actual featured article image is rendered with a bounded crop. The evidence-topology asset is the repository's existing deterministic vector figure, not a placeholder or newly approximated decoration.
- Copy and content: the 27-word project description is the approved technical statement. Generic corpus, coverage, and publication-standard summaries are absent; routes and featured content come from the real source collection.
- Icons and controls: existing icon components retain consistent stroke weight and alignment. Search, theme, and terminal menu controls remain distinct and keyboard reachable.
- Responsiveness and accessibility: desktop primary navigation is visible; constrained navigation moves into one modal sheet; focus enters the active dialog and Escape closes it. Tap targets, semantic headings, labels, and reduced-motion behavior are retained.

## Findings

No actionable P0, P1, or P2 findings remain.

## Comparison history

### Baseline pass

- P1: the deployed homepage exposed both full primary navigation and a hamburger at desktop width, creating repeated navigation. Fix: keep direct navigation above 76rem and reserve the menu trigger for constrained widths.
- P1: the deployed hero delayed corpus discovery behind a large promotional opening. Fix: replace it with a bounded technical introduction and move the real research index into the next immediate viewport region.
- P2: publication facts were visually detached from their technical context. Initial fix: restructure them as aligned field-coordinate rows. Evidence: `build/design-qa/option-2-vs-implementation-with-coordinates.png`.

### Metrics-removal pass

- P2: the field-coordinate panel still read as a generic website summary and competed with the primary technical statement. Fix: remove the panel completely, remove its CSS and copy, enlarge the headline, widen the technical description, and move the research index directly after the hero.
- P2: the evidence figure retained a `CORPUS / PROVENANCE MAP` label after the summary panel was removed. Fix: reduce it to the technically specific `PROVENANCE MAP` label.
- Post-fix evidence: `build/design-qa/option-2-vs-implementation-final.png` and `build/design-qa/homepage-option-2-implementation-1440-full.png`.

### Responsive pass

- P2: at 390 CSS pixels the menu trigger preceded search and theme controls, weakening the terminal action hierarchy. Fix: order the constrained header as wordmark, search, theme, then menu.
- Post-fix evidence: `build/design-qa/homepage-option-2-implementation-390.png`, `build/design-qa/homepage-option-2-implementation-320.png`, and `build/design-qa/homepage-mobile-menu-390.png`.

## Interactions and runtime checks

- Mobile menu: opened; eight real navigation links present; `aria-expanded` changed to `true`; focus moved inside; Escape closed it.
- Search palette: opened; search input present and focused; Escape closed it.
- Theme control: changed theme state.
- Desktop header: eight primary links visible; menu trigger hidden.
- Console errors: none on the local implementation during capture or interaction checks.

## Final result

final result: passed
