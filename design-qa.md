# Homepage design QA

## Source truth

- Reference: https://skylabs.it/
- Captured reference: `build/design-qa/reference-desktop.png`
- Intent: quality and hierarchy benchmark, not a pixel clone. Neural Atlas keeps
  its own editorial typography, research vocabulary, routes, and evidence-map
  visual rather than copying Skylabs branding or content.

## Implementation evidence

- Desktop: `build/design-qa/implementation-desktop-v2.png`
- Full desktop page: `build/design-qa/implementation-full-v2.png`
- Open desktop menu: `build/design-qa/implementation-menu-v4.png`
- Desktop comparison: `build/design-qa/comparison-desktop-v2.png`
- Mobile: `build/design-qa/implementation-mobile-v2.png`
- Minimum-width mobile: `build/design-qa/implementation-320-v2.png`
- Route: `http://127.0.0.1:3000/`
- States: default homepage, open navigation sheet, and search palette closed.
- Viewports: 1900 × 1080, 1440 × 900, 390 × 844, and 320 × 720 CSS pixels at 1× density.

The 1440 px capture records the full 3,821 px document. The above-fold desktop,
open-menu, and mobile captures are the focused-region evidence for the requested
header and opening composition.

## Findings

- P0: none.
- P1: none.
- P2: none.
- The primary navigation exposes unique labels and destinations. The corpus
  section remains `Research`; the independent browse route is labelled
  `Library`.
- The hero has a clear editorial statement, technical breadcrumb, outlined
  domain controls, supporting copy, two actions, a vertical section rail, a
  product-native evidence topology, and a restrained publication facts rail.
- The desktop menu opens as a real half-screen dialog with all eight unique
  routes, background de-emphasis, an explicit close control, focus containment,
  Escape dismissal, and focus return supplied by the shared dialog behavior.
- At 390 px and 320 px, the hero, actions, header controls, and evidence visual
  remain inside the viewport. Measured document width equals viewport width.
- Desktop and mobile retain legible contrast, visible focus affordances, and
  44 px coarse-pointer targets inherited from the shared design system.

## Comparison history

1. The first desktop composition established the high-contrast direction but
   remained materially behind the reference's scale and interaction language.
2. The second pass added the technical trail, outlined domain controls,
   vertical section rail, larger hero, dark continuation, and the desktop
   navigation reveal.
3. Interaction QA found that the sticky header's backdrop filter established a
   containing block for its fixed dialogs. The shared header now releases that
   filter while any overlay is mounted; the measured menu height is the full
   982 px viewport content height rather than the 88 px header.
4. A raw headless-window capture was rejected because Chrome imposed a larger
   layout viewport than its screenshot width.
5. Device metrics were emulated explicitly at 390 px and 320 px; both final
   captures have zero document-level horizontal overflow.

## Final result

passed
