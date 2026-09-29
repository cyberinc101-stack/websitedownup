"use client";

/**
 * Always-visible bottom anchor ad, mobile only (hidden from lg breakpoint
 * up, where the rail ads already give good coverage). Typically the
 * highest-viewability ad placement on a content site since it's on screen
 * for the whole visit rather than scrolled past.
 *
 * Closable, per AdSense's own anchor-ad policy (an anchor/overlay ad must
 * offer a visible close control). The close choice is remembered for the
 * rest of this tab's session (sessionStorage) so dismissing it once doesn't
 * mean seeing it pop back on the very next page.
 *
 * Renders nothing until ads are live (ADS_LIVE), same gating as AdSlot.
 */

import { useEffect, useState } from "react";
import AdUnit from "@/components/AdUnit";
import { ADS_LIVE } from "@/lib/config/site";

const DISMISS_KEY = "pc:stickyAdDismissed";

export default function StickyMobileAd() {
  const [dismissed, setDismissed] = useState(true); // default hidden until we check sessionStorage, avoids a flash

  useEffect(() => {
    if (!ADS_LIVE) return;
    try {
      setDismissed(window.sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (!ADS_LIVE || dismissed) return null;

  function handleClose() {
    setDismissed(true);
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Session storage blocked: it'll just show again on the next page, not a big deal.
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden border-t border-line bg-surface shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
      <div className="flex items-start gap-2 px-2 pt-1 pb-1.5">
        <div className="flex-1 min-w-0">
          <span className="block text-center text-[9px] uppercase tracking-wider text-muted/70 mb-0.5">
            Advertisement
          </span>
          <div className="min-h-[50px]">
            <AdUnit />
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close ad"
          className="shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-line/70 text-muted hover:bg-line hover:text-ink transition-colors"
        >
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
