/**
 * POST /api/comments/vote { domain, cid, vote: "up" | "down" | "none" }
 * Records this visitor's accurate / not accurate vote on a live comment and
 * returns { up, down, mine }.
 * ABUSE GUARDS:
 *  - Same-origin only (Origin/Referer must be this site).
 *  - Strict input checks: valid domain, 16-char hex comment id, fixed vote values.
 *  - The comment must still exist and be inside its 3-hour lifetime.
 *  - One vote per comment per hashed IP (changing or undoing replaces it),
 *    and at most 20 vote requests per minute per hashed IP.
 * Stores only hashed, truncated IPs. Contains no secrets.
 */

import { NextResponse } from "next/server";
import { normalizeDomain, isLikelyValidDomain } from "@/lib/checkSite";
import { checkRateLimit, clientKeyFrom } from "@/lib/security/rateLimit";
import { castVote, findCommentTime } from "@/lib/server/commentVotes";
import { SITE_URL } from "@/lib/config/site";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VOTES_PER_MINUTE = 20;
const CID_PATTERN = /^[a-f0-9]{16}$/;

function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin") || req.headers.get("referer") || "";
  if (!origin) return false;
  try {
    const o = new URL(origin);
    return o.origin === new URL(SITE_URL).origin || o.host === req.headers.get("host");
  } catch {
    return false;
  }
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
  const b = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const domain = normalizeDomain(typeof b.domain === "string" ? b.domain : "");
  const cid = typeof b.cid === "string" ? b.cid : "";
  const vote = b.vote;

  if (!isLikelyValidDomain(domain) || !CID_PATTERN.test(cid) || (vote !== "up" && vote !== "down" && vote !== "none")) {
    return NextResponse.json({ error: "Invalid vote." }, { status: 400 });
  }

  const clientKey = clientKeyFrom(req.headers);
  const allowed = await checkRateLimit("comment-vote", clientKey, VOTES_PER_MINUTE, 60);
  if (!allowed) {
    return NextResponse.json({ error: "Too many votes. Try again in a minute." }, { status: 429 });
  }

  const commentAt = await findCommentTime(domain, cid);
  if (commentAt === null) {
    return NextResponse.json({ error: "That report has expired." }, { status: 404 });
  }

  const result = await castVote(cid, clientKey, vote, commentAt);
  if (!result) {
    return NextResponse.json({ error: "Voting is unavailable right now." }, { status: 503 });
  }
  return NextResponse.json(result);
}