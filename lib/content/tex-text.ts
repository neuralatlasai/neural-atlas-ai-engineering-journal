/**
 * Plain-text rendering of TeX, for places that need a *label* rather than a
 * rendered equation: the article outline, heading anchors, and the search index.
 *
 * The corpus writes several section headings entirely in TeX — for example
 * `\boxed{\text{Algorithm 1: Manifold-Constrained Hyper-Connection}}`. KaTeX
 * renders those correctly in the heading itself, but the outline is built from
 * the syntax tree *before* KaTeX runs, so it showed readers a sidebar full of
 * backslashes, and the generated anchor was `#boxedtextalgorithm-1-…`.
 *
 * This is strictly a labelling transform. It never touches what gets rendered:
 * the original TeX still reaches KaTeX untouched, satisfying the source-fidelity
 * requirement (plan §3.1).
 */

/** Commands whose brace argument is human-readable text worth keeping. */
const TEXT_COMMANDS = [
  "text",
  "textbf",
  "textit",
  "texttt",
  "textrm",
  "textsf",
  "mathrm",
  "mathbf",
  "mathit",
  "mathsf",
  "mathtt",
  "mathcal",
  "mathbb",
  "operatorname",
  "boxed",
  "emph",
].join("|");

const TEXT_COMMAND = new RegExp(`\\\\(?:${TEXT_COMMANDS})\\s*\\{([^{}]*)\\}`, "g");

/** TeX spacing macros that stand in for a space. */
const SPACING = /\\[,;:!>]|\\quad\b|\\qquad\b|\\ /g;

/** A few symbols that have an obvious, unambiguous text equivalent. */
const SYMBOLS: [RegExp, string][] = [
  [/\\times\b/g, "×"],
  [/\\cdot\b/g, "·"],
  [/\\to\b/g, "→"],
  [/\\leq\b/g, "≤"],
  [/\\geq\b/g, "≥"],
  [/\\approx\b/g, "≈"],
  [/\\pm\b/g, "±"],
  [/\\ldots\b|\\dots\b|\\cdots\b/g, "…"],
];

/**
 * Reduce TeX to readable text.
 *
 * Unwrapping runs to a fixed point so nested wrappers such as
 * `\boxed{\text{…}}` collapse fully; the iteration cap keeps a pathological
 * input from looping. Anything left that is still markup — stray commands,
 * braces, `$` delimiters — is dropped rather than shown, because a label is
 * better slightly lossy than unreadable.
 */
export function plainTextFromTeX(input: string): string {
  if (!input.includes("\\") && !input.includes("$") && !input.includes("{")) {
    return input.replace(/\s+/g, " ").trim();
  }

  let text = input;

  // Unwrap text-bearing commands from the inside out.
  for (let pass = 0; pass < 8; pass++) {
    const next = text.replace(TEXT_COMMAND, "$1");
    if (next === text) break;
    text = next;
  }

  for (const [pattern, replacement] of SYMBOLS) text = text.replace(pattern, replacement);

  text = text
    .replace(SPACING, " ")
    // `47{,}616` is the TeX idiom for a thousands separator.
    .replace(/\{,\}/g, ",")
    // Any command still present has no text to contribute.
    .replace(/\\[a-zA-Z]+\s*/g, "")
    .replace(/\\(.)/g, "$1")
    .replace(/[{}$]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return text;
}

/**
 * Label for a heading whose text may contain TeX.
 *
 * Returns the original when the cleaned form would be empty, so a heading is
 * never reduced to nothing — an unlabelled outline entry is worse than an ugly
 * one.
 */
export function headingLabel(raw: string): string {
  const cleaned = plainTextFromTeX(raw);
  return cleaned || raw.replace(/\s+/g, " ").trim();
}

function hasSingleOuterParenthesisPair(value: string): boolean {
  if (!value.startsWith("(") || !value.endsWith(")")) return false;
  let depth = 0;
  for (let i = 0; i < value.length; i++) {
    if (value[i] === "(") depth++;
    else if (value[i] === ")") depth--;
    if (depth < 0 || (depth === 0 && i < value.length - 1)) return false;
  }
  return depth === 0;
}

/**
 * Plain-text label suitable for page metadata and the visible article `<h1>`.
 *
 * Unlike an in-article heading, a page title is rendered as ordinary text and
 * never passes through KaTeX. Returning the raw heading as a fallback would
 * therefore expose `\boxed{...}` directly in the masthead. A title either has
 * a readable TeX reduction or lets the caller fall back to the source filename.
 *
 * Parentheses are part of this corpus' inline-math delimiter convention, not
 * part of the title. Snake-case algorithm identifiers are also presented with
 * word spacing while their authored spelling remains untouched in the body.
 */
export function titleLabel(raw: string): string {
  let label = plainTextFromTeX(raw);

  while (hasSingleOuterParenthesisPair(label)) label = label.slice(1, -1).trim();

  label = label.replace(/_+/g, " ").replace(/\s+/g, " ").trim();

  // A title must contain semantic text, not only Markdown/TeX punctuation.
  // In the lossy corpus format, `# [` is a display-math opener that the body
  // preprocessor repairs later. Metadata is extracted before preprocessing,
  // so accepting that bracket as a title leaked a structural delimiter into
  // the masthead, breadcrumbs, search index, and document metadata. Unicode
  // letter/number properties keep the rule valid for every authored language.
  return /[\p{L}\p{N}]/u.test(label) ? label : "";
}
