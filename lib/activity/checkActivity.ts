/**
 * Records every check and serves the live activity shown to all visitors:
 * "Recently checked" (newest first) and "Most checked" (last ~2 days).
 *
 * LIVE MONITOR: while anyone is on the site, our monitor makes real checks
 * of the next popular sites every MONITOR_INTERVAL_SECONDS and adds them
 * to the feed tagged "monitor" (shown as "auto"). On a cold start (empty
 * monitor list) it checks a whole batch at once so the feed fills
 * immediately instead of trickling in one site per tick. Each check in a
 * batch is capped at MONITOR_CHECK_TIMEOUT_MS -- shorter than checkDomain's
 * normal timeout -- so one slow popular site can't stall the whole batch.
 * The feed always prefers real visitor checks from the last
 * USER_PRIORITY_MINUTES and fills the rest with monitor checks. A Redis
 * lock makes it one monitor tick per interval site-wide, no matter how
 * many visitors are online. No visitors = no checks.
 *
 * SERVER-ONLY. Storage: Upstash Redis via lib/db/redis.ts.
 * FALLBACK: if Redis isn't configured (e.g. localhost, or before you
 * connect it in Vercel), everything runs from server memory instead, so the
 * feed still shows and updates. Memory is per server instance and resets
 * on redeploy, so connect Redis for one truly shared, persistent feed.
 *
 * What gets stored (all public, shown on the homepage):
 *   - the domain, its up/down result, response time and time of check.
 * PRIVACY: we never store who checked it. Visitor IPs are only used, as a
 * one-way hash, for a 60-second rate-limit counter that then expires.
 *
 * SECURITY / ABUSE rules applied before anything is recorded:
 *   - Bots and crawlers are skipped (so Googlebot can't inflate counts).
 *   - The domain must be valid, feed-safe (lib/security/feedFilter.ts),
 *     actually resolve in DNS, and not point at a private address. Junk
 *     and made-up names never reach the public feed.
 *   - Max RATE_LIMIT_PER_MINUTE recorded checks per visitor per minute.
 *   - Stored data is re-validated on read.
 * Contains no secrets (the Redis token lives in lib/db/redis.ts).
 */

import "server-only";
import { createHash } from "node:crypto";
import dns from "node:dns";
import { unstable_cache } from "next/cache";
import { checkDomain, isLikelyValidDomain, normalizeDomain, type CheckResult } from "@/lib/checkSite";
import { POPULAR_SITES } from "@/lib/sites";
import { isRedisConfigured, redisPipeline } from "@/lib/db/redis";
import { isFeedSafeDomain } from "@/lib/security/feedFilter";
import { isBlockedAddress } from "@/lib/security/ssrfGuard";
import type { ActivityFeed, ActivityItem, ActivitySource, ActivityStatus, MostCheckedItem } from "./types";

const KEY_PREFIX = "pc:v1:";
const RECENT_KEY = KEY_PREFIX + "recent";
const RECENT_KEEP = 100;
const COUNT_TTL_SECONDS = 3 * 86400;
const LAST_TTL_SECONDS = 3 * 86400;
const RATE_LIMIT_PER_MINUTE = 10;
const DAY_MS = 86400000;

const MONITOR_KEY = KEY_PREFIX + "monitor";
const MONITOR_KEEP = 20;
const MONITOR_LOCK_KEY = KEY_PREFIX + "monitor-lock";
const MONITOR_INDEX_KEY = KEY_PREFIX + "monitor-index";
/** One monitor tick per this many seconds, site-wide. */
const MONITOR_INTERVAL_SECONDS = 5;
/** Per-site cap inside a monitor batch, so one slow site can't stall the rest. */
const MONITOR_CHECK_TIMEOUT_MS = 4000;
/** Visitor checks newer than this always show before monitor checks. */
const USER_PRIORITY_MINUTES = 30;

const FEED_SIZE = 10;
const MOST_CHECKED_SIZE = 100;

/* In-memory fallback store (used only when Redis isn't configured). */
const memory = {
  recent: [] as string[],
  monitor: [] as string[],
  lastTick: 0,
  index: 0,
  rate: new Map<string, { count: number; resetAt: number }>(),
};

/** SECURITY: per-visitor rate limit for the memory fallback (60s window). */
function memoryRateAllowed(key: string): boolean {
  const now = Date.now();
  if (memory.rate.size > 5000) {
    for (const [k, v] of memory.rate) if (v.resetAt < now) memory.rate.delete(k);
  }
  const current = memory.rate.get(key);
  if (!current || current.resetAt < now) {
    memory.rate.set(key, { count: 1, resetAt: now + 60000 });
    return true;
  }
  current.count++;
  return current.count <= RATE_LIMIT_PER_MINUTE;
}

const BOT_USER_AGENT = /bot|crawl|spider|slurp|preview|monitor|headless|lighthouse|curl|wget|python|axios|node-fetch|go-http/i;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function dayKey(daysAgo: number): string {
  return KEY_PREFIX + "count:" + new Date(Date.now() - daysAgo * DAY_MS).toISOString().slice(0, 10);
}

function lastKey(domain: string): string {
  return KEY_PREFIX + "last:" + domain;
}

export function isLikelyBot(userAgent: string | null): boolean {
  return !userAgent || BOT_USER_AGENT.test(userAgent);
}

/**
 * The visitor's IP as reported by Vercel's edge (x-forwarded-for is set by
 * Vercel, not the browser, on deployed sites). Only ever used hashed.
 */
export function clientIpFrom(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") || "unknown";
}

// PRIVACY: one-way hash so raw IPs are never written to storage.
function hashIp(ip: string): string {
  return createHash("sha256").update("rate-limit:" + ip).digest("hex").slice(0, 24);
}

async function resolvesPublicly(domain: string): Promise<boolean> {
  try {
    const addresses = await dns.promises.lookup(domain, { all: true });
    return addresses.length > 0 && addresses.every((a) => !isBlockedAddress(a.address));
  } catch {
    return false;
  }
}

/** Races a promise against a timeout, resolving to `fallback` if it's slower than `ms`. */
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      }
    );
  });
}

/** SECURITY: stored entries are re-validated before use. */
function parseEntry(raw: unknown): ActivityItem | null {
  if (typeof raw !== "string") return null;
  try {
    const v: unknown = JSON.parse(raw);
    if (!v || typeof v !== "object") return null;
    const e = v as Record<string, unknown>;
    if (typeof e.d !== "string" || !isLikelyValidDomain(e.d) || !isFeedSafeDomain(e.d)) return null;
    if (e.s !== "up" && e.s !== "down") return null;
    if (typeof e.t !== "string" || isNaN(new Date(e.t).getTime())) return null;
    const ms = typeof e.ms === "number" && isFinite(e.ms) ? Math.round(e.ms) : null;
    const source: ActivitySource = e.src === "m" ? "monitor" : "user";
    return { domain: e.d, status: e.s, responseTimeMs: ms, checkedAt: e.t, source };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Write                                                               */
/* ------------------------------------------------------------------ */

export interface RecordInput {
  domain: string;
  status: ActivityStatus;
  responseTimeMs: number | null;
}

/**
 * Records one check. Never throws and never slows the visitor down: call it
 * inside next/server `after()` so it runs once the response is sent.
 */
export async function recordCheck(
  input: RecordInput,
  meta: { ip: string; userAgent: string | null }
): Promise<void> {
  if (isLikelyBot(meta.userAgent)) return;

  const domain = normalizeDomain(input.domain);
  if (!isLikelyValidDomain(domain) || !isFeedSafeDomain(domain)) return;
  if (!(await resolvesPublicly(domain))) return;

  if (!isRedisConfigured()) {
    if (!memoryRateAllowed(hashIp(meta.ip))) return;
    memory.recent.unshift(
      JSON.stringify({ d: domain, s: input.status, ms: input.responseTimeMs, t: new Date().toISOString() })
    );
    memory.recent.length = Math.min(memory.recent.length, RECENT_KEEP);
    return;
  }

  // SECURITY: per-visitor rate limit (60 second window).
  const rateKey = KEY_PREFIX + "rl:" + hashIp(meta.ip);
  const rate = await redisPipeline([
    ["INCR", rateKey],
    ["EXPIRE", rateKey, 60],
  ]);
  if (!rate || Number(rate[0]) > RATE_LIMIT_PER_MINUTE) return;

  const entry = JSON.stringify({
    d: domain,
    s: input.status,
    ms: input.responseTimeMs,
    t: new Date().toISOString(),
  });
  const today = dayKey(0);

  await redisPipeline([
    ["LPUSH", RECENT_KEY, entry],
    ["LTRIM", RECENT_KEY, 0, RECENT_KEEP - 1],
    ["ZINCRBY", today, 1, domain],
    ["EXPIRE", today, COUNT_TTL_SECONDS],
    ["SET", lastKey(domain), entry, "EX", LAST_TTL_SECONDS],
  ]);
}

/**
 * Makes real monitor checks if none has run in the last
 * MONITOR_INTERVAL_SECONDS (site-wide lock). Call inside `after()` from
 * requests that show the feed. Never throws.
 * SECURITY: only checks the fixed popular list, never user input.
 */
/** Checks `count` popular sites starting after position `end - count`, each capped at MONITOR_CHECK_TIMEOUT_MS. */
async function monitorBatch(end: number, count: number): Promise<string[]> {
  const sites = Array.from({ length: count }, (_, i) => POPULAR_SITES[(end - count + i) % POPULAR_SITES.length]);
  const results = await Promise.all(
    sites.map((site) =>
      withTimeout<CheckResult>(checkDomain(site.domain), MONITOR_CHECK_TIMEOUT_MS, {
        input: site.domain,
        domain: site.domain,
        status: "down",
        statusCode: null,
        responseTimeMs: null,
        checkedAt: new Date().toISOString(),
        error: "Timed out",
      })
    )
  );
  return results.map((result, i) =>
    JSON.stringify({
      d: sites[i].domain,
      s: result.status,
      ms: result.responseTimeMs,
      t: new Date().toISOString(),
      src: "m",
    })
  );
}

export async function runMonitorTick(): Promise<void> {
  if (POPULAR_SITES.length === 0) return;

  // Normally one site per tick. If the monitor list is short (fresh start),
  // catch up in one go so the feed is full straight away.
  const batchFor = (have: number) => Math.min(Math.max(FEED_SIZE - have, 1), FEED_SIZE);

  if (!isRedisConfigured()) {
    const now = Date.now();
    if (now - memory.lastTick < MONITOR_INTERVAL_SECONDS * 1000) return;
    memory.lastTick = now;
    const batch = batchFor(memory.monitor.length);
    memory.index += batch;
    const entries = await monitorBatch(memory.index, batch);
    memory.monitor.unshift(...entries);
    memory.monitor.length = Math.min(memory.monitor.length, MONITOR_KEEP);
    return;
  }

  const lock = await redisPipeline([
    ["SET", MONITOR_LOCK_KEY, "1", "NX", "EX", MONITOR_INTERVAL_SECONDS],
    ["LLEN", MONITOR_KEY],
  ]);
  if (!lock || lock[0] !== "OK") return; // another request already ran this tick

  const batch = batchFor(Number(lock[1]) || 0);
  const indexResult = await redisPipeline([["INCRBY", MONITOR_INDEX_KEY, batch]]);
  const end = Math.max(batch, Number(indexResult ? indexResult[0] : batch) || batch);
  const entries = await monitorBatch(end, batch);

  await redisPipeline([
    ["LPUSH", MONITOR_KEY, ...entries],
    ["LTRIM", MONITOR_KEY, 0, MONITOR_KEEP - 1],
  ]);
}

/* ------------------------------------------------------------------ */
/* Read                                                                */
/* ------------------------------------------------------------------ */

async function readRecentActivity(): Promise<ActivityFeed> {
  const updatedAt = new Date().toISOString();

  const result = isRedisConfigured()
    ? await redisPipeline([
        ["LRANGE", RECENT_KEY, 0, RECENT_KEEP - 1],
        ["LRANGE", MONITOR_KEY, 0, MONITOR_KEEP - 1],
      ])
    : [memory.recent.slice(), memory.monitor.slice()];
  const parseList = (raw: unknown): ActivityItem[] =>
    (Array.isArray(raw) ? raw : []).map(parseEntry).filter((i): i is ActivityItem => i !== null);
  const userItems = parseList(result ? result[0] : null);
  const monitorItems = parseList(result ? result[1] : null);

  // Priority: fresh visitor checks, then monitor checks, then older visitor
  // checks. One row per domain (newest wins), displayed newest first.
  const freshCutoff = Date.now() - USER_PRIORITY_MINUTES * 60000;
  const isFresh = (i: ActivityItem) => new Date(i.checkedAt).getTime() >= freshCutoff;
  const ordered = [
    ...userItems.filter(isFresh),
    ...monitorItems,
    ...userItems.filter((i) => !isFresh(i)),
  ];

  const seen = new Set<string>();
  const picked: ActivityItem[] = [];
  for (const item of ordered) {
    if (seen.has(item.domain)) continue;
    seen.add(item.domain);
    picked.push(item);
    if (picked.length >= FEED_SIZE) break;
  }
  picked.sort((a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime());

  return { enabled: true, items: picked, updatedAt };
}

async function readMostChecked(): Promise<MostCheckedItem[]> {
  if (!isRedisConfigured()) return [];

  const ranges = await redisPipeline([
    ["ZREVRANGE", dayKey(0), 0, MOST_CHECKED_SIZE * 2 - 1, "WITHSCORES"],
    ["ZREVRANGE", dayKey(1), 0, MOST_CHECKED_SIZE * 2 - 1, "WITHSCORES"],
  ]);
  if (!ranges) return [];

  // Sum today + yesterday so the list isn't empty just after midnight UTC.
  const totals = new Map<string, number>();
  for (const range of ranges) {
    if (!Array.isArray(range)) continue;
    for (let i = 0; i + 1 < range.length; i += 2) {
      const domain = String(range[i]);
      const score = Number(range[i + 1]);
      if (!isLikelyValidDomain(domain) || !isFeedSafeDomain(domain) || !isFinite(score)) continue;
      totals.set(domain, (totals.get(domain) ?? 0) + score);
    }
  }

  const top = Array.from(totals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, MOST_CHECKED_SIZE);
  if (top.length === 0) return [];

  const lasts = await redisPipeline([["MGET", ...top.map(([d]) => lastKey(d))]]);
  const lastValues = lasts && Array.isArray(lasts[0]) ? lasts[0] : [];

  return top.map(([domain, checks], i) => {
    const last = parseEntry(lastValues[i]);
    return {
      domain,
      checks: Math.round(checks),
      lastStatus: last ? last.status : null,
      lastCheckedAt: last ? last.checkedAt : null,
    };
  });
}

/** Cached 5s: the feed feels live but Redis sees at most ~12 reads a minute. */
export const getRecentActivity = unstable_cache(readRecentActivity, ["recent-activity-v3"], {
  revalidate: 5,
});

/** Cached 60s. */
export const getMostChecked = unstable_cache(readMostChecked, ["most-checked-v1"], {
  revalidate: 60,
});