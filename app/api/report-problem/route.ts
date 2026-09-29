/**
 * GET /api/report-problem?domain=x: how many visitors reported a problem
 * with this domain in the last 15 minutes.
 * POST /api/report-problem { domain }: records one report from this
 * visitor.
 * ABUSE GUARDS:
 *  - Same-origin only: rejects requests whose Origin/Referer isn't this
 *    site, which blocks direct script/API hits from outside a browser.
 *  - Rate limit: one report per domain per hashed IP every 15 minutes,
 *    matching the display window, so one visitor can't count twice
 *    within the number they're shown.
 *  - Daily cap: at most 500 reports per domain per day. Hitting it is a
 *    sign of coordinated or scripted reports, not organic traffic; it
 *    caps the damage either way.
 * Public data only (a count). Contains no secrets.
 */

import { NextResponse } from "next/server";
import { normalizeDomain, isLikelyValidDomain } from "@/lib/checkSite";
import { checkRateLimit, clientKeyFrom } from "@/lib/security/rateLimit";
import { getRecentReportCount, addProblemReport, dailyCapReached } from "@/lib/server/problemReports";
import { SITE_URL } from "@/lib/config/site";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const RATE_LIMIT_WINDOW_SECONDS = 900; // matches the 15-minute display window

function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin") || req.headers.get("referer") || "";
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(SITE_URL).origin;
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  const domain = normalizeDomain(new URL(req.url).searchParams.get("domain") || "");
  if (!isLikelyValidDomain(domain)) {
    return NextResponse.json({ error: "Enter a valid domain." }, { status: 400 });
  }
  const count = await getRecentReportCount(domain);
  return NextResponse.json(
    { domain, count },
    { headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=20" } }
  );
}

export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 403 });
  }

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    // fall through to validation below
  }
  const raw = body && typeof body === "object" && "domain" in body ? String((body as { domain: unknown }).domain) : "";
  const domain = normalizeDomain(raw);
  if (!isLikelyValidDomain(domain)) {
    return NextResponse.json({ error: "Enter a valid domain." }, { status: 400 });
  }

  const clientKey = clientKeyFrom(req.headers);
  const [allowed, capped] = await Promise.all([
    checkRateLimit("report-problem:" + domain, clientKey, 1, RATE_LIMIT_WINDOW_SECONDS),
    dailyCapReached(domain),
  ]);

  const canAdd = allowed && !capped;
  const count = canAdd ? await addProblemReport(domain) : await getRecentReportCount(domain);
  return NextResponse.json({ domain, count, alreadyReported: !canAdd });
}