/**
 * SECURITY: simple fixed-window rate limit for routes that trigger outgoing
 * requests (e.g. the Website Worth checks), so one visitor can't use the
 * site to hammer other sites or burn through the speed-test quota.
 *
 * PRIVACY: the visitor's IP is hashed (SHA-256, truncated) before use, and
 * the key expires after the window (60s). Raw IPs are never stored.
 *
 * Fails open: without Redis (or if Redis is unreachable) requests are
 * allowed, and the routes' result caches still limit repeat work.
 * SERVER-ONLY. Contains no secrets.
 */

import "server-only";
import { createHash } from "node:crypto";
import { redisPipeline } from "@/lib/db/redis";

export function clientKeyFrom(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  const ip = (forwarded ? forwarded.split(",")[0] : headers.get("x-real-ip") || "unknown").trim();
  return createHash("sha256").update(ip).digest("hex").slice(0, 24);
}

/** Returns true when the request is allowed. */
export async function checkRateLimit(bucket: string, clientKey: string, limit: number, windowSeconds = 60): Promise<boolean> {
  const key = "pc:rl:" + bucket + ":" + clientKey;
  const result = await redisPipeline([
    ["SET", key, 0, "EX", windowSeconds, "NX"],
    ["INCR", key],
  ]);
  if (!result) return true;
  const count = Number(result[1]);
  return !Number.isFinite(count) || count <= limit;
}
