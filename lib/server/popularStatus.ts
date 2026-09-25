/**
 * Live status of the popular sites list (lib/sites.ts), for the homepage
 * grid, the outage alert bar, and the ranked Top 100 checks.
 *
 * Also exposes getProblemsSnapshot(), a wider check that adds
 * lib/watchlist.ts on top of the Top 100 so "Having problems right now"
 * can surface outages on generally popular sites that are not part of
 * the ranked grid. That wider check uses a single attempt and a shorter
 * timeout (PROBLEMS_TIMEOUT_MS) rather than the Top 100's retry-and-
 * confirm behavior, so a batch of ~180+ sites still returns quickly; the
 * ranked Top 100 keeps its slower, more careful double-check.
 *
 * SERVER-ONLY. No database: results are kept in Vercel's built-in data
 * cache for CACHE_SECONDS (2 minutes). Every visitor in that window gets the same
 * snapshot instantly, and after it expires the next visitor still gets the
 * last snapshot while a fresh one is built in the background. So we run one
 * batch of checks per 2 minutes no matter how much traffic there is, and
 * none at all when nobody is on the site.
 *
 * SECURITY: only checks the fixed, trusted lists in lib/sites.ts and
 * lib/watchlist.ts, never user input, so no SSRF pre-check is needed here.
 * Contains no secrets.
 */

import "server-only";
import { unstable_cache } from "next/cache";
import { checkDomain, type CheckResult } from "@/lib/checkSite";
import { POPULAR_SITES } from "@/lib/sites";
import { EXTRA_WATCH_SITES } from "@/lib/watchlist";

const CACHE_SECONDS = 120;
/**
 * Responses slower than this are listed as "slow" in Having problems.
 * Slow sites still count as Live (green) everywhere else.
 */
const SLOW_THRESHOLD_MS = 6000;
/** Shorter timeout for the wider watch-list check, no retry (see file header). */
const PROBLEMS_TIMEOUT_MS = 7000;

const ALL_WATCH_SITES = [...POPULAR_SITES, ...EXTRA_WATCH_SITES];

export type PopularState = "up" | "slow" | "down";

export interface PopularSiteStatus {
  /** 1 = most popular (position in lib/sites.ts, or the combined watch list). */
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

function toStatus(site: { domain: string; name: string; category: string }, rank: number, r: CheckResult): PopularSiteStatus {
  let state: PopularState = r.status === "up" ? "up" : "down";
  if (state === "up" && r.responseTimeMs !== null && r.responseTimeMs > SLOW_THRESHOLD_MS) {
    state = "slow";
  }
  return {
    rank,
    domain: site.domain,
    name: site.name,
    category: site.category,
    state,
    statusCode: r.statusCode,
    responseTimeMs: r.responseTimeMs,
    error: r.error ?? null,
  };
}

async function buildSnapshot(): Promise<PopularSnapshot> {
  const results = await Promise.all(POPULAR_SITES.map((s) => checkWithRetry(s.domain)));
  const sites = POPULAR_SITES.map((site, i) => toStatus(site, i + 1, results[i]));
  return { checkedAt: new Date().toISOString(), sites };
}

async function buildProblemsSnapshot(): Promise<PopularSnapshot> {
  const results = await Promise.all(
    ALL_WATCH_SITES.map((s) => checkDomain(s.domain, PROBLEMS_TIMEOUT_MS))
  );
  const sites = ALL_WATCH_SITES.map((site, i) => toStatus(site, i + 1, results[i]));
  return { checkedAt: new Date().toISOString(), sites };
}

export const getPopularSnapshot = unstable_cache(buildSnapshot, ["popular-snapshot-v2"], {
  revalidate: CACHE_SECONDS,
});

export const getProblemsSnapshot = unstable_cache(buildProblemsSnapshot, ["problems-snapshot-v1"], {
  revalidate: CACHE_SECONDS,
});