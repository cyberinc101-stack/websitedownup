/**
 * GET /api/og/app?app=<id>&name=<app name>
 * Renders the share-card image for a specific App Worth report. Wired in
 * from app/app-worth/page.tsx's generateMetadata() as the openGraph/
 * twitter image whenever a `name` is available â€” /app-worth is a
 * query-param page, so Next's per-page image file convention can't reach
 * it directly, hence this small route instead.
 *
 * Takes the app's name as a query param rather than looking it up itself:
 * every link the site itself generates (search picks, the report page)
 * already knows the name, so this avoids an extra Apple lookup on every
 * social-platform link preview. A link with no name (e.g. someone shared
 * a raw app id) falls back to a generic card.
 * CLIENT-SAFE. Contains no secrets.
 */

import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { ogCardElement } from "@/lib/og/ogCard";
import { OG_SIZE } from "@/lib/og/theme";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const name = (request.nextUrl.searchParams.get("name") || "").trim().slice(0, 60);

  return new ImageResponse(
    ogCardElement({
      eyebrow: "App worth",
      title: name || "App Worth Calculator",
      subtitle: name
        ? "See its estimated downloads, ratings & revenue."
        : "Estimate any App Store app's downloads & revenue — free.",
      accent: "signal",
    }),
    OG_SIZE
  );
}
