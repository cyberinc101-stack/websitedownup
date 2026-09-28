"use client";

/**
 * Gate before leaving for an external site or store page: countdown, ad slot,
 * Continue. With a SmartLink set in lib/config/monetag.ts, Continue opens the ad
 * in a new tab (on the visitor's click) and sends this tab on; else auto-redirects.
 * SECURITY: destination is built server-side from validated values only
 * (normalized domain or numeric App Store id), so this is not an open redirect.
 */

import { useEffect, useState, type MouseEvent } from "react";
import AdSlot from "@/components/AdSlot";
import { SITE_NAME } from "@/lib/config/site";
import { MONETAG_SMARTLINK } from "@/lib/config/monetag";

const COUNTDOWN_SECONDS = 5;
const AD_URL = /^https:\/\//.test(MONETAG_SMARTLINK) ? MONETAG_SMARTLINK : null;

export default function VisitInterstitial({
  domain,
  destination,
  label,
}: {
  domain?: string;
  destination?: string;
  label?: string;
}) {
  const dest = destination ?? "https://" + (domain ?? "");
  const name = label ?? domain ?? "the site";
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (!AD_URL) window.location.href = dest;
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft, dest]);

  function onContinue(e: MouseEvent<HTMLAnchorElement>) {
    if (secondsLeft > 0) {
      e.preventDefault();
      return;
    }
    if (AD_URL) {
      e.preventDefault();
      window.open(AD_URL, "_blank", "noopener");
      window.location.href = dest;
    }
  }

  const buttonClass =
    "inline-block rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors " +
    (secondsLeft > 0 ? "bg-line text-muted pointer-events-none" : "bg-signal text-white hover:bg-signal-dark");

  return (
    <div className="mx-auto max-w-xl px-5 sm:px-8 py-16 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-signal mb-3">One moment</p>
      <h1 className="font-display text-2xl font-bold text-ink mb-2">Taking you to {name}</h1>
      <p className="text-muted mb-6">
        {secondsLeft > 0
          ? `Continuing in ${secondsLeft}\u2026`
          : AD_URL
            ? "Tap Continue when you're ready."
            : "Redirecting\u2026"}
      </p>

      <AdSlot className="min-h-[250px] mb-6" />

      <a href={dest} rel="noopener noreferrer" aria-disabled={secondsLeft > 0} onClick={onContinue} className={buttonClass}>
        {secondsLeft > 0 ? `Continue in ${secondsLeft}` : `Continue to ${name}`}
      </a>

      {AD_URL && secondsLeft <= 0 && (
        <p className="mt-3 text-xs text-muted">A sponsor page opens in a new tab while {name} loads.</p>
      )}
      <p className="mt-6 text-xs text-muted">
        {SITE_NAME} isn&apos;t affiliated with {name}.
      </p>
    </div>
  );
}