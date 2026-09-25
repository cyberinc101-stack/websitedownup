/**
 * Traffic estimates for the Website Worth report.
 *
 * Ranked sites: the popularity rank is mapped to monthly visits along a
 * curve fitted to publicly reported traffic for sites at known ranks
 * (log-log interpolation between the anchor points below). Tune the curve
 * by editing RANK_CURVE.
 *
 * Unranked sites (outside the ranked list): there's no public traffic
 * signal, so the estimate is a modest baseline scaled by domain age,
 * content depth and on-page SEO, capped below the list's cut-off, and
 * always flagged as low confidence.
 *
 * CLIENT-SAFE, pure functions. Contains no secrets.
 */

import type { Confidence, Range, RankFacts, TrendDirection, WorthSignals } from "../types";

/** [rank, monthly visits] */
const RANK_CURVE: Array<[number, number]> = [
  [1, 8e10],
  [10, 3e9],
  [100, 4e8],
  [1000, 4.5e7],
  [10000, 5e6],
  [100000, 4e5],
  [1000000, 2.5e4],
];

const UNRANKED_BASE_VISITS = 2500;
const DEFAULT_LIST_SIZE = 100000;

export function visitsForRank(rank: number): number {
  if (rank <= RANK_CURVE[0][0]) return RANK_CURVE[0][1];
  for (let i = 1; i < RANK_CURVE.length; i++) {
    const [r1, v1] = RANK_CURVE[i - 1];
    const [r2, v2] = RANK_CURVE[i];
    if (rank <= r2) {
      const t = (Math.log10(rank) - Math.log10(r1)) / (Math.log10(r2) - Math.log10(r1));
      return Math.pow(10, Math.log10(v1) + t * (Math.log10(v2) - Math.log10(v1)));
    }
  }
  return RANK_CURVE[RANK_CURVE.length - 1][1];
}

function ageFactor(years: number | null): number {
  if (years === null) return 1;
  if (years < 1) return 0.4;
  if (years < 3) return 0.8;
  if (years < 7) return 1.2;
  if (years < 15) return 1.6;
  return 2;
}

function contentFactor(signals: WorthSignals): number {
  const links = signals.page ? signals.page.internalLinks : 0;
  if (links >= 150) return 1.8;
  if (links >= 60) return 1.3;
  if (links >= 20) return 1;
  return 0.6;
}

export interface TrafficEstimate {
  monthlyVisits: Range;
  confidence: Confidence;
}

export function estimateTraffic(
  signals: WorthSignals,
  seoScore: number,
  domainAgeYears: number | null
): TrafficEstimate {
  const rank = signals.rank.current;

  if (rank !== null) {
    const mid = visitsForRank(rank);
    return { monthlyVisits: { low: mid * 0.6, mid, high: mid * 1.6 }, confidence: "medium" };
  }

  const listSize = signals.rank.listSize > 0 ? signals.rank.listSize : DEFAULT_LIST_SIZE;
  const ceiling = visitsForRank(listSize) * 0.6;

  if (!signals.reachable) {
    return { monthlyVisits: { low: 0, mid: 50, high: 200 }, confidence: "low" };
  }

  const seoFactor = 0.6 + (seoScore / 100) * 0.8;
  const raw = UNRANKED_BASE_VISITS * ageFactor(domainAgeYears) * contentFactor(signals) * seoFactor;
  const mid = Math.min(Math.max(raw, 100), ceiling);
  return {
    monthlyVisits: { low: mid * 0.3, mid, high: Math.min(mid * 2.5, ceiling * 1.5) },
    confidence: "low",
  };
}

export interface TrendResult {
  direction: TrendDirection;
  label: string;
  /** previous rank / current rank; above 1 means the site moved up. */
  ratio: number | null;
}

export function rankTrend(rank: RankFacts): TrendResult {
  const { current, previous, previousDate } = rank;
  if (current !== null && previous !== null) {
    const ratio = previous / current;
    const fromTo = "#" + previous.toLocaleString("en-US") + " to #" + current.toLocaleString("en-US");
    if (ratio > 1.15) return { direction: "rising", label: "Up from " + fromTo + " in 90 days", ratio };
    if (ratio < 0.87) return { direction: "falling", label: "Down from " + fromTo + " in 90 days", ratio };
    return { direction: "steady", label: "Steady over 90 days (" + fromTo + ")", ratio };
  }
  if (current !== null && previousDate !== null) {
    return { direction: "new", label: "Newly ranked in the last 90 days", ratio: null };
  }
  return { direction: "unknown", label: "Not enough ranking history yet", ratio: null };
}
