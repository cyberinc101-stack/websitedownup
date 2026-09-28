/**
 * Finds App Store apps by name through Apple's free, official search
 * endpoint (no key, no cost). Powers the name search on /app-worth.
 *
 * Apple asks callers to stay around 20 requests a minute, so the caller
 * (lib/server/appSearch.ts) caches every search term for 24 hours and the
 * browser waits until the visitor stops typing before asking.
 *
 * SECURITY: requests go to a fixed Apple host; the term is URL-encoded and
 * length-limited. SERVER-ONLY. UNTRUSTED DATA: parsed defensively.
 * UI RULE: never name the search endpoint in user-facing text.
 * Contains no secrets.
 */

import "server-only";
import type { AppSearchResult } from "../types";
import { isRecord, num, safeIcon, str } from "./shared";

const SEARCH_URL = "https://itunes.apple.com/search";
const TIMEOUT_MS = 6000;
const APPLE_IMAGE_HOSTS = ["mzstatic.com"];

/** Up to `limit` matching iPhone/iPad apps in the US store, or null if Apple didn't answer. */
export async function searchApps(term: string, limit: number): Promise<AppSearchResult[] | null> {
  const params =
    "term=" + encodeURIComponent(term) + "&entity=software&country=us&limit=" + Math.min(Math.max(limit, 1), 25);
  let res: Response;
  try {
    res = await fetch(SEARCH_URL + "?" + params, { cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });
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
  const raw = isRecord(json) && Array.isArray(json.results) ? json.results.filter(isRecord) : [];
  const out: AppSearchResult[] = [];
  for (const app of raw) {
    if (app.kind !== "software" || typeof app.trackId !== "number") continue;
    const name = str(app.trackName);
    if (!name) continue;
    out.push({
      id: String(app.trackId),
      name,
      developer: str(app.sellerName) ?? str(app.artistName),
      iconUrl: safeIcon(app.artworkUrl100 ?? app.artworkUrl60, APPLE_IMAGE_HOSTS),
      rating: num(app.averageUserRating),
      ratingCount: num(app.userRatingCount),
      price: num(app.price) ?? 0,
    });
  }
  return out;
}
