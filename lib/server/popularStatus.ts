/**
 * Live status of the popular sites list (lib/sites.ts), for the homepage
 * grid, the outage alert bar, and the ranked Top 100 checks.
 *
 * Also exposes getProblemsSnapshot(), a wider check that adds
 * lib/watchlist.ts on top of the Top 100 so "Having problems right now"
 * can surface outages on generally popular sites that are not part of
 * the ranked grid. That wider check uses a shorter timeout
 * (PROBLEMS_TIMEOUT_MS) and re-checks only the sites that failed, so a
 * batch of ~180+ sites still returns quickly.
 *
 * TELLING OUTAGES FROM BOT BLOCKING: many big sites (airlines, retailers,
 * banks) refuse or stall automated requests, which looks exactly like
 * "no response". So every failing site is compared with its history in
 * lib/server/uptimeHistory.ts: if it answered us within the last
 * RECENT_UP_WINDOW_MS it's a real problem; if it hasn't, it's marked
 * `unverified` (almost certainly blocking our checker) and kept out of
 * "Having problems right now".
 *
 * CONCURRENCY: checks run CHECK_CONCURRENCY at a time rather than all at
 * once. Firing 180+ connections simultaneously overwhelms home routers
 * (every check then times out) and can hit connection limits on Vercel.
 *
 * SERVER-ONLY. Results are kept in Vercel's built-in data cache for
 * CACHE_SECONDS (2 minutes). Every visitor in that window gets the same
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
import { readLastUp, recordUp } from "@/lib/server/uptimeHistory";

const CACHE_SECONDS = 120;
/**
 * Responses slower than this are listed as "slow" in Having problems.
 * Slow sites still count as Live (green) everywhere else.
 */
const SLOW_THRESHOLD_MS = 6000;
/** Shorter timeout for the wider watch-list check (see file header). */
const PROBLEMS_TIMEOUT_MS = 7000;
/** How many sites are checked at the same time. */
const CHECK_CONCURRENCY = 20;
/** A failing site only counts as having problems if it answered within this window. */
const RECENT_UP_WINDOW_MS = 48 * 3600 * 1000;

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
  /**
   * True when the site is failing but hasn't answered us in the last 48
   * hours: almost certainly blocking automated checks rather than down.
   * Never shown in "Having problems right now".
   */
  unverified: boolean;
}

export interface PopularSnapshot {
  checkedAt: string;
  sites: PopularSiteStatus[];
}

type Site = { domain: string; name: string; category: string };

/** Runs `fn` over `items`, at most `limit` at a time, keeping the original order. */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function checkWithRetry(domain: string): Promise<CheckResult> {
  const first = await checkDomain(domain);
  if (first.status === "up") return first;
  // One retry filters out brief network blips before we call a big site "down".
  return checkDomain(domain);
}

/**
 * Records which sites answered, and returns a test for which failing
 * sites haven't answered recently (so are most likely blocking us).
 */
async function historyCheck(sites: Site[], results: CheckResult[]): Promise<(domain: string) => boolean> {
  const now = Date.now();
  const upDomains: string[] = [];
  const failing: string[] = [];
  sites.forEach((site, i) => {
    if (results[i].status === "up") upDomains.push(site.domain);
    else failing.push(site.domain);
  });

  const [lastUp] = await Promise.all([readLastUp(failing), recordUp(upDomains, now)]);
  return (domain) => {
    const at = lastUp.get(domain);
    return at === undefined || now - at > RECENT_UP_WINDOW_MS;
  };
}

function toStatus(site: Site, rank: number, r: CheckResult, unverified: boolean): PopularSiteStatus {
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
    unverified: state === "down" && unverified,
  };
}

async function buildSnapshot(): Promise<PopularSnapshot> {
  const results = await mapLimit(POPULAR_SITES, CHECK_CONCURRENCY, (s) => checkWithRetry(s.domain));
  const isUnverified = await historyCheck(POPULAR_SITES, results);
  const sites = POPULAR_SITES.map((site, i) => toStatus(site, i + 1, results[i], isUnverified(site.domain)));
  return { checkedAt: new Date().toISOString(), sites };
}

async function buildProblemsSnapshot(): Promise<PopularSnapshot> {
  const results = await mapLimit(ALL_WATCH_SITES, CHECK_CONCURRENCY, (s) =>
    checkDomain(s.domain, PROBLEMS_TIMEOUT_MS)
  );

  // Re-check only the failures once, to filter out brief network blips.
  const failedIndexes = results.map((r, i) => (r.status === "up" ? -1 : i)).filter((i) => i >= 0);
  const retried = await mapLimit(failedIndexes, CHECK_CONCURRENCY, (i) =>
    checkDomain(ALL_WATCH_SITES[i].domain, PROBLEMS_TIMEOUT_MS)
  );
  failedIndexes.forEach((index, n) => {
    results[index] = retried[n];
  });

  const isUnverified = await historyCheck(ALL_WATCH_SITES, results);
  const sites = ALL_WATCH_SITES.map((site, i) => toStatus(site, i + 1, results[i], isUnverified(site.domain)));
  return { checkedAt: new Date().toISOString(), sites };
}

export const getPopularSnapshot = unstable_cache(buildSnapshot, ["popular-snapshot-v3"], {
  revalidate: CACHE_SECONDS,
});

export const getProblemsSnapshot = unstable_cache(buildProblemsSnapshot, ["problems-snapshot-v2"], {
  revalidate: CACHE_SECONDS,
});
