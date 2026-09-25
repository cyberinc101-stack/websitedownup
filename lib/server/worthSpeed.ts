/**
 * SERVER-ONLY entry point for the Website Worth speed test.
 * Successful results are cached for 24 hours (shared across visitors),
 * which keeps usage well inside the speed-test quota. Failures aren't
 * cached. Contains no secrets (the API key is read in speedTest.ts).
 */

import "server-only";
import { unstable_cache } from "next/cache";
import { isLikelyValidDomain, normalizeDomain } from "@/lib/checkSite";
import { isPublicHost } from "@/lib/security/ssrfGuard";
import { runSpeedTest } from "@/lib/worth/sources/speedTest";
import type { SpeedResult } from "@/lib/worth/types";

const CACHE_SECONDS = 86400;
const CACHE_VERSION = "v1";

export async function getSpeedResult(rawInput: string): Promise<SpeedResult | null> {
  const domain = normalizeDomain(rawInput);
  if (!isLikelyValidDomain(domain)) return null;
  if (!(await isPublicHost(domain))) return null;

  let failure: SpeedResult | null = null;
  const load = unstable_cache(
    async () => {
      const result = await runSpeedTest(domain);
      if (!result.ok) {
        failure = result;
        throw new Error("uncacheable");
      }
      return result;
    },
    ["worth-speed", CACHE_VERSION, domain],
    { revalidate: CACHE_SECONDS }
  );

  try {
    return await load();
  } catch {
    return failure;
  }
}
