/**
 * GET /api/worth/speed?domain=example.com
 * Runs (or returns the cached) mobile lab speed test for the Website Worth
 * report. Slow on a cache miss (10-30s), so the report loads without it and
 * updates when this answers.
 *
 * SECURITY: rate limited per visitor (the speed test has a daily quota).
 * Contains no secrets.
 */

import { NextResponse, type NextRequest } from "next/server";
import { getSpeedResult } from "@/lib/server/worthSpeed";
import { checkRateLimit, clientKeyFrom } from "@/lib/security/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const REQUESTS_PER_MINUTE = 6;

export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get("domain") || "";

  const allowed = await checkRateLimit("worth-speed", clientKeyFrom(request.headers), REQUESTS_PER_MINUTE);
  if (!allowed) {
    return NextResponse.json({ error: "Too many speed tests in a short time." }, { status: 429 });
  }

  const result = await getSpeedResult(domain);
  if (!result) {
    return NextResponse.json({ error: "Enter a valid public website address." }, { status: 400 });
  }
  return NextResponse.json(result, {
    headers: { "Cache-Control": "private, max-age=3600" },
  });
}
