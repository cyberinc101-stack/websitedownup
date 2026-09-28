/**
 * SERVER-ONLY entry point for App Store name search (/api/app-search).
 * Each normalized search term is cached for 24 hours and shared by every
 * visitor, so popular searches ("facebook", "tiktok") hit Apple once a
 * day. Failures are never cached.
 * Free: no key, no cost. Contains no secrets.
 */

import "server-only";
import { unstable_cache } from "next/cache";
import { searchApps } from "@/lib/apps/sources/appleSearch";
import type { AppSearchResult } from "@/lib/apps/types";

const SEARCH_CACHE_SECONDS = 86400;
const CACHE_VERSION = "v1";
const RESULTS = 8;
export const MIN_TERM = 2;
export const MAX_TERM = 60;

/** Lowercase, single-spaced, trimmed; null if too short or too long. */
export function normalizeTerm(raw: string): string | null {
  const term = raw.replace(/\s+/g, " ").trim().toLowerCase();
  if (term.length < MIN_TERM || term.length > MAX_TERM) return null;
  return term;
}

export async function findApps(term: string): Promise<AppSearchResult[] | null> {
  const load = unstable_cache(
    async () => {
      const results = await searchApps(term, RESULTS);
      if (!results) throw new Error("uncacheable");
      return results;
    },
    ["app-search", CACHE_VERSION, term],
    { revalidate: SEARCH_CACHE_SECONDS }
  );
  try {
    return await load();
  } catch {
    return null;
  }
}
