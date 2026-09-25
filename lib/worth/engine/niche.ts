/**
 * Picks the site's niche (which sets its advertising RPM range and typical
 * pages per visit) from the page's topic text, and applies the country
 * adjustment for country-code domains. Data lives in data/worth/niches.ts.
 *
 * CLIENT-SAFE, pure functions. Contains no secrets.
 */

import { GENERAL_NICHE, NICHES, TLD_RPM_MULTIPLIER, type Niche } from "@/data/worth/niches";

const MIN_SCORE = 2;
const MAX_HITS_PER_KEYWORD = 3;

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countHits(text: string, keyword: string): number {
  const re = new RegExp("\\b" + escapeRegExp(keyword) + "\\b", "g");
  const matches = text.match(re);
  return matches ? Math.min(matches.length, MAX_HITS_PER_KEYWORD) : 0;
}

export function detectNiche(topicText: string | null): Niche {
  if (!topicText) return GENERAL_NICHE;
  let best: Niche = GENERAL_NICHE;
  let bestScore = 0;
  for (const niche of NICHES) {
    let score = 0;
    for (const keyword of niche.keywords) score += countHits(topicText, keyword);
    if (score > bestScore) {
      best = niche;
      bestScore = score;
    }
  }
  return bestScore >= MIN_SCORE ? best : GENERAL_NICHE;
}

/** RPM range after the country-code adjustment. */
export function adjustedRpm(niche: Niche, domain: string): [number, number] {
  const tld = domain.split(".").pop() || "";
  const multiplier = TLD_RPM_MULTIPLIER[tld] ?? 1;
  return [niche.rpm[0] * multiplier, niche.rpm[1] * multiplier];
}
