import { NextResponse } from "next/server";
import { normalizeDomain, isLikelyValidDomain } from "@/lib/checkSite";
import { getCachedBadgeStatus } from "@/lib/server/badgeStatus";
import { renderStatusBadge } from "@/lib/badge/renderBadge";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ domain: string }> }
) {
  const { domain: rawDomain } = await params;
  const domain = normalizeDomain(rawDomain.replace(/\.svg$/i, ""));

  if (!isLikelyValidDomain(domain)) {
    const svg = renderStatusBadge("invalid domain", "unknown");
    return new NextResponse(svg, {
      status: 400,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=60",
      },
    });
  }

  const result = await getCachedBadgeStatus(domain);
  const svg = renderStatusBadge(domain, result.status);

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
