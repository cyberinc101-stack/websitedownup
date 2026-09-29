"use client";

/**
 * "I'm having problems too" button under the report card: lets visitors
 * confirm a live problem crowd-sourced style, separate from our own
 * automated up/down check above it. Shows a live count of reports in the
 * last 15 minutes for this domain, polled every 20s.
 * One report per visitor per domain every 5 minutes, enforced server-side
 * by hashed IP; a local flag also disables the button right away so
 * someone can't spam-click it.
 */

import { useEffect, useState } from "react";

const POLL_MS = 20000;
const STORAGE_PREFIX = "problem-reported:";

interface CountResponse {
  domain: string;
  count: number;
}

export default function ReportProblemButton({ domain }: { domain: string }) {
  const [count, setCount] = useState<number | null>(null);
  const [reported, setReported] = useState(false);
  const [sending, setSending] = useState(false);
  const storageKey = STORAGE_PREFIX + domain;

  useEffect(() => {
    try {
      const until = Number(window.localStorage.getItem(storageKey) || 0);
      if (until > Date.now()) setReported(true);
    } catch {
      // localStorage unavailable; button just stays clickable.
    }
  }, [storageKey]);

  useEffect(() => {
    let stopped = false;
    async function load() {
      try {
        const res = await fetch("/api/report-problem?domain=" + encodeURIComponent(domain));
        if (!res.ok) return;
        const json = (await res.json()) as CountResponse;
        if (!stopped) setCount(json.count);
      } catch {
        // network hiccup: keep whatever we last had
      }
    }
    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [domain]);

  async function submit() {
    if (reported || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/report-problem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      if (res.ok) {
        const json = (await res.json()) as CountResponse;
        setCount(json.count);
      }
    } catch {
      // no-op
    } finally {
      setReported(true);
      try {
        window.localStorage.setItem(storageKey, String(Date.now() + 5 * 60 * 1000));
      } catch {
        // localStorage unavailable
      }
      setSending(false);
    }
  }

  return (
    <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-line bg-white/70 px-4 py-3">
      <div className="text-sm">
        {count !== null && count > 0 ? (
          <span className="text-ink">
            <span className="font-semibold text-down">{count}</span>{" "}
            {count === 1 ? "person has" : "people have"} reported a problem with {domain} in the last 15 minutes.
          </span>
        ) : (
          <span className="text-muted">Seeing a problem with {domain} right now?</span>
        )}
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={reported || sending}
        className={
          "shrink-0 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors " +
          (reported ? "bg-line text-muted cursor-default" : "bg-down-bg text-down hover:opacity-80")
        }
      >
        {reported ? "Thanks \u2014 reported" : "I'm having problems too"}
      </button>
    </div>
  );
}