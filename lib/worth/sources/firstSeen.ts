/**
 * Finds the earliest date a site is known to have been online, using a
 * public web archive's availability endpoint. Asking for the snapshot
 * closest to 1 Jan 1996 returns the oldest one on record.
 *
 * Requests go to a fixed public host, so the user's input never controls
 * where we connect (no SSRF risk). Cached for 7 days: this date only ever
 * moves when the archive backfills older captures.
 *
 * SERVER-ONLY. UNTRUSTED DATA: the response is parsed defensively.
 * UI RULE: never show the archive's name in user-facing text.
 * Contains no secrets.
 */

import "server-only";

const ARCHIVE_URL = "https://archive.org/wayback/available?timestamp=19960101&url=";
const TIMEOUT_MS = 5000;
const CACHE_SECONDS = 604800;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** "20090312154501" -> "2009-03-12T00:00:00.000Z" */
function timestampToIso(ts: string): string | null {
  const m = ts.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return isNaN(d.getTime()) ? null : d.toISOString();
}

export async function lookupFirstSeen(domain: string): Promise<string | null> {
  try {
    const res = await fetch(ARCHIVE_URL + encodeURIComponent(domain), {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: CACHE_SECONDS },
    });
    if (!res.ok) return null;
    const json: unknown = await res.json();
    if (!isRecord(json) || !isRecord(json.archived_snapshots)) return null;
    const closest = json.archived_snapshots.closest;
    if (!isRecord(closest) || typeof closest.timestamp !== "string") return null;
    return timestampToIso(closest.timestamp);
  } catch {
    return null;
  }
}
