/**
 * Reading-time estimation.
 *
 * Lives in its own module because the estimate must be identical everywhere it
 * is shown — an article listed as "12 min read" on the home page and "18 min
 * read" on its own page is a defect readers notice. Listing pages have only the
 * Markdown source (compiling the whole corpus to render a list would be
 * wasteful), so the source-level count is the one canonical input.
 *
 * Pure and dependency-free: no filesystem, no framework, directly unit-testable.
 */

/** Average adult reading rate for technical prose. */
export const READING_WORDS_PER_MINUTE = 220;

/**
 * Count words a reader actually reads.
 *
 * Code listings, mathematics, tables, and Markdown punctuation are excluded:
 * counting them inflates long technical articles by a wide margin, because a
 * single `aligned` block can carry more whitespace-separated tokens than the
 * paragraph explaining it.
 *
 * Order matters — fenced blocks are removed before inline patterns, so a `$` or
 * backtick inside a code sample cannot start a spurious match.
 */
export function countProseWords(markdown: string): number {
  const prose = markdown
    .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, " ") // front matter, if present
    .replace(/^( {4}|\t).*$/gm, " ") // indented code
    .replace(/```[\s\S]*?(?:```|$)/g, " ") // fenced code
    .replace(/~~~[\s\S]*?(?:~~~|$)/g, " ")
    .replace(/\$\$[\s\S]*?\$\$/g, " ") // display math
    .replace(/\\\[[\s\S]*?\\\]/g, " ")
    .replace(/\$[^$\n]+\$/g, " ") // inline math
    .replace(/\\\([\s\S]*?\\\)/g, " ")
    .replace(/`[^`\n]*`/g, " ") // inline code
    .replace(/^[ \t]*\|.*\|[ \t]*$/gm, " ") // table rows
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links keep their label
    .replace(/^\s{0,3}\[[^\]]+\]:\s*\S+.*$/gm, " ") // link definitions
    .replace(/<[^>]*>/g, " ") // raw HTML
    .replace(/https?:\/\/\S+/g, " ");

  let count = 0;
  for (const token of prose.split(/\s+/)) {
    if (/[\p{L}\p{N}]/u.test(token)) count++;
  }
  return count;
}

/** Reading time in whole minutes, never below one. */
export function estimateReadingMinutes(wordCount: number): number {
  return Math.max(1, Math.round(wordCount / READING_WORDS_PER_MINUTE));
}
