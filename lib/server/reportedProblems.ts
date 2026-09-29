/**
 * Which domains have enough recent visitor problem reports to be listed in
 * "Having problems right now", even if our own check still says they're up.
 *
 * Built from the site-wide comments feed (lib/server/domainComments.ts), so
 * it adds no new Redis keys. Only "problem" comments count; "working well"
 * comments never do.
 *
 * WHY THE THRESHOLD IS SAFE: a visitor can post one comment per domain per
 * 15 minutes (hashed-IP rate limit in app/api/comments/route.ts), so every
 * problem comment inside the 15-minute window comes from a different
 * visitor. A domain needs MIN_REPORTS of them at once to be listed, and the
 * per-visitor and site-wide hourly limits cap how fast anyone can fake that.
 *
 * SERVER-ONLY. Fails soft to an empty list if Redis isn't configured or is
 * unreachable. Contains no secrets and no visitor identity.
 */

import "server-only";
import { getGlobalComments } from "@/lib/server/domainComments";

const WINDOW_MS = 15 * 60 * 1000;
/** Separate visitors needed within the window before a domain is listed. */
const MIN_REPORTS = 3;
const MAX_LISTED = 20;

export interface ReportedDomain {
  domain: string;
  /** Problem reports from separate visitors in the last 15 minutes. */
  count: number;
}

export async function getReportedDomains(): Promise<ReportedDomain[]> {
  try {
    const snapshot = await getGlobalComments();
    const now = Date.now();
    const counts = new Map<string, number>();
    for (const item of snapshot.items) {
      if (item.kind !== "problem" || !item.domain) continue;
      if (now - item.at > WINDOW_MS) continue;
      counts.set(item.domain, (counts.get(item.domain) || 0) + 1);
    }
    return [...counts.entries()]
      .filter(([, count]) => count >= MIN_REPORTS)
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_LISTED)
      .map(([domain, count]) => ({ domain, count }));
  } catch {
    return [];
  }
}
