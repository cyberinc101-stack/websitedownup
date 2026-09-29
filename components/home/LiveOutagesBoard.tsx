"use client";

/**
 * Full "Down right now" board for the homepage: every site currently down
 * or slow across the whole tracked list (the ranked Top 100 plus the wider
 * watch list in lib/watchlist.ts), not just the Top 50 shown in AlertBar
 * or the 300px rail box in ProblemsBox.
 *
 * Deliberately NOT a scrolling/ticker element: no fixed height, no
 * overflow-y-auto -- it just wraps into as many rows as it needs, so
 * everything currently having problems is visible at once without
 * scrolling. Hidden entirely when nothing is wrong, the same way AlertBar
 * is, so it only ever shows up as a genuine "something's happening" moment
 * (good screenshot/share bait during a real outage).
 *
 * Same data source as ProblemsBox (GET /api/problems, polled every 30s) --
 * no new backend work, just a different, unconstrained layout for it.
 * Pure presentation, no security logic.
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

export default function LiveOutagesBoard({ className = "" }: { className?: string }) {
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

  if (!snapshot) return null;

  const problems = snapshot.sites
    .filter((s) => s.state !== "up" && !(s.state === "down" && s.unverified === true))
    .sort((a, b) => {
      if (a.state !== b.state) return a.state === "down" ? -1 : 1;
      return a.rank - b.rank;
    });

  // Nothing wrong: stay out of the way entirely, same as AlertBar.
  if (problems.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={"rounded-xl border border-down-line bg-down-bg/40 p-4 sm:p-5 " + className}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="font-display text-base font-bold text-ink">Down right now, across every site we track</h2>
        <span className="rounded-full bg-down-bg px-2 py-0.5 text-xs font-semibold text-down shrink-0">
          {problems.length}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {problems.map((site) => (
          <Link
            key={site.domain}
            href={"/site/" + site.domain}
            className="inline-flex items-center gap-2 rounded-lg border border-down-line bg-white px-2.5 py-1.5 hover:border-down transition-colors"
          >
            <SiteLogo domain={site.domain} className="h-4 w-4 rounded-sm shrink-0" />
            <span className="text-sm font-medium text-ink">{site.name}</span>
            <span className={"text-[11px] font-semibold " + (site.state === "down" ? "text-down" : "text-slow")}>
              {detail(site)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
