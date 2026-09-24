/**
 * Minimal Redis client for Upstash's REST API (works in serverless, no
 * connection pool needed). Used for the live "Recently checked" feed and
 * the "Most checked" ranking.
 *
 * SECURITY-SENSITIVE: reads the Redis REST URL and TOKEN from environment
 * variables. The token grants full read/write access to the database.
 *  - SERVER-ONLY: never import this into a client component.
 *  - Never rename these env vars with a NEXT_PUBLIC_ prefix, and never log
 *    or return the token.
 *  - Set them in Vercel (added automatically when you connect Upstash
 *    Redis from the Storage tab) and in .env.local for local dev.
 *
 * Every function fails soft: if Redis isn't configured or is unreachable,
 * it returns null and the site keeps working without the live features.
 */

import "server-only";

const REQUEST_TIMEOUT_MS = 2000;

export type RedisCommand = Array<string | number>;

// Vercel's Upstash integration uses the KV_* names; Upstash's own
// dashboard uses the UPSTASH_* names. Either works.
function credentials(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
  if (!url || !token) return null;
  return { url: url.replace(/\/+$/, ""), token };
}

export function isRedisConfigured(): boolean {
  return credentials() !== null;
}

/**
 * Runs several commands in one round trip. Returns one result per command
 * (null for any command that errored), or null if the whole call failed.
 */
export async function redisPipeline(commands: RedisCommand[]): Promise<unknown[] | null> {
  const creds = credentials();
  if (!creds || commands.length === 0) return null;

  try {
    const res = await fetch(creds.url + "/pipeline", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + creds.token, // SECURITY: secret, never log
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commands.map((c) => c.map(String))),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) return null;

    const json: unknown = await res.json();
    if (!Array.isArray(json)) return null;
    return json.map((entry) => {
      if (entry && typeof entry === "object" && "result" in entry && !("error" in entry)) {
        return (entry as { result: unknown }).result;
      }
      return null;
    });
  } catch {
    return null;
  }
}
