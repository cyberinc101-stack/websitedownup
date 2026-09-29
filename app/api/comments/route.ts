/**
 * GET /api/comments?domain=x: the live preset-comment feed for a domain
 * (newest 100) plus summary numbers.
 * GET /api/comments?scope=global: the site-wide feed (all domains) for the
 * home page.
 * POST /api/comments { domain, preset }: adds one preset comment.
 * Visitors never send free text: only a preset id, which is looked up
 * against a fixed allowlist, so there is no way to post links or abuse.
 * SPAM PROTECTION (all server-side):
 *  - Same-origin only: Origin/Referer must be this site, Sec-Fetch-Site
 *    (when the browser sends it) must be same-origin, and a User-Agent is
 *    required. Blocks direct script/API hits from outside a browser.
 *  - Per-domain cooldown: one comment per domain per hashed IP every 15
 *    minutes, across problem and "working well" comments. Shares its bucket
 *    with the "I'm having problems too" button so the two can't be combined
 *    to count twice in the 15-minute window.
 *  - Per-visitor limit across ALL domains: at most 6 comments per hashed IP
 *    per hour, so one person can't flood the site-wide feed by posting on
 *    many different domains.
 *  - Site-wide limit: at most 600 comments per hour in total.
 *  - Daily caps per domain (existing report cap plus a comments cap that
 *    covers both types together).
 *  - "Back up now" / "Was down, now recovered" are refused unless the
 *    domain had a problem comment in the last hour.
 * Refused requests never reach the feed or the problem count.
 * Public data only. Contains no secrets.
 */

import { NextResponse } from "next/server";
import { normalizeDomain, isLikelyValidDomain } from "@/lib/checkSite";
import { checkRateLimit, clientKeyFrom } from "@/lib/security/rateLimit";
import { dailyCapReached } from "@/lib/server/problemReports";
import { addComment, commentsCapReached, getComments, getGlobalComments } from "@/lib/server/domainComments";
import { getCommentPreset } from "@/lib/comments/commentPresets";
import { SITE_URL } from "@/lib/config/site";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Same bucket name as /api/report-problem on purpose (shared cooldown).
const DOMAIN_BUCKET = "report-problem:";
const DOMAIN_WINDOW_SECONDS = 900;
const VISITOR_BUCKET = "comment-any";
const VISITOR_LIMIT = 6;
const VISITOR_WINDOW_SECONDS = 3600;
const SITE_BUCKET = "comment-site";
const SITE_LIMIT = 600;
const SITE_WINDOW_SECONDS = 3600;
const CACHE_HEADERS = { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=20" };

function isSameOrigin(req: Request): boolean {
  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") return false;
  if (!req.headers.get("user-agent")) return false;
  const origin = req.headers.get("origin") || req.headers.get("referer") || "";
  if (!origin) return false;
  try {
    const originUrl = new URL(origin);
    if (originUrl.origin === new URL(SITE_URL).origin) return true;
    // Local development only (npm run dev): accept the dev server's own
    // origin, e.g. http://localhost:3000. Never applies in production.
    if (process.env.NODE_ENV !== "production") {
      const host = req.headers.get("host");
      return !!host && originUrl.host === host;
    }
    return false;
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;

  if (params.get("scope") === "global") {
    const snapshot = await getGlobalComments();
    return NextResponse.json({ scope: "global", ...snapshot }, { headers: CACHE_HEADERS });
  }

  const domain = normalizeDomain(params.get("domain") || "");
  if (!isLikelyValidDomain(domain)) {
    return NextResponse.json({ error: "Enter a valid domain." }, { status: 400 });
  }
  const snapshot = await getComments(domain);
  return NextResponse.json({ domain, ...snapshot }, { headers: CACHE_HEADERS });
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
  const [reportsCapped, commentsCapped] = await Promise.all([
    dailyCapReached(domain),
    commentsCapReached(domain),
  ]);

  // In order, stopping at the first refusal so later counters aren't used up.
  let reason: "cooldown" | "limit" | null = null;
  if (reportsCapped || commentsCapped) {
    reason = "limit";
  } else if (!(await checkRateLimit(DOMAIN_BUCKET + domain, clientKey, 1, DOMAIN_WINDOW_SECONDS))) {
    reason = "cooldown";
  } else if (!(await checkRateLimit(VISITOR_BUCKET, clientKey, VISITOR_LIMIT, VISITOR_WINDOW_SECONDS))) {
    reason = "limit";
  } else if (!(await checkRateLimit(SITE_BUCKET, "all", SITE_LIMIT, SITE_WINDOW_SECONDS))) {
    reason = "limit";
  }

  if (!reason) await addComment(domain, preset);

  const snapshot = await getComments(domain);
  return NextResponse.json({ domain, ...snapshot, alreadyPosted: reason !== null, reason });
}
