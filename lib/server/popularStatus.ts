/**
 * Live status of the popular sites list (lib/sites.ts), for the homepage
 * grid, the Having problems box, and the ranked Top 100 checks.
 *
 * Also exposes getProblemsSnapshot(), a wider check that adds
 * lib/watchlist.ts on top of the Top 100 so "Having problems right now"
 * can surface outages on generally popular sites that are not part of
 * the ranked grid. That wider check uses a shorter first-pass timeout
 * (PROBLEMS_TIMEOUT_MS) so a batch of ~180+ sites still returns quickly.
 *
 * AVOIDING FALSE "DOWN" RESULTS (three layers):
 *  1. Two passes. Every failing site (timeouts included) is checked a
 *     second time after a short pause, with a longer timeout and lower
 *     concurrency, so a stall caused by our own burst of requests does
 *     not count as an outage.
 *  2. Grace window. A site that answered us within the last
 *     TRANSIENT_GRACE_MS and fails now is treated as a blip and kept
 *     "up". It only turns "down" if it keeps failing past the window.
 *  3. Bot-block detection. Failing sites that have not answered us in
 *     the last RECENT_UP_WINDOW_MS are marked `unverified` (almost
 *     certainly blocking our checker) and kept out of "Having problems".
 *     History lives in lib/server/uptimeHistory.ts.
 *
 * CONCURRENCY: checks run CHECK_CONCURRENCY at a time rather than all at
 * once. Firing 180+ connections simultaneously overwhelms home routers
 * (every check then times out) and can hit connection limits on Vercel.
 *
 * SERVER-ONLY. Results are kept in Vercel's built-in data cache for
 * CACHE_SECONDS (2 minutes), tagged with SNAPSHOT_CACHE_TAG so the refresh
 * endpoint (app/api/cron/refresh-status) can force a rebuild without any
 * visitor. Between rebuilds every visitor gets the same snapshot instantly.
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
/** Cache tag shared by both snapshots; revalidateTag() on it forces a rebuild. */
export const SNAPSHOT_CACHE_TAG = "status-snapshots";
/**
 * Responses slower than this are listed as "slow" in Having problems.
 * Slow sites still count as Live (green) everywhere else.
 */
const SLOW_THRESHOLD_MS = 6000;
/** First-pass timeout for the Top 100 check. */
const POPULAR_TIMEOUT_MS = 8000;
/** First-pass timeout for the wider watch-list check (see file header). */
const PROBLEMS_TIMEOUT_MS = 7000;
/** Second-pass timeout for sites that failed the first pass. */
const RETRY_TIMEOUT_MS = 10000;
/** Pause before the second pass so a brief network stall can clear. */
const RETRY_DELAY_MS = 1500;
/** The second pass runs gentler than the first. */
const RETRY_CONCURRENCY = 6;
/** Skip the second pass if the first already used this much time (function limit is 60s). */
const RETRY_CUTOFF_MS = 40000;
/** How many sites are checked at the same time. */
const CHECK_CONCURRENCY = 20;
/** A failing site only counts as having problems if it answered within this window. */
const RECENT_UP_WINDOW_MS = 48 * 3600 * 1000;
/** A site that answered within this window and fails now is treated as a blip, not an outage. */
const TRANSIENT_GRACE_MS = 6 * 60 * 1000;

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

interface HistoryVerdict {
  /** Failing and not seen working in the last 48 hours (likely blocking bots). */
  isUnverified: (domain: string) => boolean;
  /** Failing but seen working a few minutes ago (likely a blip). */
  isTransient: (domain: string) => boolean;
}

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Two-pass check. Pass 1 checks every site. Pass 2 re-checks everything
 * that failed (timeouts included), after a pause, with a longer timeout and
 * lower concurrency, and keeps the second result.
 */
async function checkAll(sites: Site[], firstPassTimeoutMs: number): Promise<CheckResult[]> {
  const started = Date.now();
  const results = await mapLimit(sites, CHECK_CONCURRENCY, (s) =>
    checkDomain(s.domain, firstPassTimeoutMs)
  );

  const failedIndexes: number[] = [];
  results.forEach((r, i) => {
    if (r.status !== "up") failedIndexes.push(i);
  });
  if (failedIndexes.length === 0 || Date.now() - started > RETRY_CUTOFF_MS) return results;

  await sleep(RETRY_DELAY_MS);
  const retried = await mapLimit(failedIndexes, RETRY_CONCURRENCY, (i) =>
    checkDomain(sites[i].domain, RETRY_TIMEOUT_MS)
  );
  failedIndexes.forEach((index, n) => {
    results[index] = retried[n];
  });
  return results;
}

/**
 * Records which sites answered, and returns tests for which failing
 * sites are probably blocking us (unverified) or just blipped (transient).
 */
async function historyCheck(sites: Site[], results: CheckResult[]): Promise<HistoryVerdict> {
  const now = Date.now();
  const upDomains: string[] = [];
  const failing: string[] = [];
  sites.forEach((site, i) => {
    if (results[i].status === "up") upDomains.push(site.domain);
    else failing.push(site.domain);
  });

  const [lastUp] = await Promise.all([readLastUp(failing), recordUp(upDomains, now)]);
  return {
    isUnverified: (domain) => {
      const at = lastUp.get(domain);
      return at === undefined || now - at > RECENT_UP_WINDOW_MS;
    },
    isTransient: (domain) => {
      const at = lastUp.get(domain);
      return at !== undefined && now - at <= TRANSIENT_GRACE_MS;
    },
  };
}

function toStatus(site: Site, rank: number, r: CheckResult, verdict: HistoryVerdict): PopularSiteStatus {
  // One failed check on a site that answered a few minutes ago is a blip.
  if (r.status !== "up" && verdict.isTransient(site.domain)) {
    return {
      rank,
      domain: site.domain,
      name: site.name,
      category: site.category,
      state: "up",
      statusCode: null,
      responseTimeMs: null,
      error: null,
      unverified: false,
    };
  }

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
    unverified: state === "down" && verdict.isUnverified(site.domain),
  };
}

async function buildSnapshot(): Promise<PopularSnapshot> {
  const results = await checkAll(POPULAR_SITES, POPULAR_TIMEOUT_MS);
  const verdict = await historyCheck(POPULAR_SITES, results);
  const sites = POPULAR_SITES.map((site, i) => toStatus(site, i + 1, results[i], verdict));
  return { checkedAt: new Date().toISOString(), sites };
}

async function buildProblemsSnapshot(): Promise<PopularSnapshot> {
  const results = await checkAll(ALL_WATCH_SITES, PROBLEMS_TIMEOUT_MS);
  const verdict = await historyCheck(ALL_WATCH_SITES, results);
  const sites = ALL_WATCH_SITES.map((site, i) => toStatus(site, i + 1, results[i], verdict));
  return { checkedAt: new Date().toISOString(), sites };
}

export const getPopularSnapshot = unstable_cache(buildSnapshot, ["popular-snapshot-v4"], {
  revalidate: CACHE_SECONDS,
  tags: [SNAPSHOT_CACHE_TAG],
});

export const getProblemsSnapshot = unstable_cache(buildProblemsSnapshot, ["problems-snapshot-v3"], {
  revalidate: CACHE_SECONDS,
  tags: [SNAPSHOT_CACHE_TAG],
});
