/**
 * Characters that are legal in JSON but hazardous inside an inline `<script>`:
 * the HTML-significant trio, plus LINE SEPARATOR (U+2028) and PARAGRAPH
 * SEPARATOR (U+2029).
 *
 * Built with `RegExp` from escape sequences rather than written as a literal —
 * U+2028/U+2029 are invisible in an editor and are silently normalized by some
 * tooling, which would quietly disable half of this guard.
 */
const UNSAFE_IN_SCRIPT = new RegExp("[<>&\\u2028\\u2029]", "g");

/**
 * Emit a schema.org graph as a JSON-LD script (plan §23).
 *
 * Every character that could terminate the block early or break the surrounding
 * JavaScript context is escaped to its `\uXXXX` form. A `</script>` sequence
 * inside a string value is the classic injection vector for inline JSON;
 * U+2028/U+2029 are valid JSON but invalid in a JavaScript string literal. The
 * escapes are transparent to a JSON parser, so consumers read the original text.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(
    UNSAFE_IN_SCRIPT,
    (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`,
  );

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
