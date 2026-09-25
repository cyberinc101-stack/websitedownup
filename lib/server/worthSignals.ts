/**
 * SERVER-ONLY entry point for Website Worth data. Pages and routes call
 * getWorthSignals(); never call collectSignals directly.
 *
 *  - SECURITY: runs the SSRF pre-check before any connection is made.
 *  - Caches successful results for 12 hours (shared across visitors) so
 *    popular domains don't trigger fresh checks on every view. Failed
 *    checks are not cached, so a site that was briefly down gets a fresh
 *    look next time.
 *  - Adds the popularity rank after the cache, so updated rank data shows
 *    immediately after a deploy.
 * Contains no secrets.
 */

import "server-only";
import { unstable_cache } from "next/cache";
import { isLikelyValidDomain, normalizeDomain } from "@/lib/checkSite";
import { isPublicHost } from "@/lib/security/ssrfGuard";
import { collectSignals, type SignalsWithoutRank } from "@/lib/worth/collectSignals";
import { lookupRank } from "@/lib/worth/sources/rank";
import type { WorthSignals } from "@/lib/worth/types";

const CACHE_SECONDS = 43200;
const CACHE_VERSION = "v1";

export type WorthSignalsResult =
  | { ok: true; signals: WorthSignals }
  | { ok: false; status: 400 | 422; error: string };

async function collectCached(domain: string): Promise<SignalsWithoutRank> {
  let uncacheable: SignalsWithoutRank | null = null;

  const load = unstable_cache(
    async () => {
      const result = await collectSignals(domain);
      if (result.page === null) {
        // Throwing keeps failures out of the cache.
        uncacheable = result;
        throw new Error("uncacheable");
      }
      return result;
    },
    ["worth-signals", CACHE_VERSION, domain],
    { revalidate: CACHE_SECONDS }
  );

  try {
    return await load();
  } catch {
    return uncacheable ?? collectSignals(domain);
  }
}

export async function getWorthSignals(rawInput: string): Promise<WorthSignalsResult> {
  const domain = normalizeDomain(rawInput);
  if (!isLikelyValidDomain(domain)) {
    return { ok: false, status: 400, error: "Enter a website address like example.com." };
  }
  // SECURITY: never connect to hosts that resolve to private addresses.
  if (!(await isPublicHost(domain))) {
    return { ok: false, status: 422, error: "This domain points to a private network address, so it wasn't checked." };
  }

  const base = await collectCached(domain);
  return { ok: true, signals: { ...base, rank: lookupRank(domain) } };
}
