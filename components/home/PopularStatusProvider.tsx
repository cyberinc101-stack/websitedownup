"use client";

/**
 * Shares the live popular-sites snapshot with every homepage section that
 * shows it (outage alert, Having problems, the site grid) and keeps it
 * fresh: polls /api/popular every 30 seconds while the tab is visible.
 * Starts from the server-rendered snapshot, so nothing flashes on load.
 * No security logic. Data is public.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { PopularSnapshot } from "@/lib/server/popularStatus";

const POLL_MS = 30000;

const PopularContext = createContext<PopularSnapshot | null>(null);

function isSnapshot(value: unknown): value is PopularSnapshot {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.checkedAt === "string" && Array.isArray(v.sites) && v.sites.length > 0;
}

export function PopularStatusProvider({
  initial,
  children,
}: {
  initial: PopularSnapshot;
  children: ReactNode;
}) {
  const [snapshot, setSnapshot] = useState<PopularSnapshot>(initial);

  useEffect(() => {
    let stopped = false;

    async function poll() {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/popular");
        if (!res.ok) return;
        const data: unknown = await res.json();
        if (!stopped && isSnapshot(data)) setSnapshot(data);
      } catch {
        // Network hiccup: keep the last snapshot.
      }
    }

    const id = setInterval(poll, POLL_MS);
    // Catch up right away when someone returns to the tab.
    const onVisible = () => {
      if (document.visibilityState === "visible") poll();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return <PopularContext.Provider value={snapshot}>{children}</PopularContext.Provider>;
}

export function usePopularSnapshot(): PopularSnapshot {
  const snapshot = useContext(PopularContext);
  if (!snapshot) throw new Error("usePopularSnapshot must be used inside <PopularStatusProvider>");
  return snapshot;
}
