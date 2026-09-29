"use client";

/**
 * "Live reports" card shown under "Recently checked" in the rail. Display
 * only: comments are added with the dropdown under the report container
 * (CommentPicker).
 *  - With a domain (report pages): that domain's newest comments and a
 *    summary line. Updates at once when the dropdown is used, and polls
 *    every 20s.
 *  - Without a domain (home page): the newest comments across all sites.
 *    Each row shows the site's logo in a square tile, the domain and the
 *    full comment, and the whole row links to that site's report. Clicking
 *    it first opens an ad the visitor closes, then goes to the report
 *    (see AdGate below). Ctrl/Cmd/Shift/middle clicks skip the ad and use
 *    the normal link.
 * The server keeps the newest 100 and the oldest drop off by themselves.
 * Each comment shows in full: long ones wrap onto extra lines instead of
 * being cut off with an ellipsis.
 *
 * Sized like the other rail boxes: fixed 300px height with its own scroll
 * (scrollbar hidden via .no-scrollbar, scrolling still works), so it never
 * grows taller than its neighbours however many comments there are. Wrapped
 * comments make the list scroll further, never the card taller.
 *
 * AD GATE: uses the AdSense slot when ads are live (ADS_LIVE) and the
 * Monetag SmartLink (opened in a new tab when the visitor clicks Close, the
 * same way the leave-site gate does it). If neither is set up, rows go
 * straight to the report with no gate.
 *
 * UNTRUSTED DATA: none. Labels come from a fixed preset list; domains were
 * validated before they were stored.
 */

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import RelativeTime from "@/components/shared/RelativeTime";
import SiteLogo from "@/components/shared/SiteLogo";
import AdSlot from "@/components/AdSlot";
import { ADS_LIVE } from "@/lib/config/site";
import { MONETAG_SMARTLINK } from "@/lib/config/monetag";
import {
  COMMENTS_UPDATED_EVENT,
  EMPTY_SNAPSHOT,
  type CommentsSnapshot,
  type CommentsUpdatedDetail,
} from "@/lib/comments/commentPresets";

const POLL_MS = 20000;
/** Seconds before the Close button works, so the ad is actually seen. */
const CLOSE_DELAY_SECONDS = 3;
const AD_URL = /^https:\/\//.test(MONETAG_SMARTLINK) ? MONETAG_SMARTLINK : null;
const HAS_AD = ADS_LIVE || AD_URL !== null;

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

/** Ad the visitor closes before being sent to the site's report page. */
function AdGate({ domain, onDone }: { domain: string; onDone: () => void }) {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(CLOSE_DELAY_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const close = useCallback(() => {
    if (AD_URL) window.open(AD_URL, "_blank", "noopener");
    router.push("/site/" + domain);
    onDone();
  }, [domain, router, onDone]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && secondsLeft <= 0) close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [secondsLeft, close]);

  const ready = secondsLeft <= 0;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={"Advertisement before the " + domain + " report"}
    >
      <div className="w-full max-w-md rounded-xl border border-line bg-surface p-5 text-center shadow-card">
        <p className="mb-1 font-mono text-xs uppercase tracking-widest text-signal">One moment</p>
        <h2 className="mb-4 font-display text-lg font-bold text-ink">Opening the {domain} report</h2>

        {ADS_LIVE && <AdSlot className="mb-4 min-h-[250px]" />}

        <button
          type="button"
          onClick={close}
          disabled={!ready}
          className={
            "rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors " +
            (ready ? "bg-signal text-white hover:bg-signal-dark" : "cursor-default bg-line text-muted")
          }
        >
          {ready ? "Close and view report" : "Close in " + secondsLeft}
        </button>

        {AD_URL && ready && (
          <p className="mt-3 text-xs text-muted">A sponsor page opens in a new tab while the report loads.</p>
        )}
      </div>
    </div>,
    document.body
  );
}

export default function CommentsFeed({
  domain,
  className = "",
}: {
  /** Leave out for the site-wide feed on the home page. */
  domain?: string;
  className?: string;
}) {
  const router = useRouter();
  const [snap, setSnap] = useState<CommentsSnapshot>(EMPTY_SNAPSHOT);
  const [loaded, setLoaded] = useState(false);
  const [gateDomain, setGateDomain] = useState<string | null>(null);
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

  const closeGate = useCallback(() => setGateDomain(null), []);

  function openReport(e: MouseEvent<HTMLAnchorElement>, target: string) {
    // Let new-tab / new-window clicks use the plain link.
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (!HAS_AD) {
      router.push("/site/" + target);
      return;
    }
    setGateDomain(target);
  }

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
            <li key={item.at + ":" + item.id + ":" + i}>
              {item.domain ? (
                <Link
                  href={"/site/" + item.domain}
                  onClick={(e) => openReport(e, item.domain as string)}
                  className="flex items-start gap-2 rounded-md px-1 py-1 transition-colors hover:bg-bg"
                >
                  <SiteLogo domain={item.domain} className="h-8 w-8 shrink-0 rounded-md" />
                  <span className="min-w-0 flex-1">
                    <span className="block break-words text-xs font-semibold text-ink">{item.domain}</span>
                    <span className="flex items-start gap-1.5 text-sm text-ink">
                      <span
                        className={
                          "mt-1.5 h-2 w-2 shrink-0 rounded-full " + (item.kind === "good" ? "bg-up" : "bg-down")
                        }
                        aria-label={item.kind === "good" ? "Working well" : "Problem"}
                      />
                      <span className="min-w-0 break-words">{item.label}</span>
                    </span>
                  </span>
                  <span className="mt-0.5 shrink-0 text-[11px] text-muted">
                    <RelativeTime iso={new Date(item.at).toISOString()} />
                  </span>
                </Link>
              ) : (
                <div className="flex items-start gap-2 px-1 py-0.5 text-sm">
                  <span
                    className={
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full " + (item.kind === "good" ? "bg-up" : "bg-down")
                    }
                    aria-label={item.kind === "good" ? "Working well" : "Problem"}
                  />
                  <span className="min-w-0 flex-1 break-words text-ink">Someone reported: {item.label}</span>
                  <span className="mt-0.5 shrink-0 text-[11px] text-muted">
                    <RelativeTime iso={new Date(item.at).toISOString()} />
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {gateDomain && <AdGate domain={gateDomain} onDone={closeGate} />}
    </div>
  );
}
