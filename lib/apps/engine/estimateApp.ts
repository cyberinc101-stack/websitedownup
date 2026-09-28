/**
 * Turns an app's public facts (AppSignals) into the App Worth report.
 *
 * Method (explained publicly on /app-worth):
 *   worldwide ratings  = ratings summed over the tracked countries, scaled
 *                        up by their share of all App Store ratings
 *   lifetime downloads = worldwide ratings x DOWNLOADS_PER_RATING
 *                        (Apple publishes no download numbers)
 *   new downloads      = lifetime / age, slowed for unmaintained apps; if
 *                        the app is in the US Top Free or Top Paid chart,
 *                        its chart position sets a floor instead
 *   active users       = downloads x category active share x freshness
 *   revenue            = active users x category revenue per user
 *                        (+ upfront sales for paid apps); if the app is in
 *                        the US Top Grossing chart, its position sets a floor
 *   value              = monthly profit x multiple (same multiple logic as
 *                        the website tool, lib/worth/engine/multiple.ts)
 * A chart position anchors the estimate (medium confidence); otherwise
 * it rests on ratings alone (low confidence). Every figure is an estimate.
 *
 * CLIENT-SAFE, pure. Contains no secrets.
 */

import { profileForCategory, TRACKED_RATING_SHARE } from "@/data/apps/appCategories";
import { estimateMultiple } from "@/lib/worth/engine/multiple";
import { roundSig, yearsSince, DAYS_PER_MONTH } from "@/lib/worth/engine/format";
import { periods } from "@/components/tools/periods";
import type { AppHealthCategory, AppHealthId, AppOpportunity, AppReport, AppSignals, AppTrend, Range } from "../types";

const DOWNLOADS_PER_RATING = { low: 40, mid: 100, high: 250 };
/** Share of revenue left after running costs (store fees already excluded). */
const PROFIT_MARGIN = 0.7;
/** Developer's share of upfront sales after the store cut. */
const STORE_KEEP = 0.7;
/** Worldwide App Store downloads/revenue relative to the US alone. */
const WORLD_VS_US_DOWNLOADS = 2.5;
const WORLD_VS_US_REVENUE = 2;
/** US daily downloads at Top Free #1 / Top Paid #1, falling off with rank. */
const TOP_FREE_1_DAILY = 250000;
const TOP_PAID_1_DAILY = 8000;
/** US daily revenue at Top Grossing #1, falling off with rank. */
const TOP_GROSSING_1_DAILY = 3500000;
const MAJOR_BRAND_RATINGS = 2000000;
/** Yearly proceeds under which Apple's commission is 15% instead of 30%. */
const SMALL_BUSINESS_LIMIT = 1000000;
/** Lifetime revenue ramps up over an app's life, so it's less than age x today's revenue. */
const LIFETIME_RAMP = 0.6;
const DAY_MS = 86400000;

const WEIGHTS: Record<AppHealthId, number> = {
  rating: 20,
  popularity: 20,
  freshness: 15,
  reach: 15,
  listing: 15,
  monetization: 15,
};

const OPPORTUNITY_COPY: Partial<Record<AppHealthId, { label: string; summary: string }>> = {
  rating: {
    label: "Lift the rating",
    summary: "Ratings drive both App Store ranking and whether people tap Get. A better rating is usually the cheapest growth available.",
  },
  freshness: {
    label: "Ship updates more often",
    summary: "Apps that aren't updated slip in search, break on new iOS versions and look abandoned to buyers.",
  },
  reach: {
    label: "Reach more countries and devices",
    summary: "Every extra language and device type opens a new audience without building a new app.",
  },
  listing: {
    label: "Improve the store listing",
    summary: "The listing is the app's shop window. Better screenshots and copy convert more of the people who already find it.",
  },
  monetization: {
    label: "Earn more per user",
    summary: "Buyers value revenue, not downloads. A paid tier or subscription that fits the audience raises the value directly.",
  },
};
const ACTIONABLE: AppHealthId[] = ["rating", "freshness", "reach", "listing", "monetization"];

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return isNaN(t) ? null : Math.max(0, (Date.now() - t) / DAY_MS);
}

function freshnessFactor(days: number | null): number {
  if (days === null) return 0.8;
  if (days <= 180) return 1;
  if (days <= 365) return 0.8;
  if (days <= 730) return 0.5;
  return 0.3;
}

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

function worldRatingsOf(s: AppSignals): number {
  const tracked = s.countries.reduce((sum, c) => sum + c.ratingCount, 0);
  if (tracked > 0) return tracked / TRACKED_RATING_SHARE;
  return (s.listing.ratingCount ?? 0) * 2.5;
}

function health(s: AppSignals, worldRatings: number, updatedDays: number | null, arpuShare: number): AppHealthCategory[] {
  const l = s.listing;
  const rating = l.rating ?? 0;
  const c = s.charts;
  const charted = c.topFree !== null || c.topPaid !== null || c.topGrossing !== null;
  const notesOk = (l.releaseNotes?.length ?? 0) >= 40;
  const cvOk = l.currentVersionRating === null || l.rating === null || l.currentVersionRating >= l.rating - 0.1;
  const sizeMb = l.fileSizeBytes !== null ? l.fileSizeBytes / 1048576 : null;

  const cat = (id: AppHealthId, label: string, score: number, checks: AppHealthCategory["checks"]): AppHealthCategory => ({
    id,
    label,
    score: clamp(score),
    weight: WEIGHTS[id],
    checks,
  });

  return [
    cat("rating", "Rating", rating > 0 ? ((rating - 3) / 1.9) * 100 : 0, [
      { label: "Rated 4.5 stars or higher", pass: rating >= 4.5, fix: "Ask for ratings right after a success moment in the app, using Apple's built-in rating prompt." },
      { label: "Current version rated as well as the app overall", pass: cvOk, fix: "Fix the complaints in recent reviews and reply to them; a strong update lifts the current-version rating." },
    ]),
    cat("popularity", "Popularity", (Math.log10(Math.max(worldRatings, 1)) / 6.5) * 100 + (charted ? 10 : 0), [
      { label: "10,000+ ratings worldwide", pass: worldRatings >= 10000, fix: "Grow installs with App Store search keywords, a clear subtitle and cross-promotion from your other apps." },
      { label: "In a US top chart", pass: charted, fix: "Chart places come from bursts of downloads; time launches and promotions to land in the same few days." },
    ]),
    cat(
      "freshness",
      "Freshness",
      updatedDays === null ? 30 : updatedDays <= 30 ? 100 : updatedDays <= 90 ? 85 : updatedDays <= 180 ? 65 : updatedDays <= 365 ? 40 : 15,
      [
        { label: "Updated in the last 90 days", pass: updatedDays !== null && updatedDays <= 90, fix: "Ship a small update at least every couple of months, even just fixes and support for the latest iOS." },
        { label: "Release notes explain what changed", pass: notesOk, fix: "Write release notes that tell users what's new; they show on the listing and in the Updates tab." },
      ]
    ),
    cat("reach", "Reach", (Math.min(l.languageCount, 10) / 10) * 40 + (Math.min(s.countries.length, 6) / 6) * 40 + (l.supportsIpad ? 20 : 0), [
      { label: "Available in 5+ languages", pass: l.languageCount >= 5, fix: "Localize the store listing first (title, subtitle, screenshots), then the app itself, for your biggest markets." },
      { label: "Rated in 4+ major countries", pass: s.countries.length >= 4, fix: "Make sure the app is available in every storefront, and localize for the countries where it's missing." },
      { label: "Runs natively on iPad", pass: l.supportsIpad, fix: "Support iPad layouts; it's a separate audience in App Store search and a quick win for most apps." },
    ]),
    cat(
      "listing",
      "Store listing",
      (Math.min(l.screenshotCount, 8) / 8) * 40 + (Math.min(l.descriptionLength, 1500) / 1500) * 30 + (l.developerUrl ? 15 : 0) + (sizeMb !== null && sizeMb <= 200 ? 15 : 0),
      [
        { label: "5 or more screenshots", pass: l.screenshotCount >= 5, fix: "Use all screenshot slots; the first two carry most of the weight, so lead with the main benefit." },
        { label: "Detailed description (800+ characters)", pass: l.descriptionLength >= 800, fix: "Expand the description with features, use cases and the words people search for." },
        { label: "Links to a developer website", pass: Boolean(l.developerUrl), fix: "Add a support or marketing website in App Store Connect; it builds trust and helps search." },
        { label: "Download under 200 MB", pass: sizeMb !== null && sizeMb <= 200, fix: "Trim assets or load them on demand; big downloads put people off on mobile data." },
      ]
    ),
    cat("monetization", "Monetization", c.topGrossing !== null ? 100 : Math.min(90, arpuShare * 60 + (l.price > 0 ? 30 : 0)), [
      { label: "In the US Top Grossing chart", pass: c.topGrossing !== null, fix: "Grossing charts reward recurring revenue; a subscription tier is the usual route in." },
      { label: "Charges for the app or earns enough to chart", pass: l.price > 0 || c.topGrossing !== null, fix: "Add a paid tier, subscription or in-app purchase that fits what your most engaged users already do." },
    ]),
  ];
}

function pickOpportunity(categories: AppHealthCategory[]): AppOpportunity | null {
  const pool = categories.filter((c) => ACTIONABLE.includes(c.id) && c.score < 80);
  if (pool.length === 0) return null;
  const best = pool.reduce((a, b) => ((100 - b.score) * b.weight > (100 - a.score) * a.weight ? b : a));
  const copy = OPPORTUNITY_COPY[best.id];
  if (!copy) return null;
  return { label: copy.label, summary: copy.summary, steps: best.checks.filter((c) => !c.pass).slice(0, 3).map((c) => c.fix) };
}

function trendOf(s: AppSignals, updatedDays: number | null): { direction: AppTrend; label: string } {
  const charted = s.charts.topFree !== null || s.charts.topPaid !== null || s.charts.topGrossing !== null;
  if (updatedDays !== null && updatedDays > 365) return { direction: "falling", label: "Not updated in over a year" };
  if (charted && updatedDays !== null && updatedDays <= 90) return { direction: "rising", label: "Charting in the US and actively updated" };
  if (updatedDays !== null && updatedDays <= 180) return { direction: "steady", label: "Actively maintained" };
  return { direction: "unknown", label: "Not enough history to tell" };
}

export function estimateApp(s: AppSignals): AppReport {
  const l = s.listing;
  const profile = profileForCategory(l.category);
  const updatedDays = daysSince(l.updatedAt);
  const ageYears = yearsSince(l.releasedAt);
  const fresh = freshnessFactor(updatedDays);

  const worldRatings = worldRatingsOf(s);
  const lifetime: Range =
    worldRatings > 0
      ? { low: worldRatings * DOWNLOADS_PER_RATING.low, mid: worldRatings * DOWNLOADS_PER_RATING.mid, high: worldRatings * DOWNLOADS_PER_RATING.high }
      : { low: 50, mid: 300, high: 1500 };

  const ageMonths = Math.max(3, (ageYears ?? 1) * 12);
  let monthlyNew = (lifetime.mid / ageMonths) * fresh;
  const bases: string[] = [];
  if (s.charts.topFree !== null) {
    const chartMonthly = TOP_FREE_1_DAILY * Math.pow(s.charts.topFree, -0.85) * WORLD_VS_US_DOWNLOADS * DAYS_PER_MONTH;
    monthlyNew = Math.max(monthlyNew, chartMonthly);
    bases.push("its US Top Free position (#" + s.charts.topFree + ")");
  }
  if (s.charts.topPaid !== null) {
    const chartMonthly = TOP_PAID_1_DAILY * Math.pow(s.charts.topPaid, -0.8) * WORLD_VS_US_DOWNLOADS * DAYS_PER_MONTH;
    monthlyNew = Math.max(monthlyNew, chartMonthly);
    bases.push("its US Top Paid position (#" + s.charts.topPaid + ")");
  }

  const mau = Math.max(Math.min(lifetime.mid, lifetime.mid * profile.activeShare * fresh), Math.min(monthlyNew * 0.6, lifetime.mid));
  const dau = mau * profile.stickiness;

  const inAppFactor = l.price > 0 ? 0.3 : 0.7;
  const upfront = l.price > 0 ? l.price * monthlyNew * STORE_KEEP : 0;
  let monthlyRevenue = mau * profile.arpu * inAppFactor + upfront;
  if (s.charts.topGrossing !== null) {
    const chartRevenue = TOP_GROSSING_1_DAILY * Math.pow(s.charts.topGrossing, -0.95) * WORLD_VS_US_REVENUE * DAYS_PER_MONTH;
    monthlyRevenue = Math.max(monthlyRevenue, chartRevenue);
    bases.push("its US Top Grossing position (#" + s.charts.topGrossing + ")");
  }
  const monthlyProfit = monthlyRevenue * PROFIT_MARGIN;
  // Apple keeps 15% for developers under $1M a year (Small Business Program), 30% above.
  const commissionRate = monthlyRevenue * 12 < SMALL_BUSINESS_LIMIT ? 0.15 : 0.3;
  const monthlySpend = monthlyRevenue / (1 - commissionRate);
  const lifetimeMonths = Math.max(1, (ageYears ?? 0.25) * 12);

  const categories = health(s, worldRatings, updatedDays, profile.arpu / 0.35);
  const weightSum = categories.reduce((sum, c) => sum + c.weight, 0);
  const overall = Math.round(categories.reduce((sum, c) => sum + c.score * c.weight, 0) / weightSum);

  const chartBased = bases.length > 0;
  const trend = trendOf(s, updatedDays);
  const multiple = estimateMultiple(ageYears, overall, trend.direction, !chartBased);
  const mid = monthlyProfit * multiple;
  const band = chartBased ? { low: 0.5, high: 2 } : { low: 0.3, high: 3 };

  const basis = chartBased
    ? "Anchored on " + bases.join(" and ") + ", plus ratings in " + s.countries.length + " countries."
    : "Estimated from " + (s.countries.length > 0 ? "ratings in " + s.countries.length + " countries" : "its ratings") + ", category and update history.";

  return {
    signals: s,
    categoryLabel: profile.label,
    confidence: chartBased ? "medium" : "low",
    majorBrand: worldRatings >= MAJOR_BRAND_RATINGS || (s.charts.topGrossing !== null && s.charts.topGrossing <= 25),
    value: { low: roundSig(mid * band.low, 2), mid: roundSig(mid, 3), high: roundSig(mid * band.high, 2) },
    multipleMonths: multiple,
    worldRatings,
    lifetimeDownloads: lifetime,
    newDownloads: periods(monthlyNew),
    newRatings: periods(monthlyNew / DOWNLOADS_PER_RATING.mid),
    consumerSpend: periods(monthlySpend),
    appleCommission: periods(monthlySpend - monthlyRevenue),
    commissionRate,
    lifetimeRevenue: monthlyRevenue * lifetimeMonths * LIFETIME_RAMP,
    upfrontShare: monthlyRevenue > 0 ? Math.min(1, upfront / monthlyRevenue) : 0,
    valuePerUser: mau > 0 ? mid / mau : 0,
    profitMargin: PROFIT_MARGIN,
    monthlyActiveUsers: mau,
    dailyActiveUsers: dau,
    revenue: periods(monthlyRevenue),
    profit: periods(monthlyProfit),
    revenuePerDownload: lifetime.mid > 0 ? (monthlyRevenue * lifetimeMonths * LIFETIME_RAMP) / lifetime.mid : 0,
    revenuePerUser: mau > 0 ? monthlyRevenue / mau : 0,
    health: { overall, categories, opportunity: pickOpportunity(categories) },
    trend,
    ageYears,
    daysSinceUpdate: updatedDays,
    basis,
  };
}
