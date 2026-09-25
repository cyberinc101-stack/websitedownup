/**
 * Turns raw site facts (WorthSignals) and the optional speed test into the
 * full Website Worth report: traffic, pageviews and ad revenue per day /
 * week / month / year, the value range and multiple, and the Health Score.
 *
 * Valuation method (explained publicly on the /worth page):
 *   monthly ad revenue = monthly pageviews / 1,000 x niche RPM
 *   monthly profit     = revenue x typical content-site margin
 *   value              = monthly profit x multiple (18-48 months, adjusted
 *                        for domain age, health, trend and confidence)
 *
 * CLIENT-SAFE, pure functions: runs in the browser so the report updates
 * the moment the speed test finishes. Contains no secrets.
 */

import { detectNiche, adjustedRpm } from "./niche";
import { estimateTraffic, rankTrend } from "./traffic";
import { DAYS_PER_MONTH, roundSig, yearsSince } from "./format";
import {
  overallScore,
  pickOpportunity,
  scoreContent,
  scoreGrowth,
  scoreMonetization,
  scorePerformance,
  scoreSecurity,
  scoreSeo,
  scoreSocial,
  scoreTechnical,
  scoreTraffic,
} from "./health";
import type { PeriodFigures, Range, SpeedResult, WorthReport, WorthSignals } from "../types";

const PROFIT_MARGIN = 0.75;
const BASE_MULTIPLE = 32;
/**
 * How far the value range reaches either side of the midpoint. Applied once
 * to the final value: stacking every low (or high) assumption together
 * would give a range too wide to be useful.
 */
const VALUE_BAND = {
  medium: { low: 0.55, high: 1.8 },
  low: { low: 0.3, high: 3 },
};
const MIN_MULTIPLE = 18;
const MAX_MULTIPLE = 48;
const MAJOR_BRAND_RANK = 2000;

function periods(monthly: number): PeriodFigures {
  return {
    daily: monthly / DAYS_PER_MONTH,
    weekly: (monthly * 7) / DAYS_PER_MONTH,
    monthly,
    yearly: monthly * 12,
  };
}

function multipleFor(ageYears: number | null, health: number, trend: string, lowConfidence: boolean): number {
  let m = BASE_MULTIPLE;
  if (ageYears !== null) {
    if (ageYears < 1) m -= 10;
    else if (ageYears < 2) m -= 6;
    else if (ageYears < 3) m -= 3;
    else if (ageYears >= 10) m += 6;
    else if (ageYears >= 5) m += 3;
  }
  m += Math.max(-8, Math.min(8, (health - 60) / 4));
  if (trend === "rising") m += 3;
  else if (trend === "falling") m -= 4;
  else if (trend === "new") m += 1;
  if (lowConfidence) m -= 3;
  return Math.round(Math.max(MIN_MULTIPLE, Math.min(MAX_MULTIPLE, m)));
}

export function buildReport(signals: WorthSignals, speed: SpeedResult | null): WorthReport {
  const niche = detectNiche(signals.page ? signals.page.topicText : null);
  const rpm = adjustedRpm(niche, signals.domain);
  const domainAgeYears = yearsSince(signals.registration.registeredAt ?? signals.firstSeen);

  const seo = scoreSeo(signals, speed);
  const performance = scorePerformance(signals, speed);
  const content = scoreContent(signals);
  const technical = scoreTechnical(signals, speed);
  const security = scoreSecurity(signals);
  const social = scoreSocial(signals);

  const traffic = estimateTraffic(signals, seo.score, domainAgeYears);
  const trend = rankTrend(signals.rank);
  const trafficCat = scoreTraffic(signals, traffic.monthlyVisits.mid);
  const growth = scoreGrowth(trend);
  const monetization = scoreMonetization(signals.tech, rpm, trafficCat.score);

  const categories = [seo, trafficCat, monetization, performance, content, social, technical, security, growth];
  const overall = overallScore(categories);

  const v = traffic.monthlyVisits;
  const monthlyPageviews = v.mid * niche.pagesPerVisit;
  const monthlyRevenue = (monthlyPageviews / 1000) * ((rpm[0] + rpm[1]) / 2);

  const lowConfidence = traffic.confidence === "low";
  const multiple = multipleFor(domainAgeYears, overall, trend.direction, lowConfidence);
  const midValue = monthlyRevenue * PROFIT_MARGIN * multiple;
  const band = VALUE_BAND[traffic.confidence];
  const value: Range = {
    low: roundSig(midValue * band.low, 2),
    mid: roundSig(midValue, 3),
    high: roundSig(midValue * band.high, 2),
  };

  const monetizationDetected = signals.tech
    .filter((t) => t.category === "Advertising" || t.category === "Affiliate" || t.category === "Payments" || t.category === "Store")
    .map((t) => t.name);

  return {
    domain: signals.domain,
    checkedAt: signals.checkedAt,
    confidence: traffic.confidence,
    majorBrand: signals.rank.current !== null && signals.rank.current <= MAJOR_BRAND_RANK,
    niche: { id: niche.id, label: niche.label, rpm },
    value,
    multipleMonths: multiple,
    visitors: periods(v.mid),
    pageviews: periods(monthlyPageviews),
    adRevenue: periods(monthlyRevenue),
    visitorRange: v,
    trend: { direction: trend.direction, label: trend.label },
    health: { overall, categories, opportunity: signals.page ? pickOpportunity(categories) : null },
    pageRead: signals.page !== null,
    mobileFriendly: signals.page ? signals.page.hasViewport : null,
    domainAgeYears,
    monetizationDetected,
    speedIncluded: speed !== null && speed.ok,
  };
}
