/**
 * Live status of the popular sites list (lib/sites.ts), for the homepage
 * grid, the outage alert bar, and the "Having problems right now" box.
 * Checks all 100 sites in parallel (each has its own 9s timeout).
 *
 * SERVER-ONLY. No database: results are kept in Vercel's built-in data
 * cache for CACHE_SECONDS (2 minutes). Every visitor in that window gets the same
 * snapshot instantly, and after it expires the next visitor still gets the
 * last snapshot while a fresh one is built in the background. So we run one
 * batch of checks per 2 minutes no matter how much traffic there is, and
 * none at all when nobody is on the site.
 *
 * SECURITY: only checks the fixed, trusted list in lib/sites.ts, never user
 * input, so no SSRF pre-check is needed here.
 * Contains no secrets.
 */

import "server-only";
import { unstable_cache } from "next/cache";
import { checkDomain, type CheckResult } from "@/lib/checkSite";
import { POPULAR_SITES } from "@/lib/sites";

const CACHE_SECONDS = 120;
/**
 * Responses slower than this are listed as "slow" in Having problems.
 * Slow sites still count as Live (green) everywhere else.
 */
const SLOW_THRESHOLD_MS = 6000;

export type PopularState = "up" | "slow" | "down";

export interface PopularSiteStatus {
  /** 1 = most popular (position in lib/sites.ts). */
  rank: number;
  domain: string;
  name: string;
  category: string;
  state: PopularState;
  statusCode: number | null;
  responseTimeMs: number | null;
  error: string | null;
}

export interface PopularSnapshot {
  checkedAt: string;
  sites: PopularSiteStatus[];
}

async function checkWithRetry(domain: string): Promise<CheckResult> {
  const first = await checkDomain(domain);
  if (first.status === "up") return first;
  // One retry filters out brief network blips before we call a big site "down".
  return checkDomain(domain);
}

async function buildSnapshot(): Promise<PopularSnapshot> {
  const results = await Promise.all(POPULAR_SITES.map((s) => checkWithRetry(s.domain)));

  const sites = POPULAR_SITES.map((site, i): PopularSiteStatus => {
    const r = results[i];
    let state: PopularState = r.status === "up" ? "up" : "down";
    if (state === "up" && r.responseTimeMs !== null && r.responseTimeMs > SLOW_THRESHOLD_MS) {
      state = "slow";
    }
    return {
      rank: i + 1,
      domain: site.domain,
      name: site.name,
      category: site.category,
      state,
      statusCode: r.statusCode,
      responseTimeMs: r.responseTimeMs,
      error: r.error ?? null,
    };
  });

  return { checkedAt: new Date().toISOString(), sites };
}

export const getPopularSnapshot = unstable_cache(buildSnapshot, ["popular-snapshot-v2"], {
  revalidate: CACHE_SECONDS,
});
