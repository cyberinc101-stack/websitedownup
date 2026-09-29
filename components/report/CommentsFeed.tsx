"use client";

/**
 * "Live reports" card shown under "Recently checked" in the rail. Display
 * only: comments are added with the dropdown under the report container
 * (CommentPicker).
 *  - With a domain (report pages): that domain's newest comments and a
 *    summary line. Updates at once when the dropdown is used, and polls
 *    every 20s.
 *  - Without a domain (home page): the newest comments across all sites,
 *    each row linking to that site's report.
 * The server keeps the newest 100 and the oldest drop off by themselves.
 *
 * Sized like the other rail boxes: fixed 300px height with its own scroll
 * (scrollbar hidden via .no-scrollbar, scrolling still works), so it never
 * grows taller than its neighbours however many comments there are.
 *
 * UNTRUSTED DATA: none. Labels come from a fixed preset list; domains were
 * validated before they were stored.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import RelativeTime from "@/components/shared/RelativeTime";
import {
  COMMENTS_UPDATED_EVENT,
  EMPTY_SNAPSHOT,
  type CommentsSnapshot,
  type CommentsUpdatedDetail,
} from "@/lib/comments/commentPresets";

const POLL_MS = 20000;

function summaryText(s: CommentsSnapshot["summary"]): string | null {
  const parts: string[] = [];
  if (s.problems > 0) {
    const top = s.top
      .slice(0, 3)
      .map((t) => t.count + " " + t.short)
      .join(", ");
    parts.push(
      s.problems + (s.problems === 1 ? " report" : " reports") + " in the last 15 minutes: " + top + "."
    );
  }
  if (s.good > 0) {
    parts.push(s.good + (s.good === 1 ? " says" : " say") + " it's working for them.");
  }
  return parts.length > 0 ? parts.join(" ") : null;
}

export default function CommentsFeed({
  domain,
  className = "",
}: {
  /** Leave out for the site-wide feed on the home page. */
  domain?: string;
  className?: string;
}) {
  const [snap, setSnap] = useState<CommentsSnapshot>(EMPTY_SNAPSHOT);
  const [loaded, setLoaded] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const url = domain
      ? "/api/comments?domain=" + encodeURIComponent(domain)
      : "/api/comments?scope=global";

    async function load() {
      const box = boxRef.current;
      if (document.visibilityState === "visible" && box && box.offsetParent !== null) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            const json = (await res.json()) as CommentsSnapshot;
            if (!stopped && Array.isArray(json.items)) {
              setSnap(json);
              setLoaded(true);
            }
          }
        } catch {
          // network hiccup: keep what we last had
        }
      }
      if (!stopped) timer = setTimeout(load, POLL_MS);
    }

    function onUpdated(e: Event) {
      const detail = (e as CustomEvent<CommentsUpdatedDetail>).detail;
      if (domain && detail && detail.domain === domain && Array.isArray(detail.snapshot.items)) {
        setSnap(detail.snapshot);
        setLoaded(true);
      }
    }

    load();
    window.addEventListener(COMMENTS_UPDATED_EVENT, onUpdated);
    return () => {
      stopped = true;
      clearTimeout(timer);
      window.removeEventListener(COMMENTS_UPDATED_EVENT, onUpdated);
    };
  }, [domain]);

  if (loaded && !snap.enabled) return null;

  const summary = summaryText(snap.summary);

  return (
    <div
      ref={boxRef}
      className={"flex h-[300px] flex-col rounded-xl border border-line bg-surface p-4 shadow-card " + className}
    >
      <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
        <h2 className="font-display text-base font-bold text-ink">Live reports</h2>
        <span className="text-[11px] text-muted">Not verified by us</span>
      </div>

      {summary && <p className="mb-3 shrink-0 text-sm text-ink">{summary}</p>}

      {snap.items.length === 0 ? (
        <p className="text-sm text-muted">
          {domain ? "No reports yet for " + domain + "." : "No reports yet."}
        </p>
      ) : (
        <ul className="no-scrollbar -mx-1.5 min-h-0 flex-1 space-y-1 overflow-y-auto px-1.5" aria-live="polite">
          {snap.items.map((item, i) => (
            <li key={item.at + ":" + item.id + ":" + i} className="flex items-center gap-2 text-sm">
              <span
                className={"h-2 w-2 rounded-full shrink-0 " + (item.kind === "good" ? "bg-up" : "bg-down")}
                aria-label={item.kind === "good" ? "Working well" : "Problem"}
              />
              {item.domain ? (
                <Link
                  href={"/site/" + item.domain}
                  className="flex-1 min-w-0 truncate text-ink hover:underline"
                >
                  {item.domain}: {item.label}
                </Link>
              ) : (
                <span className="flex-1 min-w-0 truncate text-ink">Someone reported: {item.label}</span>
              )}
              <span className="shrink-0 text-[11px] text-muted">
                <RelativeTime iso={new Date(item.at).toISOString()} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
