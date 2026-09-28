/**
 * Small parsing helpers shared by the store lookups.
 * UNTRUSTED DATA: everything here reads third-party JSON defensively.
 * CLIENT-SAFE, pure. Contains no secrets.
 */

export const MAX_TEXT = 120;

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function str(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  return t.length > MAX_TEXT ? t.slice(0, MAX_TEXT - 1) + "…" : t;
}

export function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^0-9.]/g, ""));
    return v.trim() !== "" && Number.isFinite(n) ? n : null;
  }
  return null;
}

export function bool(v: unknown): boolean | null {
  return typeof v === "boolean" ? v : null;
}

/** Accepts ISO strings, "Oct 18, 2010" style dates and millisecond timestamps. */
export function isoDate(v: unknown): string | null {
  if (typeof v !== "string" && typeof v !== "number") return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/** SECURITY: only allow https icons from the stores' own image hosts. */
export function safeIcon(v: unknown, allowedHostSuffixes: string[]): string | null {
  if (typeof v !== "string") return null;
  try {
    const u = new URL(v);
    if (u.protocol !== "https:") return null;
    const host = u.hostname.toLowerCase();
    return allowedHostSuffixes.some((s) => host === s || host.endsWith("." + s)) ? u.toString() : null;
  } catch {
    return null;
  }
}
