/**
 * Authored-date parsing.
 *
 * Corpus dates are free-form prose ("June 16, 2026", "2026-07-20"), and both
 * the RSS feed and the JSON-LD graph need them in strict machine formats.
 *
 * `new Date(value).toISOString()` is the obvious implementation and it is
 * wrong: a date-only string parses to *local* midnight, so converting to UTC
 * moves it to the previous day everywhere east of Greenwich — "June 16, 2026"
 * was being published as `2026-06-15`. The same call also makes the build
 * machine's timezone an input, which breaks reproducibility (plan §3.2).
 *
 * So the two shapes the corpus actually uses are parsed explicitly into
 * calendar parts, with no `Date` involved in interpreting the input. Anything
 * else yields `null`: an unrecognized date is omitted rather than guessed,
 * because a wrong `pubDate` silently reorders readers' feeds.
 */

/** A timezone-free calendar date. */
export interface CalendarDate {
  year: number;
  /** 1–12. */
  month: number;
  /** 1–31. */
  day: number;
}

const MONTH_NAMES = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/;
const MONTH_FIRST = /^([A-Za-z]+)\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})$/;
const DAY_FIRST = /^(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\.?,?\s+(\d{4})$/;

function monthFromName(name: string): number | null {
  const needle = name.toLowerCase();
  const index = MONTH_NAMES.findIndex(
    (month) => month === needle || month.slice(0, 3) === needle.slice(0, 3),
  );
  return index === -1 ? null : index + 1;
}

/** Reject impossible dates such as `2026-02-31`, which regexes happily accept. */
function isRealDate({ year, month, day }: CalendarDate): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const probe = new Date(Date.UTC(year, month - 1, day));
  return (
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day
  );
}

/** Parse an authored date string, or return `null` if it is not recognized. */
export function parseAuthoredDate(value: string | null | undefined): CalendarDate | null {
  if (!value) return null;
  const text = value.trim();

  const iso = ISO_DATE.exec(text);
  if (iso) {
    const date = { year: Number(iso[1]), month: Number(iso[2]), day: Number(iso[3]) };
    return isRealDate(date) ? date : null;
  }

  const monthFirst = MONTH_FIRST.exec(text);
  if (monthFirst) {
    const month = monthFromName(monthFirst[1]);
    if (month === null) return null;
    const date = { year: Number(monthFirst[3]), month, day: Number(monthFirst[2]) };
    return isRealDate(date) ? date : null;
  }

  const dayFirst = DAY_FIRST.exec(text);
  if (dayFirst) {
    const month = monthFromName(dayFirst[2]);
    if (month === null) return null;
    const date = { year: Number(dayFirst[3]), month, day: Number(dayFirst[1]) };
    return isRealDate(date) ? date : null;
  }

  return null;
}

const pad = (value: number, width = 2) => String(value).padStart(width, "0");

/** `YYYY-MM-DD` for `datePublished`, or `undefined` when unparseable. */
export function toIsoDate(value: string | null | undefined): string | undefined {
  const date = parseAuthoredDate(value);
  if (!date) return undefined;
  return `${pad(date.year, 4)}-${pad(date.month)}-${pad(date.day)}`;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/**
 * RFC 822 date for RSS `pubDate`, pinned to 00:00:00 GMT.
 *
 * The corpus records a publication *day*, not a time; anchoring to UTC midnight
 * keeps the emitted feed identical on every build machine.
 */
export function toRfc822(value: string | null | undefined): string | undefined {
  const date = parseAuthoredDate(value);
  if (!date) return undefined;
  const utc = new Date(Date.UTC(date.year, date.month - 1, date.day));
  const weekday = WEEKDAYS[utc.getUTCDay()];
  const month = MONTHS_SHORT[date.month - 1];
  return `${weekday}, ${pad(date.day)} ${month} ${pad(date.year, 4)} 00:00:00 GMT`;
}
