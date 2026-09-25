/**
 * Remembers when each tracked site last answered one of our checks, so
 * "Having problems right now" can tell a real outage from a site that
 * simply blocks automated checks.
 *
 * The rule (applied in lib/server/popularStatus.ts): a failing site only
 * counts as having problems if it answered normally within the last 48
 * hours. A site that has never answered us is almost certainly refusing
 * bots (common for airlines, retailers and banks), not down.
 *
 * Storage: one Redis hash (domain -> last-up time in ms), expiring after
 * 7 days of no updates. Without Redis, a per-instance memory map is used
 * instead (resets on redeploy, same as the live feed fallback).
 *
 * SERVER-ONLY. Only ever stores domains from the fixed lists in
 * lib/sites.ts and lib/watchlist.ts. No visitor data. Contains no secrets.
 */

import "server-only";
import { isRedisConfigured, redisPipeline } from "@/lib/db/redis";

const KEY = "pc:v1:last-up";
const KEY_TTL_SECONDS = 7 * 86400;

const memory = new Map<string, number>();

/** Last time each domain answered, in ms. Domains never seen up are absent. */
export async function readLastUp(domains: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (domains.length === 0) return out;

  if (isRedisConfigured()) {
    const result = await redisPipeline([["HMGET", KEY, ...domains]]);
    const values = result && Array.isArray(result[0]) ? (result[0] as unknown[]) : null;
    if (values) {
      domains.forEach((domain, i) => {
        const raw = values[i];
        const ms = raw === null || raw === undefined ? NaN : Number(raw);
        if (Number.isFinite(ms)) out.set(domain, ms);
      });
      return out;
    }
  }

  // No Redis (or it's unreachable): use this instance's memory.
  for (const domain of domains) {
    const ms = memory.get(domain);
    if (ms !== undefined) out.set(domain, ms);
  }
  return out;
}

/** Marks these domains as having answered at `atMs`. Never throws. */
export async function recordUp(domains: string[], atMs: number): Promise<void> {
  for (const domain of domains) memory.set(domain, atMs);
  if (domains.length === 0 || !isRedisConfigured()) return;

  const fields: Array<string | number> = [];
  for (const domain of domains) fields.push(domain, atMs);
  await redisPipeline([
    ["HSET", KEY, ...fields],
    ["EXPIRE", KEY, KEY_TTL_SECONDS],
  ]);
}
