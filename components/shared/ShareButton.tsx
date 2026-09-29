"use client";

/**
 * The actual "Share" control for the pages that already have a branded
 * share-card image behind them (site status, worth, app worth): the OG
 * card system only controls what a shared link *looks like* once it's
 * pasted somewhere, it never puts a button in front of the visitor. This
 * does that part — native share sheet on phones/tablets that support the
 * Web Share API, copy-link fallback everywhere else (desktop browsers
 * mostly don't implement navigator.share).
 *
 * Always shares the exact current URL (window.location.href), read at
 * click time rather than render time, so it works the same on every page
 * that uses it without needing to know that page's URL shape.
 * CLIENT-ONLY. Contains no secrets.
 */

import { useState } from "react";

export default function ShareButton({
  title,
  text,
  className = "",
}: {
  title: string;
  text?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // User dismissed the native share sheet — nothing to do.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access blocked — nothing more we can do here.
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={
        "inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink hover:border-signal/50 transition-colors shrink-0 " +
        className
      }
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
      {copied ? "Copied!" : "Share"}
    </button>
  );
}
