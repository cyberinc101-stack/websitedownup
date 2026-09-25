"use client";

/**
 * "Alerts/Saved" link for the header: star icon, filled + count badge once
 * at least one site is saved. Links to /saved, the shared saved/alerts screen.
 */

import Link from "next/link";
import { useSavedSites } from "@/lib/client/savedSites";

export default function SavedNavLink() {
  const { count } = useSavedSites();
  return (
    <Link href="/saved" className="relative inline-flex items-center gap-1.5 hover:text-ink transition-colors">
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        strokeWidth="1.6"
        strokeLinejoin="round"
        className={count > 0 ? "fill-down stroke-down" : "fill-none stroke-muted"}
      >
        <path d="M12 2.5l2.9 6.2 6.7.7-5 4.6 1.4 6.7L12 17.6l-6 3.1 1.4-6.7-5-4.6 6.7-.7L12 2.5z" />
      </svg>
      <span className="hidden sm:inline">Alerts/Saved</span>
      {count > 0 && (
        <span className="inline-flex items-center justify-center h-4 min-w-[16px] rounded-full bg-signal px-1 text-[10px] font-semibold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}