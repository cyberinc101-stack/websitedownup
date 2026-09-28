/**
 * SERVER-ONLY entry point for App Worth data. The API route calls
 * getAppSignals(); never call the Apple lookups directly.
 *
 *  - Everything for one app (US listing, ratings in the other tracked
 *    countries, developer's other apps) is fetched in parallel and cached
 *    for 24 hours, shared by all visitors. That keeps us well inside
 *    Apple's ~20 lookups a minute guidance.
 *  - The three US charts are cached for 3 hours and shared by every app.
 *  - Failures are never cached. A country or chart that can't be read is
 *    simply left out of the report.
 * Free: no key, no cost. Contains no secrets.
 */

import "server-only";
import { unstable_cache } from "next/cache";
import { appleAppId, ANDROID_MESSAGE, INPUT_MESSAGE, parseAppInput } from "@/lib/apps/parseAppInput";
import { lookupDeveloperApps, lookupListing } from "@/lib/apps/sources/appleLookup";
import { readChart, type ChartName } from "@/lib/apps/sources/appleCharts";
import { RATING_COUNTRIES } from "@/data/apps/appCategories";
import type { AppLookupResponse, AppSignals, ChartRanks, CountryRating } from "@/lib/apps/types";

const APP_CACHE_SECONDS = 86400;
const CHART_CACHE_SECONDS = 10800;
const CACHE_VERSION = "v1";
const DEVELOPER_APPS_SHOWN = 8;

function cachedChart(name: ChartName): Promise<string[] | null> {
  const load = unstable_cache(
    async () => {
      const ids = await readChart(name);
      if (!ids) throw new Error("uncacheable");
      return ids;
    },
    ["app-chart", CACHE_VERSION, name],
    { revalidate: CHART_CACHE_SECONDS }
  );
  return load().catch(() => null);
}

async function chartRanks(id: string): Promise<ChartRanks> {
  const [free, paid, grossing] = await Promise.all([cachedChart("topFree"), cachedChart("topPaid"), cachedChart("topGrossing")]);
  const rank = (ids: string[] | null) => {
    if (!ids) return null;
    const i = ids.indexOf(id);
    return i >= 0 ? i + 1 : null;
  };
  return {
    topFree: rank(free),
    topPaid: rank(paid),
    topGrossing: rank(grossing),
    checked: { topFree: free !== null, topPaid: paid !== null, topGrossing: grossing !== null },
  };
}

type Collected = Omit<AppSignals, "charts">;

async function collect(id: string): Promise<Collected | null> {
  // The US listing is the anchor; if the app isn't sold in the US, try the others.
  const results = await Promise.all(RATING_COUNTRIES.map((c) => lookupListing(id, c.code)));
  const anchorIndex = results.findIndex((r) => r.ok);
  if (anchorIndex < 0) return null;
  const anchor = results[anchorIndex];
  if (!anchor.ok) return null;

  const countries: CountryRating[] = [];
  results.forEach((r, i) => {
    if (r.ok && (r.value.ratingCount ?? 0) > 0) {
      const c = RATING_COUNTRIES[i];
      countries.push({ code: c.code, label: c.label, ratingCount: r.value.ratingCount ?? 0, rating: r.value.rating });
    }
  });
  countries.sort((a, b) => b.ratingCount - a.ratingCount);

  const listing = anchor.value;
  const developerApps = listing.developerId ? await lookupDeveloperApps(listing.developerId, id, DEVELOPER_APPS_SHOWN) : [];

  return { checkedAt: new Date().toISOString(), listing, countries, developerApps };
}

async function cachedCollect(id: string): Promise<Collected | null> {
  const load = unstable_cache(
    async () => {
      const c = await collect(id);
      if (!c) throw new Error("uncacheable");
      return c;
    },
    ["app-signals", CACHE_VERSION, id],
    { revalidate: APP_CACHE_SECONDS }
  );
  try {
    return await load();
  } catch {
    return null;
  }
}

export async function getAppSignals(rawInput: string): Promise<AppLookupResponse> {
  const parsed = parseAppInput(rawInput);
  if (parsed && parsed.kind === "google") return { ok: false, error: ANDROID_MESSAGE };
  const id = appleAppId(rawInput);
  if (!id) return { ok: false, error: INPUT_MESSAGE };

  const [collected, charts] = await Promise.all([cachedCollect(id), chartRanks(id)]);
  if (!collected) {
    return { ok: false, error: "No App Store app was found with that link, or the App Store didn't answer. Try again in a moment." };
  }
  return { ok: true, signals: { ...collected, charts } };
}
