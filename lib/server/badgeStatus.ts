/**
 * Cheap, cached status lookup for the /badge/[domain] endpoint. Deliberately
 * separate from lib/server/siteReport.ts: a badge only needs up/down, not
 * the full SSL/DNS/domain-registration diagnostics, so this stays fast and
 * light even when a badge gets embedded on many outside sites.
 *
 * SERVER-ONLY. Contains no secrets.
 */

import "server-only";
import { unstable_cache } from "next/cache";
import { checkDomain, isLikelyValidDomain, normalizeDomain, type CheckResult } from "@/lib/checkSite";

const BADGE_CACHE_SECONDS = 60;

export async function getCachedBadgeStatus(rawInput: string): Promise<CheckResult> {
  const domain = normalizeDomain(rawInput);
  if (!isLikelyValidDomain(domain)) {
    return checkDomain(rawInput);
  }
  const cached = unstable_cache(
    () => checkDomain(domain),
    ["badge-status-v1", domain],
    { revalidate: BADGE_CACHE_SECONDS }
  );
  return cached();
}
