/**
 * GET /api/check?domain=example.com[&diagnostics=1]
 *
 * Public API route used by the homepage checker (fast, no diagnostics) and
 * the "Check again" button on site pages (with diagnostics).
 * Each check is also recorded for the live feed / most checked lists, after
 * the response is sent (see lib/activity/checkActivity.ts).
 *
 * SECURITY: all checks go through lib/server/siteReport.ts, which applies
 * the SSRF guard. Input length is capped below. Recording is rate-limited
 * per visitor inside recordCheck.
 * RATE LIMITS (per hashed IP, so the site can't be used to hammer other
 * sites; each diagnostics call opens several outbound connections):
 *  - quick checks: 60 per minute
 *  - checks with diagnostics: 12 per minute
 *  - the same site: 8 per minute (quick and diagnostics combined)
 * Over the limit returns 429. Fails open if Redis isn't configured.
 * Contains no secrets.
 */

import { after, NextRequest, NextResponse } from "next/server";
import { getSiteReport } from "@/lib/server/siteReport";
import { clientIpFrom, recordCheck } from "@/lib/activity/checkActivity";
import { normalizeDomain, isLikelyValidDomain } from "@/lib/checkSite";
import { checkRateLimit, clientKeyFrom } from "@/lib/security/rateLimit";

export const dynamic = "force-dynamic";
// DNS, TLS and port checks need Node APIs, so this must not run on the Edge runtime.
export const runtime = "nodejs";

// SECURITY: a valid domain is at most 253 chars; allow some room for a pasted URL.
const MAX_INPUT_LENGTH = 300;

const QUICK_LIMIT_PER_MINUTE = 60;
const DIAGNOSTICS_LIMIT_PER_MINUTE = 12;
const SAME_SITE_LIMIT_PER_MINUTE = 8;

export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get("domain");
  if (!domain) {
    return NextResponse.json(
      { error: "Missing ?domain= parameter." },
      { status: 400 }
    );
  }
  if (domain.length > MAX_INPUT_LENGTH) {
    return NextResponse.json(
      { error: "That input is too long to be a domain." },
      { status: 400 }
    );
  }

  // The homepage checker calls without ?diagnostics=1 and stays fast.
  const wantDiagnostics = req.nextUrl.searchParams.get("diagnostics") === "1";

  // Per-visitor limits, checked in order so a refusal stops later counters.
  const clientKey = clientKeyFrom(req.headers);
  let allowed = await checkRateLimit(
    wantDiagnostics ? "check-diag" : "check",
    clientKey,
    wantDiagnostics ? DIAGNOSTICS_LIMIT_PER_MINUTE : QUICK_LIMIT_PER_MINUTE,
    60
  );
  const normalized = normalizeDomain(domain);
  if (allowed && isLikelyValidDomain(normalized)) {
    allowed = await checkRateLimit("check-site:" + normalized, clientKey, SAME_SITE_LIMIT_PER_MINUTE, 60);
  }
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many checks in a short time. Please wait a minute and try again." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  const report = await getSiteReport(domain, { diagnostics: wantDiagnostics });

  const ip = clientIpFrom(req.headers);
  const userAgent = req.headers.get("user-agent");
  after(() =>
    recordCheck(
      { domain: report.domain, status: report.status, responseTimeMs: report.responseTimeMs },
      { ip, userAgent }
    )
  );

  return NextResponse.json(report);
}
