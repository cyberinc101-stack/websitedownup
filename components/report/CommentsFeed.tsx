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
 * VOTES: every comment has Accurate / Not accurate buttons. The visitor's
 * own choice is remembered in localStorage (lib/client/commentVotes.ts),
 * tapping the same button again undoes it, and the counts come from the
 * server (POST /api/comments/vote). Disputed comments are dimmed and
 * labelled. Sending a vote first shows VoteAdGate (first vote of a session,
 * then at most once every 10 minutes); undoing a vote never shows it.
 *
 * Sized like the other rail boxes: fixed 300px height with its own scroll
 * (scrollbar hidden via .no-scrollbar, scrolling still works), so it never
 * grows taller than its neighbours however many comments there are.
 *
 * AD GATE (row click): uses the AdSense slot when ads are live (ADS_LIVE)
 * and the Monetag SmartLink (opened in a new tab when the visitor clicks
 * Close). If neither is set up, rows go straight to the report.
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
import VoteAdGate, { VOTE_AD_ENABLED } from "@/components/report/VoteAdGate";
import { ADS_LIVE } from "@/lib/config/site";
import { MONETAG_SMARTLINK } from "@/lib/config/monetag";
import {
  COMMENTS_UPDATED_EVENT,
  EMPTY_SNAPSHOT,
  type CommentsSnapshot,
  type CommentsUpdatedDetail,
} from "@/lib/comments/commentPresets";
import { isDisputed, type VotableItem } from "@/lib/comments/votes";
import { getMyVotes, saveMyVote, voteAdDue, markVoteAdShown, type MyVote } from "@/lib/client/commentVotes";

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

function Thumb({ down = false }: { down?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={"h-3 w-3 fill-current" + (down ? " rotate-180" : "")} aria-hidden="true">
      <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
    </svg>
  );
}

/** Accurate / Not accurate buttons under one comment. */
function VoteBar({
  up,
  down,
  mine,
  busy,
  onVote,
  className = "",
}: {
  up: number;
  down: number;
  mine: MyVote | undefined;
  busy: boolean;
  onVote: (choice: MyVote) => void;
  className?: string;
}) {
  const base =
    "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold transition-colors disabled:opacity-50";
  return (
    <div className={"flex flex-wrap items-center gap-1 " + className}>
      <button
        type="button"
        disabled={busy}
        aria-pressed={mine === "up"}
        aria-label="Mark this report as accurate"
        onClick={() => onVote("up")}
        className={base + " " + (mine === "up" ? "bg-up-bg text-up" : "text-muted hover:bg-bg")}
      >
        <Thumb />
        Accurate {up}
      </button>
      <button
        type="button"
        disabled={busy}
        aria-pressed={mine === "down"}
        aria-label="Mark this report as not accurate"
        onClick={() => onVote("down")}
        className={base + " " + (mine === "down" ? "bg-down-bg text-down" : "text-muted hover:bg-bg")}
      >
        <Thumb down />
        Not accurate {down}
      </button>
      {isDisputed(up, down) && <span className="text-[11px] font-semibold text-slow">Disputed</span>}
    </div>
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
  const [mine, setMine] = useState<Record<string, MyVote>>({});
  const [busyCid, setBusyCid] = useState<string | null>(null);
  const [pending, setPending] = useState<{ item: VotableItem; vote: MyVote } | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMine(getMyVotes());
  }, []);

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

  function flash(message: string) {
    setNote(message);
    setTimeout(() => setNote(null), 3500);
  }

  async function submitVote(target: VotableItem, vote: MyVote | "none") {
    const voteDomain = target.domain || domain;
    const cid = target.cid;
    if (!voteDomain || !cid) return;
    setBusyCid(cid);
    try {
      const res = await fetch("/api/comments/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: voteDomain, cid, vote }),
      });
      if (!res.ok && res.status !== 429 && res.status !== 404) {
        let msg = "";
        try {
          msg = ((await res.json()) as { error?: string }).error || "";
        } catch {
          // no JSON body
        }
        flash("Vote failed (" + res.status + ")" + (msg ? ": " + msg : ""));
        return;
      }
      if (res.status === 429) {
        flash("Slow down a little, then try again.");
        return;
      }
      if (res.status === 404) {
        flash("That report has expired.");
        return;
      }
      if (!res.ok) {
        flash("Couldn't save your vote.");
        return;
      }
      const json = (await res.json()) as { up: number; down: number; mine: MyVote | null };
      saveMyVote(cid, json.mine);
      setMine(getMyVotes());
      setSnap((prev) => ({
        ...prev,
        items: (prev.items as VotableItem[]).map((i) => (i.cid === cid ? { ...i, up: json.up, down: json.down } : i)),
      }));
    } catch {
      flash("Couldn't save your vote.");
    } finally {
      setBusyCid(null);
    }
  }

  function onVoteClick(item: VotableItem, choice: MyVote) {
    if (!item.cid) return;
    // Tapping the same button again undoes the vote (no ad for that).
    if (mine[item.cid] === choice) {
      void submitVote(item, "none");
      return;
    }
    if (VOTE_AD_ENABLED && voteAdDue()) {
      setPending({ item, vote: choice });
      return;
    }
    void submitVote(item, choice);
  }

  function confirmPending() {
    if (!pending) return;
    markVoteAdShown();
    const { item, vote } = pending;
    setPending(null);
    void submitVote(item, vote);
  }

  const cancelPending = useCallback(() => setPending(null), []);

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
  const items = snap.items as VotableItem[];

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
      {note && (
        <p className="mb-2 shrink-0 text-xs text-slow" role="status">
          {note}
        </p>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-muted">
          {domain ? "No reports yet for " + domain + "." : "No reports yet."}
        </p>
      ) : (
        <ul className="no-scrollbar -mx-1.5 min-h-0 flex-1 space-y-1.5 overflow-y-auto px-1.5" aria-live="polite">
          {items.map((item, i) => {
            const up = item.up ?? 0;
            const down = item.down ?? 0;
            const canVote = typeof item.cid === "string";
            return (
              <li
                key={item.at + ":" + item.id + ":" + i}
                className={isDisputed(up, down) ? "opacity-60" : undefined}
              >
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
                {canVote && (
                  <VoteBar
                    up={up}
                    down={down}
                    mine={mine[item.cid as string]}
                    busy={busyCid === item.cid}
                    onVote={(choice) => onVoteClick(item, choice)}
                    className={item.domain ? "pl-11" : "pl-5"}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}

      {gateDomain && <AdGate domain={gateDomain} onDone={closeGate} />}
      {pending && <VoteAdGate onConfirm={confirmPending} onCancel={cancelPending} />}
    </div>
  );
}