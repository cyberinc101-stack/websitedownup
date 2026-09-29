"use client";

/**
 * "Having problems right now": sites (the ranked Top 100 plus the wider
 * watch list in lib/watchlist.ts) that are down or slow in the latest
 * snapshot, down first, then by popularity. Below those, domains that
 * several separate visitors reported a problem with in the last 15
 * minutes (from the Live reports dropdown), labelled as visitor reports
 * because our own check hasn't confirmed them.
 * Sites marked `unverified` (failing, but not seen working in the last 48
 * hours, so almost certainly blocking automated checks) are left out of
 * our own list: this box only lists real, current problems.
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

interface ReportedEntry {
  domain: string;
  count: number;
}

interface Row {
  domain: string;
  name: string;
  detail: string;
  tone: "down" | "slow";
  reported: boolean;
}

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

function parseReported(value: unknown): ReportedEntry[] {
  if (!value || typeof value !== "object") return [];
  const raw = (value as { reported?: unknown }).reported;
  if (!Array.isArray(raw)) return [];
  const out: ReportedEntry[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as { domain?: unknown; count?: unknown };
    if (typeof e.domain === "string" && typeof e.count === "number" && e.count > 0) {
      out.push({ domain: e.domain, count: e.count });
    }
  }
  return out;
}

export default function ProblemsBox({ className = "" }: { className?: string }) {
  const [snapshot, setSnapshot] = useState<PopularSnapshot | null>(null);
  const [reported, setReported] = useState<ReportedEntry[]>([]);

  useEffect(() => {
    let stopped = false;
    let loadedOnce = false;

    async function load() {
      if (loadedOnce && document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/problems");
        if (!res.ok) return;
        const data: unknown = await res.json();
        if (!stopped && isSnapshot(data)) {
          setSnapshot(data);
          setReported(parseReported(data));
        }
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
  const ownProblems = sites
    .filter((s) => s.state !== "up" && !(s.state === "down" && s.unverified === true))
    .sort((a, b) => {
      if (a.state !== b.state) return a.state === "down" ? -1 : 1;
      return a.rank - b.rank;
    });

  const rows: Row[] = ownProblems.map((site) => ({
    domain: site.domain,
    name: site.name,
    detail: detail(site),
    tone: site.state === "down" ? "down" : "slow",
    reported: false,
  }));

  // Visitor-reported domains that our own list doesn't already show.
  const listed = new Set(rows.map((r) => r.domain));
  const nameFor = new Map(sites.map((s) => [s.domain, s.name] as const));
  for (const entry of reported) {
    if (listed.has(entry.domain)) continue;
    rows.push({
      domain: entry.domain,
      name: nameFor.get(entry.domain) || entry.domain,
      detail: entry.count + (entry.count === 1 ? " report" : " reports"),
      tone: "slow",
      reported: true,
    });
  }

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
            (rows.length > 0 ? "bg-down-bg text-down" : "bg-up-bg text-up")
          }
        >
          {rows.length}
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted">
          No outages detected right now across {sites.length} tracked sites.
        </p>
      ) : (
        <ul className="no-scrollbar -mx-1.5 flex-1 space-y-0.5 overflow-y-auto pr-1">
          {rows.map((row) => (
            <li key={row.domain}>
              <Link
                href={"/site/" + row.domain}
                title={row.reported ? "Reported by visitors, not verified by us" : undefined}
                className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-bg transition-colors"
              >
                <SiteLogo domain={row.domain} className="h-4 w-4 rounded-sm shrink-0" />
                <span className="text-sm text-ink truncate flex-1 min-w-0">{row.name}</span>
                <span
                  className={
                    "text-[11px] font-semibold shrink-0 " + (row.tone === "down" ? "text-down" : "text-slow")
                  }
                >
                  {row.detail}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
