/**
 * GET /api/report-problem?domain=x: how many visitors reported a problem
 * with this domain in the last 15 minutes.
 * POST /api/report-problem { domain }: records one report from this
 * visitor. Rate-limited the same way as the Worth checks: one report per
 * domain per hashed IP every 5 minutes.
 * Public data only (a count). Contains no secrets.
 */

import { NextResponse } from "next/server";
import { normalizeDomain, isLikelyValidDomain } from "@/lib/checkSite";
import { checkRateLimit, clientKeyFrom } from "@/lib/security/rateLimit";
import { getRecentReportCount, addProblemReport } from "@/lib/server/problemReports";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
  const allowed = await checkRateLimit("report-problem:" + domain, clientKey, 1, 300);
  const count = allowed ? await addProblemReport(domain) : await getRecentReportCount(domain);
  return NextResponse.json({ domain, count, alreadyReported: !allowed });
}