"use client";

/**
 * Live preset-comment card for a report page, shown under "Recently
 * checked" in the rail. Visitors don't type anything: one dropdown of
 * preset comments ("Having problems" / "Working well"). Picking one sends
 * it immediately, then the control shows a thanks and the cooldown.
 * Shows the newest comments for this domain (server keeps 100, oldest drop
 * off), a summary line, and a "not verified" label.
 * One comment per visitor per domain every 15 minutes, enforced
 * server-side by hashed IP; a local flag also disables the dropdown right
 * away. "Back up now" / "Was down, now recovered" are only offered when our
 * latest check is up and the domain had problem comments in the last hour.
 * Polls /api/comments every 20s while the tab is visible.
 * UNTRUSTED DATA: none. Labels come from a fixed preset list.
 */

import { useEffect, useRef, useState } from "react";
import RelativeTime from "@/components/shared/RelativeTime";
import {
  COMMENT_PRESETS,
  EMPTY_SNAPSHOT,
  type CommentsSnapshot,
} from "@/lib/comments/commentPresets";

const POLL_MS = 20000;
const COOLDOWN_MS = 15 * 60 * 1000;
const STORAGE_PREFIX = "comment-posted:";

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
  status,
  className = "",
}: {
  domain: string;
  /** Our latest check for this domain ("up" or otherwise). */
  status: string;
  className?: string;
}) {
  const [snap, setSnap] = useState<CommentsSnapshot>(EMPTY_SNAPSHOT);
  const [loaded, setLoaded] = useState(false);
  const [cooling, setCooling] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const storageKey = STORAGE_PREFIX + domain;

  useEffect(() => {
    try {
      const until = Number(window.localStorage.getItem(storageKey) || 0);
      if (until > Date.now()) setCooling(true);
    } catch {
      // localStorage unavailable; the server still enforces the cooldown.
    }
  }, [storageKey]);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;

    async function load() {
      const box = boxRef.current;
      if (document.visibilityState === "visible" && box && box.offsetParent !== null) {
        try {
          const res = await fetch("/api/comments?domain=" + encodeURIComponent(domain));
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

    load();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [domain]);

  async function submit(presetId: string) {
    if (cooling || sending || !presetId) return;
    setSending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, preset: presetId }),
      });
      if (res.ok) {
        const json = (await res.json()) as CommentsSnapshot & { alreadyPosted?: boolean };
        if (Array.isArray(json.items)) setSnap(json);
        setCooling(true);
        setMessage(
          json.alreadyPosted
            ? "You've already added one recently. Try again in 15 minutes."
            : "Thanks \u2014 added. You can add another in 15 minutes."
        );
        try {
          window.localStorage.setItem(storageKey, String(Date.now() + COOLDOWN_MS));
        } catch {
          // localStorage unavailable
        }
      } else {
        setMessage("Couldn't add that just now. Please try again.");
      }
    } catch {
      setMessage("Couldn't add that just now. Please try again.");
    } finally {
      setSending(false);
    }
  }

  if (loaded && !snap.enabled) return null;

  const problemPresets = COMMENT_PRESETS.filter((p) => p.kind === "problem");
  const showRecovery = status === "up" && snap.problemsLastHour;
  const goodPresets = COMMENT_PRESETS.filter((p) => p.kind === "good" && (!p.recovery || showRecovery));
  const summary = summaryText(snap.summary);
  const selectId = "comment-select-" + domain;

  return (
    <div
      ref={boxRef}
      className={"rounded-xl border border-line bg-surface p-4 shadow-card " + className}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="font-display text-base font-bold text-ink">Live reports</h2>
        <span className="text-[11px] text-muted">Not verified by us</span>
      </div>

      <label htmlFor={selectId} className="mb-1 block text-xs font-semibold text-muted">
        Say what you&apos;re seeing
      </label>
      <select
        id={selectId}
        value=""
        disabled={cooling || sending}
        onChange={(e) => submit(e.target.value)}
        className="w-full rounded-lg border border-line bg-white/70 px-3 py-2 text-sm text-ink disabled:cursor-default disabled:opacity-60"
      >
        <option value="">{cooling ? "Thanks \u2014 added" : "Choose an option\u2026"}</option>
        <optgroup label="Having problems">
          {problemPresets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </optgroup>
        <optgroup label="Working well">
          {goodPresets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </optgroup>
      </select>
      {message && (
        <p className="mt-2 text-xs text-muted" role="status">
          {message}
        </p>
      )}

      {summary && <p className="mt-3 text-sm text-ink">{summary}</p>}

      {snap.items.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No reports yet for {domain}.</p>
      ) : (
        <ul className="no-scrollbar mt-3 max-h-60 space-y-1 overflow-y-auto pr-1" aria-live="polite">
          {snap.items.map((item, i) => (
            <li key={item.at + ":" + item.id + ":" + i} className="flex items-center gap-2 text-sm">
              <span
                className={"h-2 w-2 rounded-full shrink-0 " + (item.kind === "good" ? "bg-up" : "bg-down")}
                aria-label={item.kind === "good" ? "Working well" : "Problem"}
              />
              <span className="flex-1 min-w-0 truncate text-ink">Someone reported: {item.label}</span>
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
