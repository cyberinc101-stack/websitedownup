/**
 * GET /api/og/worth?domain=<domain>
 * Renders the share-card image for a specific Website Worth report.
 * Wired in from app/worth/page.tsx's generateMetadata() as the
 * openGraph/twitter image whenever ?domain= is a real address â€” /worth
 * is a query-param page, so Next's per-page image file convention can't
 * reach it directly, hence this small route instead.
 *
 * Deliberately doesn't render the actual estimated value into the image:
 * social platforms cache this for hours to days, so a live figure baked
 * in would go stale (and misleading) almost immediately.
 * CLIENT-SAFE. Contains no secrets.
 */

import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { isLikelyValidDomain, normalizeDomain } from "@/lib/checkSite";
import { ogCardElement } from "@/lib/og/ogCard";
import { OG_SIZE } from "@/lib/og/theme";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const domain = normalizeDomain(request.nextUrl.searchParams.get("domain") || "");
  const valid = isLikelyValidDomain(domain);

  return new ImageResponse(
    ogCardElement({
      eyebrow: "Website worth",
      title: valid ? domain : "Website Worth Calculator",
      subtitle: valid
        ? "See its estimated value, traffic & ad revenue."
        : "Estimate any website's value, traffic & ad revenue — free.",
      accent: "signal",
    }),
    OG_SIZE
  );
}
