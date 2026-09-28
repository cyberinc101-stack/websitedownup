/**
 * Shared types for the App Worth tool (App Store apps).
 *
 * Flow: the server collects the app's public facts (AppSignals, from
 * /api/app-worth): its listing, ratings in several countries, US chart
 * positions and the developer's other apps. The pure engine in
 * lib/apps/engine/ turns them into an AppReport in the browser.
 *
 * CLIENT-SAFE: no logic, no Node-only imports. Contains no secrets.
 */

import type { PeriodFigures } from "@/lib/worth/types";

/**
 * The app's public listing. UNTRUSTED DATA: every text field comes from
 * the store listing; render as plain text only.
 */
export interface AppListing {
  id: string;
  name: string;
  developer: string | null;
  developerId: string | null;
  /** Developer's own website (https only), if listed. */
  developerUrl: string | null;
  /** https only, from Apple's image host. */
  iconUrl: string | null;
  category: string | null;
  genres: string[];
  rating: number | null;
  ratingCount: number | null;
  currentVersionRating: number | null;
  currentVersionRatingCount: number | null;
  price: number;
  releasedAt: string | null;
  updatedAt: string | null;
  version: string | null;
  fileSizeBytes: number | null;
  minOsVersion: string | null;
  languageCount: number;
  contentRating: string | null;
  supportsIpad: boolean;
  screenshotCount: number;
  releaseNotes: string | null;
  descriptionLength: number;
  gameCenter: boolean;
  storeUrl: string;
}

export interface CountryRating {
  code: string;
  label: string;
  ratingCount: number;
  rating: number | null;
}

/** US chart positions (1-100), null when not in that chart's top 100. */
export interface ChartRanks {
  topFree: number | null;
  topPaid: number | null;
  topGrossing: number | null;
  /** Which charts could actually be read (a chart that failed to load isn't "not ranked"). */
  checked: { topFree: boolean; topPaid: boolean; topGrossing: boolean };
}

export interface DeveloperApp {
  id: string;
  name: string;
  rating: number | null;
  ratingCount: number | null;
  price: number;
  iconUrl: string | null;
}

export interface AppSignals {
  checkedAt: string;
  listing: AppListing;
  countries: CountryRating[];
  charts: ChartRanks;
  developerApps: DeveloperApp[];
}

export interface Range {
  low: number;
  mid: number;
  high: number;
}

export type AppHealthId = "rating" | "popularity" | "freshness" | "reach" | "listing" | "monetization";

export interface AppCheck {
  label: string;
  pass: boolean;
  fix: string;
}

export interface AppHealthCategory {
  id: AppHealthId;
  label: string;
  score: number;
  weight: number;
  checks: AppCheck[];
}

export interface AppOpportunity {
  label: string;
  summary: string;
  steps: string[];
}

export type AppTrend = "rising" | "steady" | "falling" | "unknown";

export interface AppReport {
  signals: AppSignals;
  categoryLabel: string;
  /** "medium" when a US chart position anchored the estimate. */
  confidence: "medium" | "low";
  majorBrand: boolean;
  value: Range;
  multipleMonths: number;
  worldRatings: number;
  lifetimeDownloads: Range;
  newDownloads: PeriodFigures;
  newRatings: PeriodFigures;
  /** What customers pay, before Apple's commission. */
  consumerSpend: PeriodFigures;
  appleCommission: PeriodFigures;
  /** 0.15 or 0.3. */
  commissionRate: number;
  lifetimeRevenue: number;
  /** Share of revenue from the upfront price (paid apps), 0-1. */
  upfrontShare: number;
  valuePerUser: number;
  profitMargin: number;
  monthlyActiveUsers: number;
  dailyActiveUsers: number;
  revenue: PeriodFigures;
  profit: PeriodFigures;
  revenuePerDownload: number;
  revenuePerUser: number;
  health: { overall: number; categories: AppHealthCategory[]; opportunity: AppOpportunity | null };
  trend: { direction: AppTrend; label: string };
  ageYears: number | null;
  daysSinceUpdate: number | null;
  /** How the estimate was anchored, in plain words. */
  basis: string;
}

/** What /api/app-worth returns. */
export type AppLookupResponse = { ok: true; signals: AppSignals } | { ok: false; error: string };
