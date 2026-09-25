/**
 * Number, money and date formatting for the Website Worth report.
 * Estimates are rounded to a few significant figures on purpose: showing
 * "$184,532" would claim a precision the estimate doesn't have.
 *
 * CLIENT-SAFE, pure functions. Contains no secrets.
 */

export const DAYS_PER_MONTH = 365.25 / 12;

/** Rounds to `sig` significant figures (184532 -> 180000 at sig 2). */
export function roundSig(n: number, sig: number): number {
  if (!Number.isFinite(n) || n === 0) return 0;
  const magnitude = Math.floor(Math.log10(Math.abs(n)));
  const factor = Math.pow(10, magnitude - sig + 1);
  return Math.round(n / factor) * factor;
}

function trimZero(text: string): string {
  return text.replace(/\.0$/, "");
}

/** $0.42, $18, $2,400, $184K, $2.4M, $1.1B */
export function formatMoney(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "$0";
  if (n >= 1e9) return "$" + trimZero((n / 1e9).toFixed(1)) + "B";
  if (n >= 1e6) return "$" + trimZero((n / 1e6).toFixed(1)) + "M";
  if (n >= 1e5) return "$" + Math.round(n / 1e3) + "K";
  if (n >= 100) return "$" + roundSig(n, 2).toLocaleString("en-US");
  if (n >= 10) return "$" + Math.round(n);
  return "$" + n.toFixed(2);
}

/** Full-width money for the headline value: $184,000 or $2.4M. */
export function formatMoneyLong(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "$0";
  if (n >= 1e7) return formatMoney(n);
  return "$" + Math.round(n).toLocaleString("en-US");
}

/** 840, 12.4K, 3.1M, 1.2B */
export function formatCount(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0";
  if (n >= 1e9) return trimZero((n / 1e9).toFixed(1)) + "B";
  if (n >= 1e6) return trimZero((n / 1e6).toFixed(1)) + "M";
  if (n >= 1e4) return trimZero((n / 1e3).toFixed(1)) + "K";
  if (n >= 100) return roundSig(n, 2).toLocaleString("en-US");
  if (n >= 10) return String(Math.round(n));
  return n < 1 ? "<1" : String(Math.round(n));
}

export function formatRank(n: number): string {
  return "#" + n.toLocaleString("en-US");
}

/** "12 Mar 2009" */
export function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export function yearsSince(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (isNaN(t)) return null;
  return Math.max(0, (Date.now() - t) / (365.25 * 86400000));
}

export function formatAge(years: number | null): string | null {
  if (years === null) return null;
  if (years < 1) {
    const months = Math.max(1, Math.round(years * 12));
    return months + (months === 1 ? " month" : " months");
  }
  const whole = Math.floor(years);
  return whole + (whole === 1 ? " year" : " years");
}
