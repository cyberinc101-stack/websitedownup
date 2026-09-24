/**
 * Small formatting helpers shared by the report components.
 * All dates are formatted in UTC so server and browser render identical
 * text (avoids React hydration mismatches).
 * Contains no data or security logic.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const DASH = "\u2014";

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return DASH;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return DASH;
  return d.getUTCDate() + " " + MONTHS[d.getUTCMonth()] + " " + d.getUTCFullYear();
}

export function plural(n: number, singular: string, pluralForm?: string): string {
  return n + " " + (n === 1 ? singular : pluralForm ?? singular + "s");
}

/** "in 29 days" / "expired 3 days ago" */
export function daysText(days: number): string {
  if (days < 0) return "expired " + plural(Math.abs(days), "day") + " ago";
  return plural(days, "day") + " left";
}

/** Strips the protocol and trailing slash for compact display. */
export function shortUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}
