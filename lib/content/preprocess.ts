/**
 * Source normalization (plan §3.1 fidelity + §5.4 transformation policy).
 *
 * The corpus was authored with a non-standard, partly lossy math convention:
 *   - Display math is delimited by a bare `[` and `]`, each alone on a line,
 *     wrapping TeX such as `\boxed{...}` or `\begin{aligned}...\end{aligned}`.
 *   - Inline math appears as parenthesized TeX, e.g. `(\epsilon=10^{-5})`.
 *   - Some blocks carry Markdown-conversion scars: a lone run of `=`/`-`
 *     (setext-underline artifacts) or a stray leading `#` inside an equation.
 *
 * remark-math only understands `$`/`$$`. This pass rewrites the authored
 * convention into standard delimiters and repairs the obvious scars so KaTeX
 * can render at build time, while leaving prose untouched. Every equation's
 * original TeX is still preserved separately by the caller for the source
 * fallback required by plan §11.4.
 *
 * The transform is deliberately conservative: inline parentheses are only
 * treated as math when their contents contain a LaTeX metacharacter
 * (`\ ^ _ { }`), so ordinary prose like "(see above)" or list markers "(a)"
 * are never captured.
 */

/**
 * A display block opens with a lone `[`, optionally carrying a stray Markdown
 * heading marker.
 *
 * The `#` is the same conversion scar `repairMathLine` already strips from
 * lines *inside* an equation, and it also lands on the opening delimiter — the
 * corpus contains 10 such blocks. Without tolerating it the `[` is parsed as a
 * heading whose text is a bracket: the equation renders as literal TeX in a
 * paragraph, an empty-id `<h2>[</h2>` appears in the outline, and the raw TeX
 * pollutes the search index. `# ]` does not occur, so the closing delimiter is
 * matched strictly — loosening it could swallow a genuine heading.
 */
const DISPLAY_OPEN = /^\s*(?:#{1,6}\s*)?\[\s*$/;
// A lossy Markdown pass can carry a blockquote marker from a preceding
// greater-than row onto the structural closer (`> ]`). This form is accepted
// only after a display block has opened, so ordinary blockquotes are unaffected.
const DISPLAY_CLOSE = /^\s*(?:>\s*)?\]\s*$/;

/**
 * Net brace balance contributed by a line of TeX, ignoring escaped braces.
 *
 * Used to decide whether a lone `]` really closes a display block.
 *
 * The authored convention delimits a block with a lone `[` and a lone `]`, but
 * equations contain brackets of their own — this corpus writes `\mathbb E[` on
 * one line and its `]` on another, and treating the first lone `]` as the
 * terminator cut the equation in half.
 *
 * Counting *brackets* to resolve that was wrong: brackets are routinely
 * unbalanced in valid TeX. A half-open interval — `\left[ a,b \right)` or
 * plain `[0,1)` — opens a bracket that never closes, so the counter never
 * returned to zero and the block's real terminator was swallowed instead,
 * dumping raw TeX onto the page.
 *
 * Braces are the reliable signal: in valid TeX they are always balanced, and
 * an equation cut short mid-expression is exactly the case that leaves one
 * open. So a lone `]` terminates the block only where no group is open.
 */
function braceDelta(line: string): number {
  let delta = 0;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === "\\") {
      i++; // skip the escaped character, including `\{` and `\}`
      continue;
    }
    if (char === "{") delta++;
    else if (char === "}") delta--;
  }
  return delta;
}

/**
 * Literal brackets left open after `line`, given `open` already open before it.
 *
 * Brackets alone are an unreliable terminator signal — `\left[ a,b \right)` is a
 * valid half-open interval whose `[` never closes — so `\left[`, `\bigl[` and
 * friends are excluded: those are paired by the `\left`/`\right` machinery, not
 * by bracket matching. What remains is literal indexing such as
 * `H_L[I_k^{\mathrm{logit}},:`, where an unclosed `[` really does mean the
 * equation continues past the next lone `]`.
 *
 * Excluding sized delimiters is not enough on its own, because an interval is
 * just as often written without them: `[t_{valid}^{0},t_{valid}^{1})` closes its
 * bracket with a *parenthesis*. Counting only `[` and `]` left one bracket open
 * per interval, the terminator was never recognised, and the equation was
 * published as raw TeX. A `)` therefore closes an open literal bracket — the
 * mixed-delimiter form is exactly what interval notation is.
 *
 * The count is threaded across lines rather than summed per line, because this
 * corpus breaks equations one token per line and an interval's `[` and `)` can
 * land on either side of a newline.
 */
export interface DelimiterState {
  /** Literal `[` still awaiting a `]` or an interval-closing `)`. */
  brackets: number;
  /** Ordinary `(` still awaiting its `)`. */
  parens: number;
}

/**
 * Parentheses have to be tracked as well, not just counted as bracket closers.
 *
 * Treating every `)` as closing a literal bracket made ordinary function calls
 * cancel real brackets: in a vector written
 *
 *     [
 *     \cos(t\omega_0),\ldots
 *     ]
 *
 * the `)` of `\cos(...)` closed the vector's `[`, so the block's terminator was
 * found at the vector's `]` instead of its own — and everything after it,
 * including the `\tag`, was published as raw TeX.
 *
 * A `)` closes a bracket only when no parenthesis is open. That keeps the
 * mixed-delimiter interval form `[a,b)` working while leaving `f(x)` alone.
 */
function scanDelimiters(line: string, state: DelimiterState): DelimiterState {
  let { brackets, parens } = state;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === "\\") {
      i++; // skip the escaped character
      continue;
    }
    if (char !== "[" && char !== "]" && char !== "(" && char !== ")") continue;
    if (DELIMITER_COMMAND.test(line.slice(0, i))) continue; // a sized delimiter
    if (char === "[") brackets++;
    else if (char === "]") brackets = Math.max(0, brackets - 1);
    else if (char === "(") parens++;
    else if (parens > 0) parens--;
    else if (brackets > 0) brackets--; // interval: `[a,b)`
  }
  return { brackets, parens };
}
const SETEXT_SCAR = /^\s*[=]{3,}\s*$/; // a lone `=======` line inside math
const HR_SCAR = /^\s*[-]{3,}\s*$/;

/**
 * Whether a candidate span is structurally well-formed TeX.
 *
 * This is a *delimiter-level* check, not a judgement about meaning: it asks
 * only whether the span could be a complete expression. Three invariants hold
 * for every valid expression, and a terminator placed in the wrong spot breaks
 * at least one of them:
 *
 *   - braces pair (the one balance TeX always guarantees);
 *   - `\left` pairs with `\right`;
 *   - neither is left dangling without the delimiter it sizes.
 *
 * Used as an oracle so the scanners can *recognise* a bad cut instead of
 * needing a hand-written rule for each construct that causes one.
 */
function isBalancedTeX(s: string): boolean {
  if (braceDelta(s) !== 0) return false;
  const left = (s.match(/\\left(?![a-zA-Z])/g) ?? []).length;
  const right = (s.match(/\\right(?![a-zA-Z])/g) ?? []).length;
  if (left !== right) return false;
  // A trailing `\left` / `\right` / `\bigl` … means the delimiter that belongs
  // to it was taken as the terminator.
  return !DELIMITER_COMMAND.test(s);
}

/**
 * Set literals must use escaped braces to be visible: `\in{1,2}` renders as
 * "∈1,2" because a bare `{…}` is a TeX grouping, not a brace character. Scans
 * for a candidate `{` introduced by a set operator, equality, parenthesized
 * expression, or display-math line. It escapes the balanced pair only when the
 * contents prove it is a set literal; ordinary grouping such as
 * `\in{\mathcal X}` remains untouched.
 */
function escapeSetBraces(s: string): string {
  const setOperator = String.raw`\\(?:in|cup|cap|subset|subseteq|supset|supseteq|setminus|notin)`;
  const opener = new RegExp(
    `(${setOperator}\\s*|=\\s*|\\\\left\\s*\\(\\s*|\\(\\s*|(?:^|\\n)[ \\t]*)\\{`,
    "g",
  );
  const beginsWithSetOperator = new RegExp(`^${setOperator}`);
  let out = "";
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = opener.exec(s)) !== null) {
    const braceIdx = m.index + m[0].length - 1;
    // Find the balanced closing brace.
    let depth = 1;
    let j = braceIdx + 1;
    let topLevelComma = false;
    while (j < s.length && depth > 0) {
      const c = s[j];
      if (c === "\\") {
        j += 2;
        continue;
      }
      if (c === "{") depth++;
      else if (c === "}") depth--;
      else if (c === "," && depth === 1) topLevelComma = true;
      if (depth === 0) break;
      j++;
    }
    const inner = s.slice(braceIdx + 1, j);
    const context = m[1];
    const trimmedInner = inner.trim();
    // A set can be authored as one text-mode group:
    // `e\in{\text{math, code, agent}}`. Its commas are one level below the
    // outer set, but still separate set members rather than function arguments.
    const commaSeparatedText = /\\(?:text|textrm|textbf|textit|textsf|texttt)\{[^{}]*,[^{}]*\}/.test(
      inner,
    );
    // A singleton set can still contain a comma inside the element's index:
    // `S={s_{e,j}}` and `R={\operatorname{expertID}_{j,k}}`. The comma is one
    // brace level below the set, so the top-level-comma test cannot see it.
    // Restrict this repair to a single indexed symbol/name; generic grouping
    // such as `x={a+b}` remains untouched.
    const indexedSingleton = /^(?:(?:\\(?:mathrm|mathbf|mathit|mathsf|mathtt|mathcal|mathbb)\s*)?(?:[A-Za-z][A-Za-z0-9]*|\\[A-Za-z]+)|\\(?:operatorname|mathrm|mathbf|mathit|mathsf|mathtt|mathcal|mathbb)\{[^{}]+\})_\{[^{}]*,[^{}]*\}$/.test(
      trimmedInner,
    );
    // A set operator followed by one scalar element is a singleton literal,
    // even when it has no comma: `A\cup{\bot}`, `A\cup{-100}`, and
    // `A\cup{v_{\mathrm{ignore}}}` all require visible braces. A grouped set
    // symbol such as `x\in{\mathcal X}` deliberately does not match.
    const singletonSetElement =
      /^-?\d+(?:\.\d+)?$/.test(trimmedInner) ||
      /^\\(?:bot|top|emptyset|varnothing)$/.test(trimmedInner) ||
      /^\\(?:text|textrm|textbf|textit|textsf|texttt)\{[\s\S]*\}$/.test(trimmedInner) ||
      /^[A-Za-z][A-Za-z0-9]*(?:\s*[_^]\s*\{[\s\S]+\})+$/.test(trimmedInner);
    const followsSetOperator = beginsWithSetOperator.test(context);
    const provenSetLiteral =
      topLevelComma ||
      commaSeparatedText ||
      indexedSingleton ||
      (followsSetOperator && singletonSetElement);
    if (depth !== 0 || !provenSetLiteral) continue;
    out += s.slice(last, braceIdx) + "\\{" + inner + "\\}";
    last = j + 1;
    opener.lastIndex = last;
  }
  return last === 0 ? s : out + s.slice(last);
}

/** Escape/repair TeX tokens the corpus routinely mangles, which either
 *  hard-error KaTeX or render incorrectly. */
function repairMathFragment(s: string): string {
  return escapeSetBraces(
    s
      // Markdown emphasis mangled braced subscripts `_{…}` into `*{…}`
      // (e.g. `\operatorname{TopK}*{1024}` should be `…_{1024}`). Preserve
      // `\operatorname*{…}`: its star is valid TeX that moves limits beneath a
      // display operator, not a damaged underscore. A later `*{…}` on that same
      // operator is still repaired as its subscript.
      .replace(/(?<!\\operatorname)\*\{/g, "_{")
      // …and single-character subscripts into `*x` (e.g. `\mathcal B}*e` →
      // `\mathcal B}_e`). The `*` must sit between a closing delimiter and an
      // identifier, so a genuine `a * b` product is untouched.
      //
      // `|` and `]` are closers too: a norm writes its order as a subscript on
      // the closing bar — `|E|_F`, `|a_k|_2` — and those were left as `|E|*F`
      // because the character class only listed `}`, `)` and word characters.
      // The subscript itself may be a control sequence rather than a plain
      // character — `\operatorname{SwiGLU}*\ell` means `…_\ell`. Longer literal
      // runs are left alone: those are the braced `*{…}` form handled above.
      .replace(/([}\w)\]|])\*(\\[a-zA-Z]+|[A-Za-z0-9])/g, "$1_$2")
      // KaTeX has no `\textsc` / `\textsl`; unsupported control sequences render
      // as red error text inside an otherwise-fine equation.
      .replace(/\\textsc\b/g, "\\text")
      .replace(/\\textsl\b/g, "\\textit")
      // KaTeX does not implement LaTeX's `\mbox`. With `throwOnError: false` it
      // silently renders only the unsupported command in the error colour, so
      // the surrounding equation appears valid while readers see raw `\mbox`.
      // `\text` has the same non-breaking text-box semantics for this corpus and
      // is processed by the text-group escaping pass below.
      .replace(/\\mbox\b/g, "\\text")
      // `\centernot` comes from an optional LaTeX package that KaTeX does not
      // implement. KaTeX's primitive `\not` applies the same negation overlay
      // to the following relation without emitting a partial error fallback.
      .replace(/\\centernot\b/g, "\\not")
      // KaTeX strict mode rejects these Unicode characters in math mode even
      // though both are legitimate authored text. Emit TeX-safe equivalents
      // that preserve the visible glyph: the full-width bar is part of model
      // control-token syntax, the lower block is SentencePiece's visible-space
      // marker, and three hyphens typeset an em dash in text mode.
      .replace(/｜/g, '\\text{\\char"FF5C}')
      .replace(/▁/g, "\\rule{0.52em}{0.12em}")
      .replace(/—/g, "\\text{---}")
      // A literal percent sign is a TeX comment and silently eats the rest of
      // the equation.
      .replace(/(?<!\\)%/g, "\\%")
      // A bare `[2mm]` / `[1.5mm]` is a row break whose `\\` and spacing were
      // lost. KaTeX
      // renders the `\\[dimen]` optional argument as literal text, so collapse
      // the whole thing to a plain row break (`\\`) — the mm gap is cosmetic.
      .replace(
        /(?<!\\)\[[+-]?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)(?:mm|ex|pt|em)\]/g,
        "\\\\",
      )
      // A lossy conversion collapsed the array-header sequence `\\ \\hline` to
      // `\ \\hline`. The first command is then valid TeX whitespace, so generic
      // undefined-command recovery cannot detect it and KaTeX rejects `\\hline`
      // as if it were outside the array row. Restore only the slash immediately
      // before `\\hline`; ordinary `\ ` spacing remains untouched.
      .replace(/(?<!\\)\\(?=\s+\\hline\b)/g, "\\\\")
      // KaTeX requires escaped braces after \left / \right.
      .replace(/\\left\s*\{/g, "\\left\\{")
      .replace(/\\right\s*\}/g, "\\right\\}")
      // Delimiter-sizing commands follow the same rule. A bare brace starts or
      // ends a TeX group, so `\Bigg{ ... \Bigg}` fails as soon as an alignment
      // marker appears inside it. Escape only braces consumed directly by a
      // sizing command; ordinary grouping braces remain untouched.
      .replace(/\\((?:bigg|Bigg|big|Big)[lrm]?)\s*\{/g, "\\$1\\{")
      .replace(/\\((?:bigg|Bigg|big|Big)[lrm]?)\s*\}/g, "\\$1\\}")
      // Text-mode groups hold prose and identifiers, not notation, yet KaTeX
      // still reads `_ ^ % &` inside them as operators. A snake_case name in a
      // comment — `\text{// fallback when n_decoding_steps absent}` — parses as
      // a double subscript and fails the whole equation, so the reader gets raw
      // TeX. Escaping applies only inside the group, leaving alignment `&`
      // outside it intact; the lookbehind avoids double-escaping.
      .replace(
        /\\(text|textrm|textbf|textit|textsf|texttt)\{([^{}]*)\}/g,
        (_m, command: string, inner: string) =>
          `\\${command}{${inner.replace(/(?<!\\)([_^%&])/g, "\\$1")}}`,
      )
      // A bare `#` is a macro-parameter token (e.g. `\texttt{<|system|># Tools}`).
      .replace(/(?<!\\)#/g, "\\#")
  );
}

function repairMathLine(line: string): string | null {
  // A lone setext-underline scar `=======` stands in for a single `=`.
  if (SETEXT_SCAR.test(line)) return "=";
  // A lone rule scar inside math has no meaning; drop it.
  if (HR_SCAR.test(line)) return null;
  // The lossy Markdown conversion moved a trailing equality sign to a leading
  // single hash: `# 4096^2` followed by `16{,}777{,}216` represents
  // `4096^2 = 16{,}777{,}216`. Restore the relation after the expression. Runs
  // of two or more hashes are a different conversion scar and retain the
  // established marker-removal behavior below.
  const trailingEquality = line.match(/^\s*#(?!#)\s+(.+)$/);
  if (trailingEquality) {
    return `${repairMathFragment(trailingEquality[1])}\n=`;
  }
  // A stray multi-hash Markdown heading marker inside an equation.
  let s = line
    .replace(/^\s*#{2,6}\s+/, "")
    // A leading mathematical `>` can make Markdown continue the blockquote
    // marker onto `\end{...}`. Keep genuine comparison rows (`> 10`) intact,
    // but remove the marker from the structural environment closer.
    .replace(/^\s*>\s+(?=\\end\{)/, "");
  s = repairMathFragment(s);
  // Row separators `\\` in aligned/cases were collapsed to a single trailing
  // backslash, so multi-line equations render as one run-on row. Restore them.
  if (/(?<!\\)\\$/.test(s)) s = s + "\\";
  return s;
}

/**
 * Every position at which the group opened at `open` could close.
 *
 * Parenthesis depth alone identifies the *first* candidate, which is the right
 * answer whenever the parentheses inside the group pair up. In this corpus they
 * routinely do not, and each way they fail moves the true terminator further
 * right:
 *
 *   - a half-open interval — `[a_{ij},b_{ij})`, `[t^{v0}_k,t^{v1}_k)` — closes
 *     a bracket with a parenthesis, contributing a `)` that has no `(`;
 *   - a sized delimiter `\right)` pairs with `\left(` through the
 *     `\left`/`\right` machinery rather than by counting.
 *
 * Either one drives the counter to zero early, so the group is cut
 * mid-expression and the reader is shown raw TeX. Rather than teach the counter
 * about each such construct — the approach that has already needed patching
 * once per construct — every later `)` is offered as a further candidate and
 * `isBalancedTeX` decides which one actually terminates the equation.
 */
function closingCandidates(text: string, open: number): number[] {
  const candidates: number[] = [];
  let depth = 1;
  let innerMath = false;
  for (let j = open + 1; j < text.length; j++) {
    const c = text[j];
    if (c === "$") {
      innerMath = !innerMath;
      continue;
    }
    if (innerMath) continue;
    if (c === "(") depth++;
    else if (c === ")") {
      depth--;
      if (depth <= 0) candidates.push(j);
    }
  }
  return candidates;
}

/**
 * Whether a group's own text carries a TeX metacharacter — the signal that a
 * parenthesised group is mathematics rather than an ordinary prose aside.
 *
 * Characters inside an already-delimited `$…$` span do not count: in
 * "(see $x^2$ above)" the maths is the inner span, and the parentheses are
 * punctuation.
 */
function carriesTeX(s: string): boolean {
  let inMath = false;
  for (const c of s) {
    if (c === "$") {
      inMath = !inMath;
      continue;
    }
    if (!inMath && TEX_METACHARACTER.test(c)) return true;
  }
  return false;
}

function convertInlineMath(text: string): string {
  // The dominant convention: inline math is written as `( … TeX … )`, where the
  // parentheses are the delimiters. Contents routinely nest their own
  // parentheses — both plain (`X^{(0)}`, `\pi_\theta(a_t)`) and sized
  // (`\left( … \left( … \right) … \right)`) — and can be long (whole
  // `\displaystyle` equations in table cells). A single balanced-paren scan
  // handles all of it: `\left(`/`\right)` are just parens to the depth counter,
  // so the whole group is captured and wrapped intact. (An earlier non-greedy
  // `\left(…\right)` pre-pass corrupted nested pairs and was removed.) A group is
  // converted only when its contents carry a TeX metacharacter (`\ { } ^ _`);
  // ordinary prose parentheticals have none and are left untouched.
  let out = "";
  let i = 0;
  let inMath = false;
  let inCode = false;
  while (i < text.length) {
    const ch = text[i];
    // Inline code spans are verbatim — never rewrite their contents.
    if (ch === "`") {
      inCode = !inCode;
      out += ch;
      i++;
      continue;
    }
    if (inCode) {
      out += ch;
      i++;
      continue;
    }
    if (ch === "$") {
      inMath = !inMath;
      out += ch;
      i++;
      continue;
    }
    // A `(` directly after `]` opens a Markdown link/image destination —
    // `[text](url)` / `![alt](src)`. Those URLs routinely contain `_`, `{` or
    // `^`, which would otherwise look like TeX and get rewritten into `$…$`,
    // destroying the link or image entirely.
    if (!inMath && ch === "(" && text[i - 1] === "]") {
      const close = text.indexOf(")", i + 1);
      if (close !== -1) {
        out += text.slice(i, close + 1);
        i = close + 1;
        continue;
      }
    }
    if (!inMath && ch === "(" && text.slice(Math.max(0, i - 5), i) !== "\\left") {
      // Prefer the first candidate that yields a complete expression; fall back
      // to the nearest one so a group with no valid reading behaves exactly as
      // it did before. Only a cut that produces structurally *invalid* TeX is
      // ever moved, which is why well-formed maths is unaffected.
      const candidates = closingCandidates(text, i);
      let j = -1;
      for (const candidate of candidates) {
        if (candidate - i - 1 > 1200) break;
        if (isBalancedTeX(text.slice(i + 1, candidate))) {
          j = candidate;
          break;
        }
      }
      if (j === -1 && candidates.length > 0) j = candidates[0];
      const content = j === -1 ? "" : text.slice(i + 1, j);
      if (
        j !== -1 &&
        carriesTeX(content) &&
        content.length <= 1200 &&
        // A pipe is structural only in a GFM table row. Outside a table it is
        // valid TeX (for example the cardinality `(|\mathcal R|)`) and must not
        // prevent the whole parenthesized expression from becoming math.
        !(TABLE_ROW.test(text) && content.includes("|"))
      ) {
        // Merge any inner $…$ (from step 1) by dropping their delimiters, so the
        // whole group becomes a single, non-nested inline-math span, then repair
        // bare TeX tokens that would otherwise hard-error KaTeX.
        out += "$" + repairMathFragment(content.replace(/\$/g, "")) + "$";
        i = j + 1;
        continue;
      }
    }
    out += ch;
    i++;
  }
  return out;
}

export interface PreprocessResult {
  /** Markdown with normalized math delimiters, ready for remark-math. */
  markdown: string;
  /** Count of display blocks normalized — surfaced in build diagnostics. */
  displayBlocks: number;
  /** Count of inline spans normalized. */
  inlineSpans: number;
}

/** A line that is a GitHub-Flavored Markdown table row. */
const TABLE_ROW = /^\s{0,3}\|.*\|\s*$/;

/** TeX metacharacters that mark a parenthesised group as mathematics. */
const TEX_METACHARACTER = /[\\{}^_]/;

/** A sizing command immediately before a bar, which makes the bar a delimiter. */
const DELIMITER_COMMAND = /\\(?:left|right|middle|bigg?[lr]?|Bigg?[lr]?)\s*$/;

/**
 * Repair mathematics whose `|` was swallowed by a table.
 *
 * The corpus writes inline maths as a parenthesised TeX group. Inside a
 * Markdown table, a `|` in that maths — a conditional bar in
 * `p_\theta(y_t|x_{<t})`, cardinality bars in `|\mathcal S_t|`, a `\middle|` —
 * is read as a cell separator. The equation is torn across two cells, the
 * column count is wrong, and `convertInlineMath` then refuses to touch the
 * fragments (rightly: injecting `$` across a cell boundary would destroy the
 * row). The reader is left looking at raw TeX.
 *
 * Within a table row, a `|` that falls inside an unclosed TeX group is
 * therefore restored to `\mid`, which is what the author wrote. That both
 * repairs the equation and gives the row back its intended column count.
 * Pipes outside such a group are untouched, so ordinary rows are unaffected.
 */
/** Cells in a GFM row, ignoring the leading and trailing pipes. */
function cellCount(line: string): number {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").length;
}

/** `|---|:--:|---|` — the row that fixes a table's column count. */
const TABLE_DELIMITER = /^\s{0,3}\|[\s:|-]+\|\s*$/;

/** Net unescaped parenthesis balance of a fragment. */
function parenDelta(text: string): number {
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "\\") {
      i++;
      continue;
    }
    if (text[i] === "(") depth++;
    else if (text[i] === ")") depth--;
  }
  return depth;
}

/**
 * Rejoin table cells that a `|` inside mathematics split apart.
 *
 * The signal is structural, not statistical: a cell that leaves a parenthesis
 * open cannot be a complete cell, so the equation continues into the next one
 * and the `|` between them was a maths bar. Cells that balance are left exactly
 * as written.
 *
 * Counting cells against the header does not work. In `deepseek-v4-pro` a row
 * whose equation carries two cardinality bars splits into three fragments,
 * which — with its leading step number — lands on exactly the header's four
 * columns. A count test sees a well-formed row and skips it, leaving raw TeX in
 * the cell; a laxer count test merges rows that were always separate and the
 * table renders with blank columns. Parenthesis balance distinguishes them.
 */
function restorePipesInTableMath(line: string, _columns: number | null = null): string {
  if (!TABLE_ROW.test(line) || !line.includes("(")) return line;

  const trimmed = line.trimEnd();
  const indent = trimmed.slice(0, trimmed.length - trimmed.trimStart().length);
  const body = trimmed.trimStart().replace(/^\|/, "").replace(/\|$/, "");
  const parts = body.split("|");
  if (parts.length < 2) return line;

  const out: string[] = [];
  let pending: string | null = null;
  let depth = 0;

  for (const part of parts) {
    if (pending === null) {
      const delta = parenDelta(part);
      if (delta > 0 && TEX_METACHARACTER.test(part)) {
        pending = part;
        depth = delta;
      } else {
        out.push(part);
      }
      continue;
    }
    // Inside a split equation: the boundary we crossed was a maths bar. After a
    // sizing command the bar is a *delimiter* and must be `\vert` — `\middle\mid`
    // is not valid TeX and fails to render.
    pending += `${DELIMITER_COMMAND.test(pending) ? "\\vert " : "\\mid "}${part}`;
    depth += parenDelta(part);
    if (depth <= 0) {
      out.push(pending);
      pending = null;
      depth = 0;
    }
  }
  if (pending !== null) out.push(pending); // never closed; leave what we have

  if (out.length === parts.length) return line; // nothing was joined
  return `${indent}|${out.join("|")}|`;
}

function restorePipesInTableMathUnchecked(line: string): string {
  if (!TABLE_ROW.test(line) || !line.includes("(")) return line;

  /**
   * A `|` inside a TeX group is a maths symbol, not a cell separator.
   *
   * Which symbol depends on context: after a sizing command the bar is a
   * *delimiter* and must be `\vert` — `\middle\mid` is not valid TeX and fails
   * to render. Everywhere else `\mid` gives the relation spacing a conditional
   * bar wants.
   */
  const restore = (group: string) => {
    if (!group.includes("|") || !TEX_METACHARACTER.test(group)) return group;
    return group.replace(/\|/g, (_match, offset: number, whole: string) =>
      DELIMITER_COMMAND.test(whole.slice(0, offset)) ? "\\vert " : "\\mid ",
    );
  };

  let out = "";
  let depth = 0;
  let group = "";

  for (const char of line) {
    if (char === "(") {
      if (depth === 0) group = "";
      depth++;
      group += char;
      continue;
    }
    if (depth > 0) {
      group += char;
      if (char === ")") {
        depth--;
        if (depth === 0) {
          out += restore(group);
          group = "";
        }
      }
      continue;
    }
    out += char;
  }

  // A group left open means its `)` was lost with the rest of the row; repair
  // what is there rather than leaving half an equation behind.
  return depth > 0 ? out + restore(group) : out;
}

/** How a line opens a display block: the prose to keep, and any TeX that
 *  followed the `[` on the same line. */
interface DisplayOpen {
  /** Text before the `[`, emitted as ordinary prose. */
  prefix: string;
  /** TeX that trailed the `[` on the opening line; becomes the first body line. */
  head: string;
}

/**
 * A lossy conversion removed the opening `[\bo` from one trailing
 * `[\boxed{...}]` block, leaving only `xed{` at the end of its prose line.
 * Reconstruct only that exact line-ending token; requiring non-empty prose
 * before it and the normal balanced body/closing `]` checks in the caller keeps
 * ordinary words ending in "xed" out of the math path.
 */
const ORPHANED_BOXED_OPEN = /^(.*\S)\s+xed\{\s*$/;
const ORPHANED_BOXED_AFTER_PROSE = /^(.*\S\))(?:oxed|xed)\{\s*$/;
const ORPHANED_BOXED_GROUP_AFTER_PROSE = /^(.*\S\))\{\s*$/;
const ORPHANED_BOXED_ONLY = /^\s*\\boxed\{\s*$/;

/**
 * A second lossy conversion removed `[\text{PyT` from a comparison immediately
 * after a citation, leaving `orch}` followed by `\neq`, `\text{CUDA}`, and the
 * normal closing `]`. Reconstruct this exact terminal scar only. The caller
 * still requires a balanced TeX body and a real display terminator, preventing
 * an ordinary prose word ending in "orch}" from entering the math pipeline.
 */
const ORPHANED_PYTORCH_OPEN = /^(.*\S\))orch\}\s*$/;
const ORPHANED_TEXT_OPEN =
  /^(.*\S\))([A-Za-z][A-Za-z0-9 /+_.-]*)\}\s*$/;

/**
 * Match a line that opens a display block.
 *
 * The authored convention puts the opening `[` alone on its own line, and that
 * is what `DISPLAY_OPEN` recognises. But the corpus also *runs the delimiter
 * onto the end of the preceding paragraph* — `…per KV-cache group. [` — and
 * sometimes carries the first tokens with it — `…group. [xt{PagedAttention}`.
 * Neither form is a lone bracket, so the block was never recognised, the `$$`
 * was never emitted, and the whole equation was published to the page as raw
 * TeX between literal square brackets.
 *
 * A trailing `[` is also how ordinary Markdown links and references begin, so
 * this form is matched conservatively: nothing after the `[` may close it on
 * the same line, and whatever follows must look like TeX. The caller applies
 * the remaining conditions — a real terminator must exist ahead, and the body
 * must actually carry mathematics — and leaves the line untouched otherwise.
 */
function matchDisplayOpen(line: string): DisplayOpen | null {
  if (DISPLAY_OPEN.test(line)) return { prefix: "", head: "" };
  if (ORPHANED_BOXED_ONLY.test(line)) return { prefix: "", head: "\\boxed{" };
  // A table row is a single structural unit; splitting one around a `[` would
  // destroy the row.
  if (TABLE_ROW.test(line)) return null;
  const orphanedBox = line.match(ORPHANED_BOXED_OPEN);
  if (orphanedBox) return { prefix: orphanedBox[1], head: "\\boxed{" };
  const attachedBox = line.match(ORPHANED_BOXED_AFTER_PROSE);
  if (attachedBox) return { prefix: attachedBox[1], head: "\\boxed{" };
  const bareBoxGroup = line.match(ORPHANED_BOXED_GROUP_AFTER_PROSE);
  if (bareBoxGroup) return { prefix: bareBoxGroup[1], head: "\\boxed{" };
  const orphanedPyTorch = line.match(ORPHANED_PYTORCH_OPEN);
  if (orphanedPyTorch) {
    return { prefix: orphanedPyTorch[1], head: "\\text{PyTorch}" };
  }
  const orphanedText = line.match(ORPHANED_TEXT_OPEN);
  if (orphanedText) {
    return {
      prefix: orphanedText[1],
      head: `\\text{${orphanedText[2]}}`,
    };
  }
  const idx = line.lastIndexOf("[");
  if (idx === -1) return null;
  const prefix = line.slice(0, idx);
  if (prefix.trim() === "") return null; // a lone `[`, already handled above
  const head = line.slice(idx + 1).trim();
  // A `]` on the same line makes this a link, a reference, or an inline
  // bracketed aside — never a display block.
  if (head.includes("]")) return null;
  if (head !== "" && !TEX_METACHARACTER.test(head)) return null;
  return { prefix, head };
}

export function preprocess(source: string): PreprocessResult {
  const lines = source.split(/\r?\n/);
  const out: string[] = [];
  let displayBlocks = 0;
  let inlineSpans = 0;
  let inFence = false;
  let fenceMarker = "";
  /** Column count of the table currently being scanned, if any. */
  let tableColumns: number | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Never touch anything inside a fenced code block.
    const fenceMatch = line.match(/^\s*(```+|~~~+)/);
    if (fenceMatch) {
      if (!inFence) {
        inFence = true;
        fenceMarker = fenceMatch[1][0];
      } else if (line.trim().startsWith(fenceMarker)) {
        inFence = false;
      }
      out.push(line);
      continue;
    }
    if (inFence) {
      out.push(line);
      continue;
    }

    // Track the shape of the table being scanned, so the pipe repair can tell a
    // row split by its own mathematics from one whose cells were always separate.
    if (TABLE_DELIMITER.test(line)) tableColumns = cellCount(line);
    else if (line.trim() === "") tableColumns = null;

    // Display-math block, opened either by a lone `[` or by a `[` that trails
    // prose.
    const opened = matchDisplayOpen(line);
    if (opened) {
      // A block that runs onto the end of a paragraph is the ambiguous form —
      // a trailing `[` is also how a Markdown link begins — so it is held to
      // stricter evidence: the body may not run past the paragraph, and it must
      // actually contain mathematics.
      const trailing = opened.prefix !== "";
      // Look ahead for the matching lone `]`. A `]` that appears while a TeX
      // group is still open belongs to the equation, not to the delimiter.
      let j = i + 1;
      const body: string[] = [];
      let matched = false;
      let openGroups = 0;
      let delimiters: DelimiterState = { brackets: 0, parens: 0 };
      if (opened.head !== "") {
        body.push(opened.head);
        openGroups = Math.max(0, braceDelta(opened.head));
        delimiters = scanDelimiters(opened.head, delimiters);
      }
      while (j < lines.length) {
        const current = lines[j];
        if (DISPLAY_CLOSE.test(current) && openGroups === 0 && delimiters.brackets === 0) {
          matched = true;
          break;
        }
        // An equation never spans a blank line, a heading or a fence. Bounding
        // the ambiguous form at those keeps a stray `[` in prose from swallowing
        // the rest of the document up to some later block's `]`.
        if (trailing && (current.trim() === "" || /^\s*(#{1,6}\s|```|~~~)/.test(current))) break;
        if (DISPLAY_CLOSE.test(current) && delimiters.brackets > 0) {
          // Closes an inner literal bracket, not the block.
          delimiters = { ...delimiters, brackets: delimiters.brackets - 1 };
        } else {
          delimiters = scanDelimiters(current, delimiters);
        }
        openGroups = Math.max(0, openGroups + braceDelta(current));
        body.push(current);
        j++;
      }
      if (trailing && !(matched && body.some((l) => TEX_METACHARACTER.test(l)))) {
        // Not a display block after all — an ordinary line that happens to end
        // in a bracket. Process it as prose.
        out.push(convertInlineMath(restorePipesInTableMath(line, tableColumns)));
        continue;
      }
      if (matched && body.length > 0) {
        if (trailing) out.push(convertInlineMath(restorePipesInTableMath(opened.prefix, tableColumns)));
        const repaired = body
          .map(repairMathLine)
          .filter((l): l is string => l !== null);
        // This corpus breaks display math one token per line, so a set literal
        // can straddle a newline (`\cup` on one line, `{a,\ldots,b}` on the
        // next). Run the brace repair once over the assembled block so those
        // cross-line pairs are seen. It is idempotent w.r.t. the per-line pass.
        const block = escapeSetBraces(repaired.join("\n"));
        // remark-math needs the fenced $$ separated from prose by blank lines.
        if (out.length > 0 && out[out.length - 1].trim() !== "") out.push("");
        out.push("$$");
        out.push(block);
        out.push("$$");
        out.push("");
        displayBlocks++;
        i = j; // skip past the closing `]`
        continue;
      }
      // Unmatched `[` — leave as authored.
      out.push(line);
      continue;
    }

    // Skip inline conversion inside Markdown tables' delimiter rows and
    // reference definitions to avoid corrupting them.
    if (/^\s*\[[^\]]+\]:\s/.test(line)) {
      out.push(line);
      continue;
    }

    const before = line;
    const converted = convertInlineMath(restorePipesInTableMath(line, tableColumns));
    if (converted !== before) {
      inlineSpans += (converted.match(/\$[^$]+\$/g) || []).length;
    }
    out.push(converted);
  }

  return { markdown: out.join("\n"), displayBlocks, inlineSpans };
}
