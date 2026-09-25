"use client";

/**
 * Client body of /saved  the one screen for both saved sites and their
 * alert toggles, reached via the star link in the header. Data lives in
 * the browser (lib/client/savedSites.ts); statuses are fetched from
 * /api/check per saved domain on load and refreshed every REFRESH_MS.
 * The page title itself is set by app/saved/page.tsx (a server component,
 * since "use client" pages can't export metadata).
 *
 * Alerts: toggleAlert() (in lib/client/savedSites.ts) handles the whole
 * Web Push subscribe/permission flow itself, so BellButton just flips the
 * toggle  no separate permission call needed here.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteLogo from "@/components/shared/SiteLogo";
import SaveButton from "@/components/shared/SaveButton";
import { useSavedSites, MAX_SAVED } from "@/lib/client/savedSites";
import AdSlot from "@/components/AdSlot";

const REFRESH_MS = 60000;

type Status = { status: "up" | "down"; responseTimeMs: number | null } | null;

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

export default function SavedPageClient() {
  const { sites } = useSavedSites();
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const domainKey = sites.map((s) => s.domain).join(",");

  useEffect(() => {
    let stopped = false;

    async function refresh() {
      const domains = domainKey ? domainKey.split(",") : [];
      const results = await Promise.all(
        domains.map(async (domain) => {
          try {
            const res = await fetch("/api/check?domain=" + encodeURIComponent(domain));
            if (!res.ok) return [domain, null] as const;
            const data = await res.json();
            return [domain, { status: data.status, responseTimeMs: data.responseTimeMs }] as const;
          } catch {
            return [domain, null] as const;
          }
        })
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

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-8 py-10">
      <h1 className="font-display text-2xl font-bold text-ink mb-1">Saved sites</h1>
      <p className="text-sm text-muted mb-6">
        {sites.length} of {MAX_SAVED} saved. Turn on alerts to get a notification the moment a saved site goes
        down &mdash; this works even if your browser is closed.
      </p>

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
          {sites.map((s) => {
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
