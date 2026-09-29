/**
 * Twitter/X card image for pages with no more specific one of their own.
 * Reuses the same design as opengraph-image.tsx (Next.js requires each
 * convention file to export its own Image function, so this just calls
 * the shared renderer again rather than duplicating the design).
 * CLIENT-SAFE. Contains no secrets.
 */

import { ImageResponse } from "next/og";
import { ogCardElement } from "@/lib/og/ogCard";
import { OG_SIZE } from "@/lib/og/theme";

export const runtime = "nodejs";
export const alt = "Website Worth Up or Down";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    ogCardElement({
      title: "Is it down? What's it worth?",
      subtitle: "Live website status checks, website worth estimates, and App Store app value — instantly.",
    }),
    size
  );
}
