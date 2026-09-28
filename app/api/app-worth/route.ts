/**
 * GET /api/app-worth?app=<App Store link or id>
 * Returns the app's public facts (listing, ratings by country, US chart
 * positions, developer's other apps). The browser turns them into the
 * report with lib/apps/engine.
 *
 * SECURITY: rate limited per visitor; the app id is validated as digits
 * and only sent to fixed Apple hosts. Free: no key. Contains no secrets.
 */

import { NextResponse, type NextRequest } from "next/server";
import { getAppSignals } from "@/lib/server/appSignals";
import { checkRateLimit, clientKeyFrom } from "@/lib/security/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const REQUESTS_PER_MINUTE = 10;

export async function GET(request: NextRequest) {
  const input = (request.nextUrl.searchParams.get("app") || "").slice(0, 500);

  const allowed = await checkRateLimit("app-worth", clientKeyFrom(request.headers), REQUESTS_PER_MINUTE);
  if (!allowed) {
    return NextResponse.json({ ok: false, error: "Too many lookups in a short time. Wait a minute and try again." }, { status: 429 });
  }

  const result = await getAppSignals(input);
  return NextResponse.json(result, {
    status: result.ok ? 200 : 400,
    headers: { "Cache-Control": "private, max-age=300" },
  });
}
