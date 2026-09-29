/**
 * GET /api/problems: the latest "Having problems right now" snapshot,
 * covering the ranked Top 100 (lib/sites.ts) plus the wider watch list
 * (lib/watchlist.ts) of generally popular sites outside the ranked grid.
 * Polled by components/home/ProblemsBox.tsx every 30 seconds.
 *
 * The response also carries `reported`: domains that several separate
 * visitors reported a problem with in the last 15 minutes
 * (lib/server/reportedProblems.ts). Those are visitor reports, not our own
 * checks, and the box labels them that way.
 *
 * The snapshot itself refreshes every 2 minutes (lib/server/popularStatus.ts);
 * this response is also cached 30 seconds at Vercel's edge.
 * Public data only. Contains no secrets.
 */

import { NextResponse } from "next/server";
import { getProblemsSnapshot } from "@/lib/server/popularStatus";
import { getReportedDomains } from "@/lib/server/reportedProblems";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// A refresh checks a wide list of sites; give it room to finish.
export const maxDuration = 60;

export async function GET() {
  const [snapshot, reported] = await Promise.all([getProblemsSnapshot(), getReportedDomains()]);
  return NextResponse.json(
    { ...snapshot, reported },
    { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } }
  );
}
