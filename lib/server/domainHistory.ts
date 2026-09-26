/**
 * Per-domain check history used to compute real uptime statistics shown on
 * /site/[domain] pages. Every completed check (any domain someone looks up,
 * not just the tracked popular list) appends one entry; older entries roll
 * off. Nothing here is estimated or fabricated -- a domain checked once
 * simply has one data point.
 *
 * Storage: one Redis list per domain (pc:v1:hist:<domain>), capped at
 * MAX_ENTRIES most recent checks, expiring after RETENTION_SECONDS of no
 * activity. Without Redis, an in-memory map is used instead (resets on
 * redeploy, same fallback pattern as lib/server/uptimeHistory.ts).
 *
 * SERVER-ONLY. Only ever stores a status + timestamp + response time per
 * check -- no visitor data. Contains no secrets.
 */

import "server-only";
import { isRedisConfigured, redisPipeline } from "@/lib/db/redis";

const KEY_PREFIX = "pc:v1:hist:";
const MAX_ENTRIES = 200;
const RETENTION_SECONDS = 90 * 86400;

export interface HistoryEntry {
  status: "up" | "down";
  responseTimeMs: number | null;
  checkedAt: string;
}

export interface UptimeStats {
  totalChecks: number;
  upChecks: number;
  /** null only when there is no history yet for this domain. */
  uptimePercent: number | null;
  firstCheckedAt: string | null;
  lastDownAt: string | null;
  avgResponseTimeMs: number | null;
}

const memory = new Map<string, HistoryEntry[]>();

function keyFor(domain: string): string {
  return KEY_PREFIX + domain;
}

/** Appends one check result for this domain. Never throws. */
export async function recordDomainCheck(domain: string, entry: HistoryEntry): Promise<void> {
  const list = memory.get(domain) ?? [];
  list.unshift(entry);
  if (list.length > MAX_ENTRIES) list.length = MAX_ENTRIES;
  memory.set(domain, list);

  if (!isRedisConfigured()) return;
  try {
    const key = keyFor(domain);
    await redisPipeline([
      ["LPUSH", key, JSON.stringify(entry)],
      ["LTRIM", key, 0, MAX_ENTRIES - 1],
      ["EXPIRE", key, RETENTION_SECONDS],
    ]);
  } catch {
    // Best-effort only; the in-memory copy above still works for this instance.
  }
}

/** Reads this domain's stored history, most recent first. Never throws. */
export async function getDomainHistory(domain: string): Promise<HistoryEntry[]> {
  if (isRedisConfigured()) {
    try {
      const key = keyFor(domain);
      const result = await redisPipeline([["LRANGE", key, 0, MAX_ENTRIES - 1]]);
      const raw = result && Array.isArray(result[0]) ? (result[0] as unknown[]) : null;
      if (raw && raw.length > 0) {
        const parsed: HistoryEntry[] = [];
        for (const item of raw) {
          if (typeof item !== "string") continue;
          try {
            const value = JSON.parse(item) as HistoryEntry;
            if (
              value &&
              (value.status === "up" || value.status === "down") &&
              typeof value.checkedAt === "string"
            ) {
              parsed.push(value);
            }
          } catch {
            // skip malformed entry
          }
        }
        if (parsed.length > 0) return parsed;
      }
    } catch {
      // fall through to memory
    }
  }
  return memory.get(domain) ?? [];
}

/** Computes real (never fabricated) uptime stats from stored history. */
export async function getUptimeStats(domain: string): Promise<UptimeStats> {
  const history = await getDomainHistory(domain);
  if (history.length === 0) {
    return {
      totalChecks: 0,
      upChecks: 0,
      uptimePercent: null,
      firstCheckedAt: null,
      lastDownAt: null,
      avgResponseTimeMs: null,
    };
  }

  const upChecks = history.filter((h) => h.status === "up").length;
  const lastDown = history.find((h) => h.status === "down") ?? null;
  const oldest = history[history.length - 1];
  const responseTimes = history
    .map((h) => h.responseTimeMs)
    .filter((ms): ms is number => typeof ms === "number");
  const avgResponseTimeMs =
    responseTimes.length > 0
      ? Math.round(responseTimes.reduce((sum, ms) => sum + ms, 0) / responseTimes.length)
      : null;

  return {
    totalChecks: history.length,
    upChecks,
    uptimePercent: Math.round((upChecks / history.length) * 1000) / 10,
    firstCheckedAt: oldest.checkedAt,
    lastDownAt: lastDown ? lastDown.checkedAt : null,
    avgResponseTimeMs,
  };
}
