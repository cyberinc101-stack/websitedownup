"use client";

/**
 * Main homepage grid: the popular sites with two filter groups.
 *   Sites:  Top 50 (default) | Top 100
 *   Status: All (default) | Live | Down
 * e.g. Top 50 + Live = the top 50 sites that are currently up.
 * "Live" includes slow sites (they respond, just slowly).
 * Links to "#down" (alert bar) open Top 100 + Down.
 *
 * Layout: the header + filters sit above both columns, so the `rail`
 * (Having problems, ad, Recently checked) starts exactly level with the
 * first row of site cards. On mobile the rail stacks under the cards.
 *
 * Data comes from PopularStatusProvider (updates every 30s), so switching
 * filters is instant with no extra requests. Pure presentation, no
 * security logic.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import SiteLogo from "@/components/shared/SiteLogo";
import RelativeTime from "@/components/shared/RelativeTime";
import type { PopularSiteStatus, PopularState } from "@/lib/server/popularStatus";
import { usePopularSnapshot } from "./PopularStatusProvider";

type Scope = 50 | 100;
type StatusFilter = "all" | "live" | "down";

// Two colours only: green = live (slow sites still respond), reddish-orange = down.
const DOT: Record<PopularState, { className: string; label: string }> = {
  up: { className: "bg-up", label: "Live" },
  slow: { className: "bg-up", label: "Live (slow)" },
  down: { className: "bg-down", label: "Down" },
};

function isLive(s: PopularSiteStatus): boolean {
  return s.state !== "down";
}

function FilterButton({
  active,
  tone = "default",
  onClick,
  children,
}: {
  active: boolean;
  tone?: "default" | "up" | "down";
  onClick: () => void;
  children: ReactNode;
}) {
  let inactive = "border-line bg-surface text-muted hover:text-ink hover:border-signal/40";
  if (tone === "down") inactive = "border-down-line bg-down-bg text-down hover:border-down";
  if (tone === "up") inactive = "border-up-line bg-up-bg text-up hover:border-up";
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={
        "rounded-full border px-3 py-1 text-xs font-semibold transition-colors " +
        (active ? "border-signal bg-signal text-white" : inactive)
      }
    >
      {children}
    </button>
  );
}

function SiteTile({ site }: { site: PopularSiteStatus }) {
  const dot = DOT[site.state];
  const down = site.state === "down";
  return (
    <Link
      href={"/site/" + site.domain}
      title={"#" + site.rank + " " + site.name + " (" + site.category + "): " + dot.label}
      className={
        "flex items-center gap-2 rounded-lg border px-2.5 py-2 hover:shadow-card transition-all min-w-0 " +
        (down ? "border-down-line bg-down-bg hover:border-down" : "border-line bg-surface hover:border-signal/40")
      }
    >
      <SiteLogo domain={site.domain} className="h-6 w-6 rounded shrink-0" />
      <span className="text-sm font-medium text-ink truncate flex-1 min-w-0">{site.name}</span>
      {down ? (
        <span className="text-[11px] font-semibold text-down shrink-0">Down</span>
      ) : (
        site.responseTimeMs !== null && (
          <span className="text-[11px] font-mono text-muted tabular shrink-0">{site.responseTimeMs} ms</span>
        )
      )}
      <span className={"h-2 w-2 rounded-full shrink-0 " + dot.className} aria-label={dot.label} />
    </Link>
  );
}

export default function PopularSitesExplorer({ rail }: { rail?: ReactNode }) {
  const { sites, checkedAt } = usePopularSnapshot();
  const [scope, setScope] = useState<Scope>(50);
  const [status, setStatus] = useState<StatusFilter>("all");
  const sectionRef = useRef<HTMLElement>(null);

  // "#down" links elsewhere on the page open Top 100 + Down.
  useEffect(() => {
    const syncFromHash = () => {
      if (window.location.hash === "#down") {
        setScope(100);
        setStatus("down");
        sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  const inScope = sites.filter((s) => s.rank <= scope);
  const liveCount = inScope.filter(isLive).length;
  const downCount = inScope.length - liveCount;
  const shown =
    status === "live" ? inScope.filter(isLive) : status === "down" ? inScope.filter((s) => !isLive(s)) : inScope;

  return (
    <section ref={sectionRef} id="popular" className="scroll-mt-6">
      <span id="down" className="sr-only" />

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-x-8">
        {/* Row 1: header + filters (rail column intentionally empty) */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 mb-3">
            <h2 className="font-display text-lg font-bold text-ink">Popular sites right now</h2>
            <p className="text-xs text-muted">
              Updated <RelativeTime iso={checkedAt} />
            </p>
          </div>

          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-1.5" role="group" aria-label="Which sites">
              <FilterButton active={scope === 50} onClick={() => setScope(50)}>
                Top 50
              </FilterButton>
              <FilterButton active={scope === 100} onClick={() => setScope(100)}>
                Top {sites.length}
              </FilterButton>
            </div>
            <div className="flex gap-1.5" role="group" aria-label="Status">
              <FilterButton active={status === "all"} onClick={() => setStatus("all")}>
                All ({inScope.length})
              </FilterButton>
              <FilterButton active={status === "live"} tone="up" onClick={() => setStatus("live")}>
                Live ({liveCount})
              </FilterButton>
              <FilterButton
                active={status === "down"}
                tone={downCount > 0 ? "down" : "default"}
                onClick={() => setStatus("down")}
              >
                Down ({downCount})
              </FilterButton>
            </div>
          </div>
        </div>
        <div className="hidden lg:block" aria-hidden="true" />

        {/* Row 2: site cards | rail */}
        <div className="min-w-0">
          {shown.length === 0 ? (
            <p className="rounded-lg border border-line bg-surface px-4 py-6 text-center text-sm text-muted">
              {status === "down"
                ? "None of the top " + scope + " sites are down right now."
                : "No sites to show for this filter."}
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
              {shown.map((s) => (
                <SiteTile key={s.domain} site={s} />
              ))}
            </div>
          )}
        </div>
        {rail && <aside className="mt-6 space-y-6 lg:mt-0">{rail}</aside>}
      </div>
    </section>
  );
}
