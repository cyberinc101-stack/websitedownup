/**
 * Crowd-sourced "I'm having problems too" reports, separate from our own
 * automated up/down checks. Each report is one entry in a Redis sorted set
 * per domain, scored by timestamp, so counting "in the last 15 minutes" is
 * just trimming old entries and counting what's left.
 * SERVER-ONLY. Fails soft to 0 if Redis isn't configured or unreachable.
 * Contains no secrets.
 */

import "server-only";
import { redisPipeline } from "@/lib/db/redis";

const WINDOW_MS = 15 * 60 * 1000;
const KEY_TTL_SECONDS = 3600; // safety net so an abandoned key doesn't linger
const DAILY_CAP = 500;
const DAILY_KEY_TTL_SECONDS = 90000; // a little over a day, so it always clears

function key(domain: string): string {
  return "pc:reports:" + domain;
}

function dailyKey(domain: string): string {
  return "pc:reports:daily:" + domain + ":" + new Date().toISOString().slice(0, 10);
}

/**
 * True once a domain has hit DAILY_CAP reports today. Being hit is a sign
 * of coordinated or scripted reports, not organic traffic; it exists to
 * cap the damage from that, not to limit normal usage.
 */
export async function dailyCapReached(domain: string): Promise<boolean> {
  const result = await redisPipeline([["GET", dailyKey(domain)]]);
  if (!result) return false;
  const n = Number(result[0]);
  return Number.isFinite(n) && n >= DAILY_CAP;
}

function toCount(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** How many reports for this domain in the last 15 minutes. */
export async function getRecentReportCount(domain: string): Promise<number> {
  const result = await redisPipeline([
    ["ZREMRANGEBYSCORE", key(domain), "-inf", Date.now() - WINDOW_MS],
    ["ZCARD", key(domain)],
  ]);
  if (!result) return 0;
  return toCount(result[1]);
}

/** Records one report and returns the updated 15-minute count. */
export async function addProblemReport(domain: string): Promise<number> {
  const now = Date.now();
  const member = now + ":" + Math.random().toString(36).slice(2, 8);
  const result = await redisPipeline([
    ["ZADD", key(domain), now, member],
    ["EXPIRE", key(domain), KEY_TTL_SECONDS],
    ["ZREMRANGEBYSCORE", key(domain), "-inf", now - WINDOW_MS],
    ["ZCARD", key(domain)],
    ["INCR", dailyKey(domain)],
    ["EXPIRE", dailyKey(domain), DAILY_KEY_TTL_SECONDS],
  ]);
  if (!result) return 0;
  return toCount(result[3]);
}