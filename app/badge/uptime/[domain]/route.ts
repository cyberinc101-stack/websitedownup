/**
 * GET /badge/uptime/[domain]: an embeddable "uptime" badge, alongside the
 * existing live up/down badge at /badge/[domain]. Uses the same real check
 * history already collected for the /site/[domain] uptime card
 * (lib/server/domainHistory.ts) -- Redis-backed with an automatic
 * in-memory fallback, so this needed no new storage of its own.
 *
 * Figures are never fabricated: a domain with no check history yet shows
 * "no data yet" rather than a made-up percentage.
 * CLIENT-SAFE output (SVG). Contains no secrets.
 */

import { NextResponse } from "next/server";
import { normalizeDomain, isLikelyValidDomain } from "@/lib/checkSite";
import { getUptimeStats } from "@/lib/server/domainHistory";
import { renderValueBadge } from "@/lib/badge/renderBadge";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BADGE_CACHE_SECONDS = 300;

function colorFor(percent: number | null): string {
  if (percent === null) return "#9e9e9e";
  if (percent >= 99) return "#16A34A";
  if (percent >= 95) return "#D97706";
  return "#E8542B";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ domain: string }> }
) {
  const { domain: rawDomain } = await params;
  const domain = normalizeDomain(rawDomain.replace(/\.svg$/i, ""));

  if (!isLikelyValidDomain(domain)) {
    const svg = renderValueBadge("uptime", "invalid domain", "#9e9e9e");
    return new NextResponse(svg, {
      status: 400,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=60",
      },
    });
  }

  const stats = await getUptimeStats(domain);
  const value = stats.uptimePercent === null ? "no data yet" : stats.uptimePercent + "%";
  const title =
    stats.uptimePercent === null
      ? "No check history yet for " + domain
      : domain + ": " + stats.uptimePercent + "% uptime over the last " + stats.totalChecks + " checks";

  const svg = renderValueBadge("uptime", value, colorFor(stats.uptimePercent), title);

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control":
        "public, max-age=" + BADGE_CACHE_SECONDS + ", s-maxage=" + BADGE_CACHE_SECONDS + ", stale-while-revalidate=600",
    },
  });
}
