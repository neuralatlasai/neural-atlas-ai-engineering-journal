import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { stripInternalCitationTokens } from "../lib/content/source-tokens";

describe("internal citation tokens", () => {
  it("removes single and multi-reference transport envelopes", () => {
    assert.equal(
      stripInternalCitationTokens(
        "Evidence. \uE200cite\uE202turn1view0\uE202turn2search3\uE201 Next.",
      ),
      "Evidence.  Next.",
    );
  });

  it("preserves ordinary Unicode text and unrelated private-use characters", () => {
    const text = "Math π and an unrelated \uE200 marker";
    assert.equal(stripInternalCitationTokens(text), text);
  });
});
