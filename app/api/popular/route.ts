/**
 * GET /api/popular: the latest popular-sites snapshot (statuses of the top
 * 100 sites). Polled by components/home/PopularStatusProvider.tsx every 30
 * seconds so the outage alert, Having problems and the site grid update
 * without a page reload.
 *
 * The snapshot itself refreshes every 2 minutes (lib/server/popularStatus.ts);
 * this response is also cached 30 seconds at Vercel's edge.
 * Public data only. Contains no secrets.
 */

import { NextResponse } from "next/server";
import { getPopularSnapshot } from "@/lib/server/popularStatus";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// A refresh checks 100 sites; give it room to finish.
export const maxDuration = 60;

export async function GET() {
  const snapshot = await getPopularSnapshot();
  return NextResponse.json(snapshot, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
  });
}
