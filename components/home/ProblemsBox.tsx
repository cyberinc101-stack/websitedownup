"use client";

/**
 * "Having problems right now": sites (the ranked Top 100 plus the wider
 * watch list in lib/watchlist.ts) that are down or slow in the latest
 * snapshot, down first, then by popularity.
 * Sites marked `unverified` (failing, but not seen working in the last 48
 * hours, so almost certainly blocking automated checks) are left out: this
 * box only lists real, current problems.
 * Self-contained: fetches /api/problems on mount and polls every 30s
 * while the tab is visible. Deliberately independent of the main Top 100
 * grid's own data fetch (PopularStatusProvider), so this widened check
 * never competes with or delays the main page's own request.
 * Sized for the 300px right rail: fixed height with its own scroll (the
 * scrollbar itself is hidden via .no-scrollbar, scrolling still works),
 * so it lines up with the ad containers. Pure presentation, no security
 * logic.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteLogo from "@/components/shared/SiteLogo";
import type { PopularSiteStatus, PopularSnapshot } from "@/lib/server/popularStatus";

const POLL_MS = 30000;

function detail(site: PopularSiteStatus): string {
  if (site.state === "slow") return site.responseTimeMs + " ms";
  if (site.statusCode !== null) return "HTTP " + site.statusCode;
  return "No response";
}

function isSnapshot(value: unknown): value is PopularSnapshot {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.checkedAt === "string" && Array.isArray(v.sites) && v.sites.length > 0;
}

export default function ProblemsBox({ className = "" }: { className?: string }) {
  const [snapshot, setSnapshot] = useState<PopularSnapshot | null>(null);

  useEffect(() => {
    let stopped = false;
    let loadedOnce = false;

    async function load() {
      if (loadedOnce && document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/problems");
        if (!res.ok) return;
        const data: unknown = await res.json();
        if (!stopped && isSnapshot(data)) setSnapshot(data);
      } catch {
        // Network hiccup: keep whatever we last had.
      } finally {
        loadedOnce = true;
      }
    }

    load();
    const id = setInterval(load, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  if (!snapshot) {
    return (
      <div
        className={
          "flex h-[300px] flex-col rounded-xl border border-line bg-surface p-4 shadow-card " + className
        }
      >
        <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
          <h2 className="font-display text-base font-bold text-ink">Having problems right now</h2>
        </div>
        <p className="text-sm text-muted">Checking sites&hellip;</p>
      </div>
    );
  }

  const { sites } = snapshot;
  const problems = sites
    .filter((s) => s.state !== "up" && !(s.state === "down" && s.unverified === true))
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
          No outages detected right now across {sites.length} tracked sites.
        </p>
      ) : (
        <ul className="no-scrollbar -mx-1.5 flex-1 space-y-0.5 overflow-y-auto pr-1">
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
