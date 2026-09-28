/**
 * Remove private source-system citation envelopes that have no public target.
 *
 * Tokens such as `U+E200 cite U+E202 turn… U+E201` are transport metadata, not
 * authored prose or resolvable Markdown references. Keeping the exact private-
 * use envelope makes the transform conservative: ordinary Unicode text and
 * valid links are never changed.
 */
const INTERNAL_CITATION = /\uE200cite(?:\uE202[^\uE201\r\n]*)?\uE201/gu;
// Require the complete transport grammar; authored links, provenance labels,
// and incomplete or unrelated directives are not private citation envelopes.
const SERIALIZED_CONTENT_REFERENCE = /:chatgpt-content-reference\{index="[0-9]+"\}/g;

export function stripInternalCitationTokens(input: string): string {
  return input.replace(INTERNAL_CITATION, "").replace(SERIALIZED_CONTENT_REFERENCE, "");
}
