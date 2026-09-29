"use client";

/**
 * The comment dropdown, shown under the report container. Visitors don't
 * type anything: they pick a preset ("Having problems" / "Working well").
 * Picking one sends it immediately, then the control shows a thanks and the
 * cooldown. The feed under "Recently checked" (CommentsFeed) updates right
 * away through a browser event.
 * One comment per visitor per domain every 15 minutes, plus hourly limits
 * across sites, all enforced server-side by hashed IP (see
 * app/api/comments/route.ts); a local flag also disables the dropdown right
 * away.
 * "Back up now" / "Was down, now recovered" are only offered when our latest
 * check is up and the domain had problem comments in the last hour.
 */

import { useEffect, useState } from "react";
import {
  COMMENT_PRESETS,
  COMMENTS_UPDATED_EVENT,
  type CommentsSnapshot,
  type CommentsUpdatedDetail,
} from "@/lib/comments/commentPresets";

const COOLDOWN_MS = 15 * 60 * 1000;
const STORAGE_PREFIX = "comment-posted:";

export default function CommentPicker({ domain, status }: { domain: string; status: string }) {
  const [problemsLastHour, setProblemsLastHour] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [cooling, setCooling] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const storageKey = STORAGE_PREFIX + domain;

  useEffect(() => {
    try {
      const until = Number(window.localStorage.getItem(storageKey) || 0);
      if (until > Date.now()) setCooling(true);
    } catch {
      // localStorage unavailable; the server still enforces the cooldown.
    }
  }, [storageKey]);

  // One fetch on load, only to know whether the "back up" options make sense.
  useEffect(() => {
    let stopped = false;
    async function load() {
      try {
        const res = await fetch("/api/comments?domain=" + encodeURIComponent(domain));
        if (!res.ok) return;
        const json = (await res.json()) as CommentsSnapshot;
        if (!stopped) {
          setEnabled(json.enabled !== false);
          setProblemsLastHour(Boolean(json.problemsLastHour));
        }
      } catch {
        // network hiccup: recovery options just stay hidden
      }
    }
    load();
    return () => {
      stopped = true;
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
        const json = (await res.json()) as CommentsSnapshot & {
          alreadyPosted?: boolean;
          reason?: "cooldown" | "limit" | null;
        };
        if (Array.isArray(json.items)) {
          setProblemsLastHour(Boolean(json.problemsLastHour));
          window.dispatchEvent(
            new CustomEvent<CommentsUpdatedDetail>(COMMENTS_UPDATED_EVENT, {
              detail: { domain, snapshot: json },
            })
          );
        }
        setCooling(true);
        if (json.reason === "limit") {
          setMessage("You've reached the limit for now. Please try again later.");
        } else if (json.alreadyPosted) {
          setMessage("You've already added one recently. Try again in 15 minutes.");
        } else {
          setMessage("Thanks \u2014 added. You can add another in 15 minutes.");
        }
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

  if (!enabled) return null;

  const showRecovery = status === "up" && problemsLastHour;
  const problemPresets = COMMENT_PRESETS.filter((p) => p.kind === "problem");
  const goodPresets = COMMENT_PRESETS.filter((p) => p.kind === "good" && (!p.recovery || showRecovery));
  const selectId = "comment-select-" + domain;

  return (
    <div className="mt-3 rounded-lg border border-line bg-white/70 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label htmlFor={selectId} className="text-sm text-ink">
          Say what you&apos;re seeing with {domain}
          <span className="block text-[11px] text-muted">Shows in Live reports. Not verified by us.</span>
        </label>
        <select
          id={selectId}
          value=""
          disabled={cooling || sending}
          onChange={(e) => submit(e.target.value)}
          className="min-w-[200px] shrink-0 rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-ink disabled:cursor-default disabled:opacity-60"
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
      </div>
      {message && (
        <p className="mt-2 text-xs text-muted" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
