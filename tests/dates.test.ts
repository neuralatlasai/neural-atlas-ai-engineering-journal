import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseAuthoredDate, toIsoDate, toRfc822 } from "../lib/content/dates";

describe("parseAuthoredDate", () => {
  it("parses the ISO form", () => {
    assert.deepEqual(parseAuthoredDate("2026-07-20"), { year: 2026, month: 7, day: 20 });
  });

  it("parses an ISO datetime by taking the calendar date", () => {
    assert.deepEqual(parseAuthoredDate("2026-07-20T13:45:00Z"), {
      year: 2026,
      month: 7,
      day: 20,
    });
  });

  it("parses the month-first prose form the corpus uses", () => {
    assert.deepEqual(parseAuthoredDate("June 16, 2026"), { year: 2026, month: 6, day: 16 });
    assert.deepEqual(parseAuthoredDate("Jun 16 2026"), { year: 2026, month: 6, day: 16 });
    assert.deepEqual(parseAuthoredDate("March 3rd, 2026"), { year: 2026, month: 3, day: 3 });
  });

  it("parses the day-first prose form", () => {
    assert.deepEqual(parseAuthoredDate("16 June 2026"), { year: 2026, month: 6, day: 16 });
  });

  it("rejects impossible calendar dates", () => {
    assert.equal(parseAuthoredDate("2026-02-31"), null);
    assert.equal(parseAuthoredDate("February 30, 2026"), null);
  });

  it("returns null for prose it does not recognize", () => {
    for (const value of ["sometime in spring", "Q3 2026", "", null, undefined, "2026"]) {
      assert.equal(parseAuthoredDate(value), null, `should not parse: ${String(value)}`);
    }
  });
});

describe("toIsoDate", () => {
  it("does not shift the day across timezones", () => {
    // Regression: `new Date("June 16, 2026").toISOString()` parses to local
    // midnight and then converts to UTC, yielding 2026-06-15 east of Greenwich.
    assert.equal(toIsoDate("June 16, 2026"), "2026-06-16");
    assert.equal(toIsoDate("2026-01-01"), "2026-01-01");
    assert.equal(toIsoDate("December 31, 2026"), "2026-12-31");
  });

  it("zero-pads month and day", () => {
    assert.equal(toIsoDate("March 3, 2026"), "2026-03-03");
  });

  it("is undefined for unparseable input", () => {
    assert.equal(toIsoDate("sometime in spring"), undefined);
    assert.equal(toIsoDate(null), undefined);
  });
});

describe("toRfc822", () => {
  it("emits a GMT-anchored RFC 822 date", () => {
    // 2026-06-16 is a Tuesday.
    assert.equal(toRfc822("June 16, 2026"), "Tue, 16 Jun 2026 00:00:00 GMT");
  });

  it("agrees with toIsoDate on the calendar day", () => {
    for (const value of ["2026-01-01", "June 16, 2026", "16 June 2026"]) {
      const iso = toIsoDate(value);
      const rfc = toRfc822(value);
      assert.ok(iso && rfc);
      const [, month, day] = iso.split("-");
      assert.ok(rfc.includes(day), `${rfc} should contain day ${day}`);
      assert.ok(Number(month) >= 1 && Number(month) <= 12);
    }
  });

  it("is undefined for unparseable input", () => {
    assert.equal(toRfc822("Q3 2026"), undefined);
  });
});
