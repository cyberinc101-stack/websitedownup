/**
 * Serves /ads.txt, which AdSense requires to authorise ads on this domain.
 * The publisher ID comes from lib/config/site.ts
 * (NEXT_PUBLIC_ADSENSE_PUBLISHER_ID). Returns 404 until it's set.
 *
 * The ID is public by design (it appears in every ad tag), so no security
 * concerns. The long code at the end is Google's fixed certification ID,
 * the same for every publisher.
 */

import { ADSENSE_PUBLISHER_ID } from "@/lib/config/site";

export const dynamic = "force-static";

export function GET() {
  if (!/^pub-\d{10,20}$/.test(ADSENSE_PUBLISHER_ID)) {
    return new Response("ads.txt not configured yet\n", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  return new Response("google.com, " + ADSENSE_PUBLISHER_ID + ", DIRECT, f08c47fec0942fa0\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
