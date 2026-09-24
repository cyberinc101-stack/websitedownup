"use client";

/**
 * "Having problems right now": popular sites (all 100) that are down or
 * slow in the latest snapshot, down first, then by popularity.
 * Updates live (every 30s) from PopularStatusProvider.
 * Sized for the 300px right rail: fixed height with its own scroll, so it
 * lines up with the ad containers. Shows an all-clear when nothing's wrong.
 * Pure presentation, no security logic.
 */

import Link from "next/link";
import SiteLogo from "@/components/shared/SiteLogo";
import type { PopularSiteStatus } from "@/lib/server/popularStatus";
import { usePopularSnapshot } from "./PopularStatusProvider";

function detail(site: PopularSiteStatus): string {
  if (site.state === "slow") return site.responseTimeMs + " ms";
  if (site.statusCode !== null) return "HTTP " + site.statusCode;
  return "No response";
}

export default function ProblemsBox({ className = "" }: { className?: string }) {
  const { sites } = usePopularSnapshot();
  const problems = sites
    .filter((s) => s.state !== "up")
    .sort((a, b) => {
      if (a.state !== b.state) return a.state === "down" ? -1 : 1;
      return a.rank - b.rank;
    });

  return (
    <div
      className={
        "flex h-[300px] flex-col rounded-xl border border-line bg-surface p-4 shadow-card " + className
      }
    >
      <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
        <h2 className="font-display text-base font-bold text-ink">Having problems right now</h2>
        <span
          className={
            "rounded-full px-2 py-0.5 text-xs font-semibold " +
            (problems.length > 0 ? "bg-down-bg text-down" : "bg-up-bg text-up")
          }
        >
          {problems.length}
        </span>
      </div>

      {problems.length === 0 ? (
        <p className="text-sm text-muted">
          All {sites.length} popular sites are responding normally.
        </p>
      ) : (
        <ul className="-mx-1.5 flex-1 space-y-0.5 overflow-y-auto pr-1">
          {problems.map((site) => (
            <li key={site.domain}>
              <Link
                href={"/site/" + site.domain}
                className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-bg transition-colors"
              >
                <SiteLogo domain={site.domain} className="h-4 w-4 rounded-sm shrink-0" />
                <span className="text-sm text-ink truncate flex-1 min-w-0">{site.name}</span>
                <span
                  className={
                    "text-[11px] font-semibold shrink-0 " + (site.state === "down" ? "text-down" : "text-slow")
                  }
                >
                  {detail(site)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
