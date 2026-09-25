"use client";

/**
 * Interstitial shown before sending a visitor to an external site linked
 * from the report page. Shows an ad slot and a short countdown; the
 * visitor can continue once it reaches zero, or it auto-redirects.
 *
 * SECURITY: the destination is built here from the already-normalized
 * `domain` prop (https://<domain>) rather than trusting a passed-in URL,
 * so this route can't be used as an open redirect.
 */

import { useEffect, useState } from "react";
import AdSlot from "@/components/AdSlot";
import { SITE_NAME } from "@/lib/config/site";

const COUNTDOWN_SECONDS = 5;

export default function VisitInterstitial({ domain }: { domain: string }) {
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const destination = "https://" + domain;

  useEffect(() => {
    if (secondsLeft <= 0) {
      window.location.href = destination;
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft, destination]);

  const buttonClass =
    "inline-block rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors " +
    (secondsLeft > 0 ? "bg-line text-muted pointer-events-none" : "bg-signal text-white hover:bg-signal-dark");

  return (
    <div className="mx-auto max-w-xl px-5 sm:px-8 py-16 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-signal mb-3">One moment</p>
      <h1 className="font-display text-2xl font-bold text-ink mb-2">Taking you to {domain}</h1>
      <p className="text-muted mb-6">
        {secondsLeft > 0 ? `Continuing in ${secondsLeft}\u2026` : "Redirecting\u2026"}
      </p>

      <AdSlot className="min-h-[250px] mb-6" />

      <a href={destination} rel="noopener noreferrer" aria-disabled={secondsLeft > 0} className={buttonClass}>
        {secondsLeft > 0 ? `Continue in ${secondsLeft}` : `Continue to ${domain}`}
      </a>

      <p className="mt-6 text-xs text-muted">
        {SITE_NAME} isn&apos;t affiliated with {domain}.
      </p>
    </div>
  );
}