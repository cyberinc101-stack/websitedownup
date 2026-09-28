/**
 * GET /api/app-search?q=<app name>
 * Returns up to 8 matching App Store apps (id, name, developer, icon,
 * rating) for the name search on /app-worth.
 *
 * SECURITY: rate limited per visitor; the term is length-limited and only
 * sent to a fixed Apple host. Free: no key. Contains no secrets.
 */

import { NextResponse, type NextRequest } from "next/server";
import { findApps, normalizeTerm } from "@/lib/server/appSearch";
import { checkRateLimit, clientKeyFrom } from "@/lib/security/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

const REQUESTS_PER_MINUTE = 30;

export async function GET(request: NextRequest) {
  const term = normalizeTerm((request.nextUrl.searchParams.get("q") || "").slice(0, 200));
  if (!term) return NextResponse.json({ ok: true, results: [] });

  const allowed = await checkRateLimit("app-search", clientKeyFrom(request.headers), REQUESTS_PER_MINUTE);
  if (!allowed) {
    return NextResponse.json({ ok: false, error: "Too many searches in a short time. Wait a minute and try again." }, { status: 429 });
  }

  const results = await findApps(term);
  if (!results) {
    return NextResponse.json({ ok: false, error: "Search isn't answering right now. Paste the App Store link instead." }, { status: 502 });
  }
  return NextResponse.json({ ok: true, results }, { headers: { "Cache-Control": "public, max-age=3600" } });
}
