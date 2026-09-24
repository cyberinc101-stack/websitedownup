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
 * TODO: add a per-IP rate limit on the checks themselves if abuse appears,
 * since each diagnostics call opens several outbound connections.
 * Contains no secrets.
 */

import { after, NextRequest, NextResponse } from "next/server";
import { getSiteReport } from "@/lib/server/siteReport";
import { clientIpFrom, recordCheck } from "@/lib/activity/checkActivity";

export const dynamic = "force-dynamic";
// DNS, TLS and port checks need Node APIs, so this must not run on the Edge runtime.
export const runtime = "nodejs";

// SECURITY: a valid domain is at most 253 chars; allow some room for a pasted URL.
const MAX_INPUT_LENGTH = 300;

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
