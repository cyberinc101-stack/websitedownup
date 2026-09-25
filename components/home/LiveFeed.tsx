"use client";

/**
 * "Recently checked": the latest real checks across the whole site (visitor
 * checks first, topped up by the live monitor's real checks so the list
 * is always full). Server-renders the first batch, then polls /api/recent
 * -- immediately on mount, then every FAST_POLL_MS while still empty (a
 * cold start / fresh deploy), settling into POLL_MS once it has data --
 * while the tab is visible and the box is on screen.
 * Wording stays neutral ("Recently checked") because not every entry is a
 * visitor check. Each row has a save star (lib/client/savedSites.ts).
 *
 * Sized for the 300px right rail: fixed height with its own scroll (the
 * scrollbar itself is hidden via .no-scrollbar, scrolling still works), so
 * it never changes size whether empty, partially filled, or full --
 * matches ProblemsBox's fixed-height pattern.
 *
 * Shows nothing when the feed is disabled (Redis not configured yet).
 * PRIVACY: shows domains and results only, never who checked them.
 * UNTRUSTED DATA: domains are visitor-submitted; the server filters them
 * (lib/security/feedFilter.ts) and React renders them as plain text.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import SiteLogo from "@/components/shared/SiteLogo";
import RelativeTime from "@/components/shared/RelativeTime";
import SaveButton from "@/components/shared/SaveButton";
import type { ActivityFeed, ActivityItem } from "@/lib/activity/types";

const POLL_MS = 10000;
/** Used while the feed is still empty, so a cold start fills within seconds. */
const FAST_POLL_MS = 2000;
const HIGHLIGHT_MS = 2500;

function keyOf(item: ActivityItem): string {
  return item.domain + "|" + item.checkedAt;
}

export default function LiveFeed({
  initial,
  limit = 10,
  className = "",
}: {
  initial: ActivityFeed;
  limit?: number;
  className?: string;
}) {
  const [items, setItems] = useState<ActivityItem[]>(initial.items);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const boxRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef(items);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    if (!initial.enabled) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      const box = boxRef.current;
      // Skip the fetch when the tab is hidden or this copy is display:none,
      // but still reschedule below so polling resumes once visible again.
      if (document.visibilityState === "visible" && box && box.offsetParent !== null) {
        try {
          const res = await fetch("/api/recent");
          if (res.ok) {
            const feed: ActivityFeed = await res.json();
            if (!stopped && Array.isArray(feed.items)) {
              const before = new Set(itemsRef.current.map(keyOf));
              const added = feed.items.filter((i) => !before.has(keyOf(i))).map(keyOf);
              setItems(feed.items);
              if (added.length > 0) {
                setFresh(new Set(added));
                setTimeout(() => {
                  if (!stopped) setFresh(new Set());
                }, HIGHLIGHT_MS);
              }
            }
          }
        } catch {
          // Network hiccup: keep showing the last list.
        }
      }
      if (stopped) return;
      const delay = itemsRef.current.length === 0 ? FAST_POLL_MS : POLL_MS;
      timer = setTimeout(poll, delay);
    }

    // Poll right away if we're starting empty, instead of waiting a full cycle.
    timer = setTimeout(poll, itemsRef.current.length === 0 ? 0 : POLL_MS);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [initial.enabled]);

  if (!initial.enabled) return null;

  const shown = items.slice(0, limit);

  return (
    <div
      ref={boxRef}
      className={"flex h-[300px] flex-col rounded-xl border border-line bg-surface p-4 shadow-card " + className}
    >
      <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
        <h2 className="font-display text-base font-bold text-ink">Recently checked</h2>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-up">
          <span className="h-1.5 w-1.5 rounded-full bg-up animate-pulseDot" aria-hidden="true" />
          Live
        </span>
      </div>

      {shown.length === 0 ? (
        <p className="text-sm text-muted">Starting the live monitor&hellip; checks will appear here in a few seconds.</p>
      ) : (
        <ul className="no-scrollbar -mx-1.5 flex-1 space-y-0.5 overflow-y-auto pr-1" aria-live="polite">
          {shown.map((item) => (
            <li key={keyOf(item)}>
              <Link
                href={"/site/" + item.domain}
                className={
                  "flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors duration-700 hover:bg-bg " +
                  (fresh.has(keyOf(item)) ? "bg-signal-light" : "")
                }
              >
                <SiteLogo domain={item.domain} className="h-4 w-4 rounded-sm shrink-0" />
                <span className="text-sm text-ink truncate flex-1 min-w-0">{item.domain}</span>
                <span className="text-[11px] text-muted shrink-0">
                  <RelativeTime iso={item.checkedAt} />
                </span>
                <SaveButton domain={item.domain} className="scale-90" />
                <span
                  className={"h-2 w-2 rounded-full shrink-0 " + (item.status === "up" ? "bg-up" : "bg-down")}
                  aria-label={item.status === "up" ? "Up" : "Down"}
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}