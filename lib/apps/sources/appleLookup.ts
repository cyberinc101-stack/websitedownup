/**
 * Reads public App Store data through Apple's free, official lookup
 * endpoint (no key, no cost): an app's listing in a given storefront, and
 * a developer's other apps.
 *
 * Apple asks callers to stay around 20 lookups a minute, so callers must
 * cache (lib/server/appSignals.ts caches every app for 24 hours).
 *
 * SECURITY: requests go to a fixed Apple host; ids are digits only and
 * country codes come from our own list, so there's no SSRF risk.
 * SERVER-ONLY. UNTRUSTED DATA: parsed defensively via ./shared.
 * UI RULE: never name the lookup endpoint in user-facing text.
 * Contains no secrets.
 */

import "server-only";
import type { AppListing, DeveloperApp } from "../types";
import { isRecord, isoDate, num, safeIcon, str } from "./shared";

const LOOKUP_URL = "https://itunes.apple.com/lookup";
const TIMEOUT_MS = 7000;
const MAX_NOTES = 400;
const APPLE_IMAGE_HOSTS = ["mzstatic.com"];

type Raw = Record<string, unknown>;

export type LookupOutcome<T> = { ok: true; value: T } | { ok: false; notFound: boolean };

async function lookup(params: string): Promise<LookupOutcome<Raw[]>> {
  let res: Response;
  try {
    res = await fetch(LOOKUP_URL + "?" + params, { cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch {
    return { ok: false, notFound: false };
  }
  if (!res.ok) return { ok: false, notFound: false };
  try {
    const json: unknown = await res.json();
    const results = isRecord(json) && Array.isArray(json.results) ? json.results.filter(isRecord) : [];
    return { ok: true, value: results };
  } catch {
    return { ok: false, notFound: false };
  }
}

function strList(v: unknown, max: number): string[] {
  return Array.isArray(v) ? v.map(str).filter((s): s is string => s !== null).slice(0, max) : [];
}

function httpsUrl(v: unknown): string | null {
  if (typeof v !== "string") return null;
  try {
    const u = new URL(v);
    return u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export function listingFromRaw(app: Raw, id: string): AppListing | null {
  const name = str(app.trackName);
  if (!name || app.kind !== "software") return null;
  const view = str(app.trackViewUrl);
  const notes = typeof app.releaseNotes === "string" ? app.releaseNotes.trim() : "";
  const features = strList(app.features, 20);
  const ipadShots = Array.isArray(app.ipadScreenshotUrls) ? app.ipadScreenshotUrls.length : 0;
  const shots = Array.isArray(app.screenshotUrls) ? app.screenshotUrls.length : 0;
  return {
    id,
    name,
    developer: str(app.sellerName) ?? str(app.artistName),
    developerId: typeof app.artistId === "number" ? String(app.artistId) : null,
    developerUrl: httpsUrl(app.sellerUrl),
    iconUrl: safeIcon(app.artworkUrl512 ?? app.artworkUrl100, APPLE_IMAGE_HOSTS),
    category: str(app.primaryGenreName),
    genres: strList(app.genres, 6),
    rating: num(app.averageUserRating),
    ratingCount: num(app.userRatingCount),
    currentVersionRating: num(app.averageUserRatingForCurrentVersion),
    currentVersionRatingCount: num(app.userRatingCountForCurrentVersion),
    price: num(app.price) ?? 0,
    releasedAt: isoDate(app.releaseDate),
    updatedAt: isoDate(app.currentVersionReleaseDate),
    version: str(app.version),
    fileSizeBytes: num(app.fileSizeBytes),
    minOsVersion: str(app.minimumOsVersion),
    languageCount: Array.isArray(app.languageCodesISO2A) ? new Set(app.languageCodesISO2A).size : 0,
    contentRating: str(app.trackContentRating) ?? str(app.contentAdvisoryRating),
    supportsIpad: features.includes("iosUniversal") || ipadShots > 0,
    screenshotCount: shots + ipadShots,
    releaseNotes: notes ? (notes.length > MAX_NOTES ? notes.slice(0, MAX_NOTES - 1) + "…" : notes) : null,
    descriptionLength: typeof app.description === "string" ? app.description.length : 0,
    gameCenter: app.isGameCenterEnabled === true,
    storeUrl: view && view.startsWith("https://apps.apple.com/") ? view.split("?")[0] : "https://apps.apple.com/app/id" + id,
  };
}

/** The app's listing in one storefront (country code from our own list). */
export async function lookupListing(id: string, country: string): Promise<LookupOutcome<AppListing>> {
  if (!/^\d{5,12}$/.test(id) || !/^[a-z]{2}$/.test(country)) return { ok: false, notFound: true };
  const r = await lookup("id=" + id + "&country=" + country + "&entity=software");
  if (!r.ok) return r;
  const raw = r.value.find((x) => x.kind === "software");
  const listing = raw ? listingFromRaw(raw, id) : null;
  return listing ? { ok: true, value: listing } : { ok: false, notFound: true };
}

/** Up to `limit` other apps by the same developer (US store), most-rated first. */
export async function lookupDeveloperApps(developerId: string, excludeId: string, limit: number): Promise<DeveloperApp[]> {
  if (!/^\d{3,12}$/.test(developerId)) return [];
  const r = await lookup("id=" + developerId + "&entity=software&limit=50&country=us");
  if (!r.ok) return [];
  const apps: DeveloperApp[] = [];
  for (const raw of r.value) {
    if (raw.kind !== "software" || typeof raw.trackId !== "number") continue;
    const id = String(raw.trackId);
    const name = str(raw.trackName);
    if (id === excludeId || !name) continue;
    apps.push({
      id,
      name,
      rating: num(raw.averageUserRating),
      ratingCount: num(raw.userRatingCount),
      price: num(raw.price) ?? 0,
      iconUrl: safeIcon(raw.artworkUrl100 ?? raw.artworkUrl60, APPLE_IMAGE_HOSTS),
    });
  }
  return apps.sort((a, b) => (b.ratingCount ?? 0) - (a.ratingCount ?? 0)).slice(0, limit);
}
