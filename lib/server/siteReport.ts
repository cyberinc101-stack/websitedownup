/**
 * Builds the full site report used by the /site/[domain] page and /api/check.
 * This is the ONE place pages and API routes should get check results from.
 *
 * SERVER-ONLY.
 * SECURITY: runs the SSRF pre-check before anything else. lib/checkSite.ts
 * uses the global fetch, which can't take our guarded DNS lookup, so this
 * pre-check is what protects it. (A small DNS-rebinding window remains for
 * that one fetch; the diagnostics themselves are guarded at connect time.)
 * CACHING: getCachedSiteReport keeps each domain's report for 60 seconds
 * in Vercel's data cache. When a big site goes down and thousands of people
 * search at once, only one report per minute is built instead of one per
 * visitor. The "Check again" button uses getSiteReport directly, so it's
 * always fresh.
 * Contains no secrets.
 */

import "server-only";
import { unstable_cache } from "next/cache";
import {
  checkDomain,
  isLikelyValidDomain,
  normalizeDomain,
  type CheckResult,
} from "@/lib/checkSite";
import { isPublicHost } from "@/lib/security/ssrfGuard";
import { runDiagnostics } from "@/lib/diagnostics/runDiagnostics";
import type { Diagnostics } from "@/lib/diagnostics/types";
import { recordDomainCheck } from "@/lib/server/domainHistory";

export interface SiteReport extends CheckResult {
  diagnostics?: Diagnostics | null;
}

export async function getSiteReport(
  rawInput: string,
  options: { diagnostics: boolean }
): Promise<SiteReport> {
  const domain = normalizeDomain(rawInput);

  // SECURITY: refuse domains that resolve to private/internal addresses.
  if (isLikelyValidDomain(domain) && !(await isPublicHost(domain))) {
    return {
      input: rawInput,
      domain,
      status: "down",
      statusCode: null,
      responseTimeMs: null,
      checkedAt: new Date().toISOString(),
      error: "This domain points to a private network address, so it can't be checked.",
      diagnostics: null,
    };
  }

  if (!options.diagnostics) {
    return checkDomain(rawInput);
  }

  const [result, diagnostics] = await Promise.all([
    checkDomain(rawInput),
    runDiagnostics(rawInput),
  ]);
  await recordDomainCheck(domain, {
    status: result.status,
    responseTimeMs: result.responseTimeMs,
    checkedAt: result.checkedAt,
  });
  return { ...result, diagnostics };
}

const REPORT_CACHE_SECONDS = 60;

/**
 * Same as getSiteReport(domain, { diagnostics: true }), cached per domain
 * for 60 seconds. Invalid inputs skip the cache (they return instantly
 * anyway, and caching them would let junk URLs fill the cache).
 */
export async function getCachedSiteReport(rawInput: string): Promise<SiteReport> {
  const domain = normalizeDomain(rawInput);
  if (!isLikelyValidDomain(domain)) {
    return getSiteReport(rawInput, { diagnostics: true });
  }
  const cached = unstable_cache(
    () => getSiteReport(domain, { diagnostics: true }),
    ["site-report-v1", domain],
    { revalidate: REPORT_CACHE_SECONDS }
  );
  return cached();
}
