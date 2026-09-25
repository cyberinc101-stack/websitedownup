/**
 * Popularity rank lookup for the Website Worth tool.
 *
 * Reads two bundled snapshots of a public top-sites ranking (today and about
 * 90 days ago) from data/worth/. Refresh them with:
 *   npm run worth:ranks
 * Each file is {"date": "YYYY-MM-DD", "domains": "google.com\nyoutube.com\n..."}
 * with domains in rank order. Storing one newline-joined string keeps the
 * type checker fast on a 100,000-line file.
 *
 * Until the script has been run the files are empty and every site is
 * simply reported as unranked.
 *
 * SERVER-ONLY (keeps ~3 MB of data out of the browser bundle).
 * UI RULE: never show the ranking provider's name in user-facing text.
 * Contains no secrets.
 */

import "server-only";
import currentFile from "@/data/worth/rank-current.json";
import previousFile from "@/data/worth/rank-previous.json";
import type { RankFacts } from "../types";

interface RankFile {
  date: string | null;
  domains: string;
}

interface RankIndex {
  date: string | null;
  list: string[];
  byDomain: Map<string, number>;
}

let currentIndex: RankIndex | null = null;
let previousIndex: RankIndex | null = null;

function buildIndex(file: RankFile): RankIndex {
  const list = file.domains ? file.domains.split("\n").filter(Boolean) : [];
  const byDomain = new Map<string, number>();
  for (let i = 0; i < list.length; i++) {
    if (!byDomain.has(list[i])) byDomain.set(list[i], i + 1);
  }
  return { date: file.date, list, byDomain };
}

function getCurrent(): RankIndex {
  if (!currentIndex) currentIndex = buildIndex(currentFile as RankFile);
  return currentIndex;
}

function getPrevious(): RankIndex {
  if (!previousIndex) previousIndex = buildIndex(previousFile as RankFile);
  return previousIndex;
}

/** Two-letter extensions are country codes (nz, uk, de...). */
function countryTldOf(domain: string): string | null {
  const tld = domain.split(".").pop() || "";
  return /^[a-z]{2}$/.test(tld) ? tld : null;
}

export function lookupRank(domain: string): RankFacts {
  const name = domain.toLowerCase().replace(/^www\./, "");
  const current = getCurrent();
  const previous = getPrevious();

  const rank = current.byDomain.get(name) ?? null;
  const prevRank = previous.byDomain.get(name) ?? null;
  const tld = countryTldOf(name);

  let countryRank: number | null = null;
  if (rank !== null && tld !== null) {
    const suffix = "." + tld;
    let count = 0;
    for (let i = 0; i < rank; i++) {
      if (current.list[i].endsWith(suffix)) count++;
    }
    countryRank = count;
  }

  return {
    current: rank,
    previous: prevRank,
    countryRank,
    countryTld: tld,
    listSize: current.list.length,
    currentDate: current.date,
    previousDate: previous.date,
  };
}
