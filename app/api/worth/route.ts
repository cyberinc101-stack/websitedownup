/**
 * GET /api/worth?domain=example.com
 * Returns the raw facts (WorthSignals) the Website Worth report is built
 * from. The browser turns them into the report with lib/worth/engine.
 *
 * SECURITY: rate limited per visitor; SSRF pre-check happens in
 * lib/server/worthSignals.ts. Contains no secrets.
 */

import { NextResponse, type NextRequest } from "next/server";
import { getWorthSignals } from "@/lib/server/worthSignals";
import { checkRateLimit, clientKeyFrom } from "@/lib/security/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const REQUESTS_PER_MINUTE = 12;

export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get("domain") || "";

  const allowed = await checkRateLimit("worth", clientKeyFrom(request.headers), REQUESTS_PER_MINUTE);
  if (!allowed) {
    return NextResponse.json({ error: "Too many checks in a short time. Wait a minute and try again." }, { status: 429 });
  }

  const result = await getWorthSignals(domain);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.signals, {
    headers: { "Cache-Control": "private, max-age=300" },
  });
}
