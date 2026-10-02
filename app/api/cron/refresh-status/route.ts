/**
 * GET /api/cron/refresh-status: rebuilds the popular-sites and Having
 * problems snapshots in the background, so statuses stay fresh (and
 * uptime history keeps updating) even when nobody is on the site.
 *
 * Call it every 2 minutes from any scheduler:
 *  - Vercel Cron (Pro plan; Hobby only allows daily), or
 *  - a free external pinger such as cron-job.org.
 *
 * SECURITY: requires the CRON_SECRET environment variable. Send it as
 * "Authorization: Bearer <secret>" (Vercel Cron does this automatically)
 * or as ?key=<secret>. If CRON_SECRET is not set, the route refuses every
 * request. It only refreshes public data from the fixed site lists.
 * Contains no secrets.
 */

import { NextResponse, type NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import {
  getPopularSnapshot,
  getProblemsSnapshot,
  SNAPSHOT_CACHE_TAG,
} from "@/lib/server/popularStatus";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Rebuilds ~100 + ~180 site checks one after the other; give it room.
export const maxDuration = 60;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  if (req.headers.get("authorization") === "Bearer " + secret) return true;
  return req.nextUrl.searchParams.get("key") === secret;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // Mark both cached snapshots stale so the calls below rebuild them now.
  revalidateTag(SNAPSHOT_CACHE_TAG);

  const popular = await getPopularSnapshot();
  let problemsCheckedAt: string | null = null;
  try {
    // Popular is already stored; if this slower one runs out of time, that is kept.
    const problems = await getProblemsSnapshot();
    problemsCheckedAt = problems.checkedAt;
  } catch {
    problemsCheckedAt = null;
  }

  return NextResponse.json(
    { ok: true, popularCheckedAt: popular.checkedAt, problemsCheckedAt },
    { headers: { "Cache-Control": "no-store" } }
  );
}
