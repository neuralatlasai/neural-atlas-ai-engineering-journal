/**
 * Remove private source-system citation envelopes that have no public target.
 *
 * Tokens such as `U+E200 cite U+E202 turn… U+E201` are transport metadata, not
 * authored prose or resolvable Markdown references. Keeping the exact private-
 * use envelope makes the transform conservative: ordinary Unicode text and
 * valid links are never changed.
 */
const INTERNAL_CITATION = /\uE200cite(?:\uE202[^\uE201\r\n]*)?\uE201/gu;

export function stripInternalCitationTokens(input: string): string {
  return input.replace(INTERNAL_CITATION, "");
}
