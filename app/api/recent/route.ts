/**
 * GET /api/recent: the live "Recently checked" feed (all visitors).
 * Polled by components/home/LiveFeed.tsx every 10 seconds.
 *
 * Cached for 5 seconds at Vercel's edge and in the data cache, so any
 * amount of traffic costs at most a few Redis reads per minute.
 * Each uncached request also gives the live monitor a chance to run its
 * next real check (at most one per 8 seconds site-wide; see
 * lib/activity/checkActivity.ts), after the response is sent.
 * Returns public data only (domains, results, times); nothing about who
 * checked them. Contains no secrets.
 */

import { after, NextResponse } from "next/server";
import { getRecentActivity, runMonitorTick } from "@/lib/activity/checkActivity";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const feed = await getRecentActivity();
  after(runMonitorTick);
  return NextResponse.json(feed, {
    headers: { "Cache-Control": "public, s-maxage=5, stale-while-revalidate=10" },
  });
}
