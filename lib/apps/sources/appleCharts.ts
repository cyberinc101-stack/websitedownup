/**
 * Reads Apple's public US top charts (Top Free, Top Paid, Top Grossing;
 * top 100 each) as lists of app ids. Free, no key.
 *
 * Top Free and Top Paid come from Apple's current marketing feed. Top
 * Grossing is only available from Apple's older feed, which may be
 * retired at any time: if it can't be read, the report simply leaves that
 * chart out.
 *
 * SECURITY: fixed Apple hosts, no user input in the URLs.
 * SERVER-ONLY. UNTRUSTED DATA: only numeric ids are kept.
 * UI RULE: never name the feeds in user-facing text.
 * Contains no secrets.
 */

import "server-only";
import { isRecord } from "./shared";

const TIMEOUT_MS = 8000;
const FEEDS = {
  topFree: "https://rss.marketingtools.apple.com/api/v2/us/apps/top-free/100/apps.json",
  topPaid: "https://rss.marketingtools.apple.com/api/v2/us/apps/top-paid/100/apps.json",
  topGrossing: "https://itunes.apple.com/us/rss/topgrossingapplications/limit=100/json",
} as const;

export type ChartName = keyof typeof FEEDS;

function onlyIds(values: unknown[]): string[] {
  return values.filter((v): v is string => typeof v === "string" && /^\d{5,12}$/.test(v));
}

/** Ordered app ids (rank = index + 1), or null if the chart couldn't be read. */
export async function readChart(name: ChartName): Promise<string[] | null> {
  let res: Response;
  try {
    res = await fetch(FEEDS[name], { cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS), redirect: "follow" });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return null;
  }
  if (!isRecord(json) || !isRecord(json.feed)) return null;
  const feed = json.feed;

  // Current feed: { feed: { results: [{ id: "123" }] } }
  if (Array.isArray(feed.results)) {
    const ids = onlyIds(feed.results.map((r) => (isRecord(r) ? r.id : null)));
    return ids.length > 0 ? ids : null;
  }
  // Older feed: { feed: { entry: [{ id: { attributes: { "im:id": "123" } } }] } }
  if (Array.isArray(feed.entry)) {
    const ids = onlyIds(
      feed.entry.map((e) => (isRecord(e) && isRecord(e.id) && isRecord(e.id.attributes) ? e.id.attributes["im:id"] : null))
    );
    return ids.length > 0 ? ids : null;
  }
  return null;
}
