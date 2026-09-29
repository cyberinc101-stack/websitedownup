/**
 * Share-card image for a /site/[domain] status report. Restyled onto the
 * shared brand card (lib/og/ogCard.tsx) used everywhere else on the site;
 * the live UP/DOWN read is unchanged from before (still via
 * getCachedBadgeStatus, the same source the embeddable badge uses) since
 * "is it down right now" is the whole point of this specific card. See
 * ogCard.tsx's file comment for why the Worth/App cards don't do this.
 * CLIENT-SAFE. Contains no secrets.
 */

import { ImageResponse } from "next/og";
import { normalizeDomain } from "@/lib/checkSite";
import { getCachedBadgeStatus } from "@/lib/server/badgeStatus";
import { ogCardElement } from "@/lib/og/ogCard";
import { OG_SIZE } from "@/lib/og/theme";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ domain: string }> }) {
  const { domain: rawDomain } = await params;
  const domain = normalizeDomain(rawDomain);
  const result = await getCachedBadgeStatus(domain);
  const isUp = result.status === "up";

  return new ImageResponse(
    ogCardElement({
      eyebrow: isUp ? "Up right now" : "Down right now",
      title: domain,
      subtitle:
        "Live status, response time, SSL and domain checks" +
        (result.responseTimeMs !== null ? " — " + result.responseTimeMs + " ms response time." : "."),
      accent: isUp ? "up" : "down",
    }),
    size
  );
}
