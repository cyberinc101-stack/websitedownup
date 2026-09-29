/**
 * GET /api/comments?domain=x: the live preset-comment feed for a domain
 * (newest 100) plus summary numbers.
 * POST /api/comments { domain, preset }: adds one preset comment.
 * Visitors never send free text: only a preset id, which is looked up
 * against a fixed allowlist.
 * ABUSE GUARDS (same as /api/report-problem):
 *  - Same-origin only.
 *  - One comment per domain per hashed IP every 15 minutes, across both
 *    problem and "working well" comments. It shares the bucket with the
 *    "I'm having problems too" button, so the two can't be combined to
 *    count twice in the 15-minute window.
 *  - Daily caps per domain (existing report cap plus a comments cap that
 *    covers both types together).
 *  - "Back up now" / "Was down, now recovered" are refused unless the
 *    domain had a problem comment in the last hour.
 * Public data only. Contains no secrets.
 */

import { NextResponse } from "next/server";
import { normalizeDomain, isLikelyValidDomain } from "@/lib/checkSite";
import { checkRateLimit, clientKeyFrom } from "@/lib/security/rateLimit";
import { dailyCapReached } from "@/lib/server/problemReports";
import { addComment, commentsCapReached, getComments } from "@/lib/server/domainComments";
import { getCommentPreset } from "@/lib/comments/commentPresets";
import { SITE_URL } from "@/lib/config/site";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Same bucket name as /api/report-problem on purpose (shared cooldown).
const RATE_LIMIT_BUCKET = "report-problem:";
const RATE_LIMIT_WINDOW_SECONDS = 900;

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
  const snapshot = await getComments(domain);
  return NextResponse.json(
    { domain, ...snapshot },
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
  const obj = body && typeof body === "object" ? (body as { domain?: unknown; preset?: unknown }) : {};
  const domain = normalizeDomain(typeof obj.domain === "string" ? obj.domain : "");
  if (!isLikelyValidDomain(domain)) {
    return NextResponse.json({ error: "Enter a valid domain." }, { status: 400 });
  }
  const preset = getCommentPreset(obj.preset);
  if (!preset) {
    return NextResponse.json({ error: "Pick one of the listed options." }, { status: 400 });
  }

  // Checked before the cooldown so a refused request doesn't use it up.
  if (preset.recovery) {
    const current = await getComments(domain);
    if (!current.problemsLastHour) {
      return NextResponse.json({ error: "That option isn't available right now." }, { status: 400 });
    }
  }

  const clientKey = clientKeyFrom(req.headers);
  const [allowed, reportsCapped, commentsCapped] = await Promise.all([
    checkRateLimit(RATE_LIMIT_BUCKET + domain, clientKey, 1, RATE_LIMIT_WINDOW_SECONDS),
    dailyCapReached(domain),
    commentsCapReached(domain),
  ]);

  const canAdd = allowed && !reportsCapped && !commentsCapped;
  if (canAdd) await addComment(domain, preset);

  const snapshot = await getComments(domain);
  return NextResponse.json({ domain, ...snapshot, alreadyPosted: !canAdd });
}
