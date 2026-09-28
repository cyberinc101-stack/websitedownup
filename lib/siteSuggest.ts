/**
 * Website suggestions for the search boxes (status checker and Website
 * Worth): lets people type a name like "netflix" instead of an address.
 *
 *  - suggestSites(): matches from our own lists of well-known sites
 *    (lib/sites.ts + lib/watchlist.ts). No network request.
 *  - resolveSiteInput(): turns whatever was typed into a domain to check:
 *    a real address as typed, a known site's name ("Wells Fargo"), or a
 *    single word as word.com ("netflix" -> netflix.com).
 *
 * CLIENT-SAFE: no Node-only imports. Contains no secrets.
 */

import { isLikelyValidDomain, normalizeDomain } from "@/lib/checkSite";
import { POPULAR_SITES, type ListedSite } from "@/lib/sites";
import { EXTRA_WATCH_SITES } from "@/lib/watchlist";

const KNOWN: ListedSite[] = (() => {
  const seen = new Set<string>();
  const out: ListedSite[] = [];
  for (const s of [...POPULAR_SITES, ...EXTRA_WATCH_SITES]) {
    if (seen.has(s.domain)) continue;
    seen.add(s.domain);
    out.push(s);
  }
  return out;
})();

/** Lowercase letters and digits only, for loose name matching ("Lowe's" -> "lowes"). */
function squash(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** What was typed, cleaned the way an address would be ("https://www.x.com/y" -> "x.com"). */
function cleanQuery(raw: string): string {
  return normalizeDomain(raw);
}

/** Up to `limit` known sites matching what was typed, best match first. */
export function suggestSites(raw: string, limit = 6): ListedSite[] {
  const q = cleanQuery(raw);
  const qs = squash(q);
  if (qs.length < 1) return [];
  const scored: Array<{ site: ListedSite; score: number; rank: number }> = [];
  KNOWN.forEach((site, rank) => {
    const name = squash(site.name);
    const domain = site.domain;
    let score = -1;
    if (name === qs || domain === q) score = 0;
    else if (name.startsWith(qs)) score = 1;
    else if (domain.startsWith(q)) score = 2;
    else if (site.name.toLowerCase().split(/[\s.\-()]+/).some((w) => w.startsWith(q))) score = 3;
    else if (qs.length >= 3 && (name.includes(qs) || squash(domain).includes(qs))) score = 4;
    if (score >= 0) scored.push({ site, score, rank });
  });
  scored.sort((a, b) => a.score - b.score || a.rank - b.rank);
  return scored.slice(0, limit).map((s) => s.site);
}

/** A single word someone might mean as word.com ("netflix", "my-shop"). */
function bareWord(q: string): string | null {
  return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(q) ? q : null;
}

/**
 * The domain to check for what was typed, or null if it can't be turned
 * into one. Order: a real address; an exact known-site name; word.com.
 */
export function resolveSiteInput(raw: string): string | null {
  const q = cleanQuery(raw);
  if (isLikelyValidDomain(q)) return q;
  const qs = squash(raw);
  if (qs) {
    const exact = KNOWN.find((s) => squash(s.name) === qs);
    if (exact) return exact.domain;
  }
  const word = bareWord(q);
  return word ? word + ".com" : null;
}

/** For the dropdown: "Check netflix.com" when a bare word isn't already a known site. */
export function guessedDomain(raw: string): string | null {
  const q = cleanQuery(raw);
  if (isLikelyValidDomain(q)) return null;
  const word = bareWord(q);
  return word && word.length >= 2 ? word + ".com" : null;
}

export const SITE_INPUT_MESSAGE = "Type a website name like netflix, or an address like example.com.";
