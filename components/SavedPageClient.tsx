"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteLogo from "@/components/shared/SiteLogo";
import SaveButton from "@/components/shared/SaveButton";
import { useSavedSites, MAX_SAVED } from "@/lib/client/savedSites";
import { sendTestAlert } from "@/lib/client/pushAlerts";
import AdSlot from "@/components/AdSlot";

const REFRESH_MS = 60000;

type Status = { status: "up" | "down"; responseTimeMs: number | null } | null;

async function fetchStatus(domain: string): Promise<Status> {
  try {
    const res = await fetch("/api/check?domain=" + encodeURIComponent(domain));
    if (!res.ok) return null;
    const data = await res.json();
    return { status: data.status, responseTimeMs: data.responseTimeMs };
  } catch {
    return null;
  }
}

function BellButton({ domain }: { domain: string }) {
  const { isAlerting, toggleAlert } = useSavedSites();
  const on = isAlerting(domain);

  return (
    <button
      type="button"
      onClick={() => toggleAlert(domain)}
      aria-pressed={on}
      title={on ? "Turn off alerts for this site" : "Get notified if this site goes down"}
      className={
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors shrink-0 " +
        (on
          ? "border-signal bg-signal text-white"
          : "border-line bg-surface text-muted hover:text-ink hover:border-signal/40")
      }
    >
      <svg viewBox="0 0 24 24" width="13" height="13" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        fill={on ? "currentColor" : "none"} stroke="currentColor">
        <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.7 21a2 2 0 01-3.4 0" />
      </svg>
      {on ? "Alerts on" : "Alert me"}
    </button>
  );
}

function RefreshButton({ domain, onRefresh }: { domain: string; onRefresh: (domain: string) => Promise<void> }) {
  const [checking, setChecking] = useState(false);

  async function handleClick() {
    if (checking) return;
    setChecking(true);
    try {
      await onRefresh(domain);
    } finally {
      setChecking(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={checking}
      title="Check this site now"
      aria-label={"Check " + domain + " now"}
      className="inline-flex items-center justify-center rounded-full border border-line bg-surface p-1.5 text-muted shrink-0 transition-colors hover:text-ink hover:border-signal/40 disabled:opacity-60"
    >
      <svg
        viewBox="0 0 24 24"
        width="13"
        height="13"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={checking ? "animate-spin" : ""}
      >
        <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
        <path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
        <path d="M8 16H3v5" />
      </svg>
    </button>
  );
}

function TestAlertButton() {
  const [state, setState] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setState("sending");
    setError(null);
    const result = await sendTestAlert();
    if (result.ok) {
      setState("ok");
    } else {
      setState("error");
      setError(result.error || "Couldn't send the test notification.");
    }
    setTimeout(() => setState("idle"), 4000);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={state === "sending"}
        className="shrink-0 text-xs font-semibold text-muted hover:text-ink whitespace-nowrap disabled:opacity-60"
      >
        {state === "sending" ? "Sending\u2026" : state === "ok" ? "Sent \u2713" : "Test alert"}
      </button>
      {state === "error" && error && (
        <p className="text-[11px] text-down text-right max-w-[220px]">{error}</p>
      )}
    </div>
  );
}

export default function SavedPageClient() {
  const { sites, clearAll } = useSavedSites();
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const domainKey = sites.map((s) => s.domain).join(",");

  useEffect(() => {
    let stopped = false;

    async function refresh() {
      const domains = domainKey ? domainKey.split(",") : [];
      const results = await Promise.all(
        domains.map(async (domain) => [domain, await fetchStatus(domain)] as const)
      );
      if (!stopped) setStatuses(Object.fromEntries(results));
    }

    refresh();
    const id = setInterval(refresh, REFRESH_MS);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [domainKey]);

  async function refreshOne(domain: string) {
    const result = await fetchStatus(domain);
    setStatuses((prev) => ({ ...prev, [domain]: result }));
  }

  function handleClearAll() {
    if (sites.length === 0) return;
    const ok = window.confirm(
      "Remove all " + sites.length + " saved site" + (sites.length === 1 ? "" : "s") + "? This can't be undone."
    );
    if (ok) clearAll();
  }

  const sortedSites = [...sites].sort((a, b) => {
    const aDown = statuses[a.domain]?.status === "down";
    const bDown = statuses[b.domain]?.status === "down";
    if (aDown === bDown) return 0;
    return aDown ? -1 : 1;
  });

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-8 py-10">
      <h1 className="font-display text-2xl font-bold text-ink mb-1">Saved sites</h1>
      <div className="mb-6 flex items-start justify-between gap-3">
        <p className="text-sm text-muted">
          {sites.length} of {MAX_SAVED} saved. Turn on alerts to get a notification the moment a saved site goes
          down &mdash; this works even if your browser is closed.
        </p>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <TestAlertButton />
          {sites.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs font-semibold text-muted hover:text-down whitespace-nowrap"
            >
              Remove all
            </button>
          )}
        </div>
      </div>

      <AdSlot className="mb-8 min-h-[200px]" />

      {sites.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface px-5 py-10 text-center">
          <p className="text-sm text-muted mb-3">You haven&apos;t saved any sites yet.</p>
          <Link href="/" className="text-sm font-semibold text-signal hover:underline">
            &larr; Check a site to save it
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {sortedSites.map((s) => {
            const st = statuses[s.domain];
            const down = st?.status === "down";
            return (
              <li
                key={s.domain}
                className={
                  "flex items-center gap-3 rounded-lg border px-3 py-2.5 " +
                  (down ? "border-down-line bg-down-bg" : "border-line bg-surface")
                }
              >
                <SiteLogo domain={s.domain} className="h-8 w-8 rounded-md shrink-0" />
                <Link href={"/site/" + s.domain} className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink truncate">{s.domain}</p>
                  <p className="text-xs text-muted">
                    {!st ? "Checking\u2026" : down ? "Down" : (st.responseTimeMs ?? "?") + " ms"}
                  </p>
                </Link>
                <span className={"h-2 w-2 rounded-full shrink-0 " + (down ? "bg-down" : "bg-up")} aria-hidden="true" />
                <RefreshButton domain={s.domain} onRefresh={refreshOne} />
                <BellButton domain={s.domain} />
                <SaveButton domain={s.domain} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}