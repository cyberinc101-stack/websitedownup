"use client";

/**
 * One responsive AdSense unit. Only rendered by AdSlot once ads are live.
 * Asks AdSense to fill it after it mounts.
 */

import { useEffect, useRef } from "react";
import { ADSENSE_PUBLISHER_ID, ADSENSE_SLOT_ID } from "@/lib/config/site";

export default function AdUnit() {
  const pushed = useRef(false);
  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] };
      w.adsbygoogle = w.adsbygoogle || [];
      w.adsbygoogle.push({});
    } catch {
      // ad blockers / slow networks — nothing to do
    }
  }, []);
  return (
    <ins
      className="adsbygoogle block w-full"
      style={{ display: "block" }}
      data-ad-client={"ca-" + ADSENSE_PUBLISHER_ID}
      data-ad-slot={ADSENSE_SLOT_ID}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
