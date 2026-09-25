/**
 * Shared types for the Website Worth tool.
 *
 * Flow: the server collects raw facts about a site (WorthSignals, from
 * /api/worth) and, separately, a lab speed test (SpeedResult, from
 * /api/worth/speed, which is slower). The pure engine in lib/worth/engine/
 * turns those into a WorthReport. The engine runs in the browser, so the
 * report updates the moment the speed test lands.
 *
 * CLIENT-SAFE: no Node-only imports, no logic. Contains no secrets.
 */

import type { TechCategory } from "@/data/worth/techSignatures";

export interface DetectedTech {
  name: string;
  category: TechCategory;
}

/**
 * Facts read from the site's homepage HTML.
 * UNTRUSTED DATA: title/description/text values came from the site itself.
 * Render as plain text only.
 */
export interface PageFacts {
  title: string | null;
  description: string | null;
  iconUrl: string | null;
  lang: string | null;
  h1Count: number;
  h2Count: number;
  wordCount: number;
  internalLinks: number;
  externalLinks: number;
  images: number;
  imagesWithAlt: number;
  hasCanonical: boolean;
  noindex: boolean;
  hasViewport: boolean;
  hasStructuredData: boolean;
  ogTitle: boolean;
  ogImage: boolean;
  twitterCard: boolean;
  hasFeed: boolean;
  /** Social networks the site links to from its homepage, e.g. "YouTube". */
  socialProfiles: string[];
  /** Lowercase text used for niche detection (title, headings, opening copy). */
  topicText: string;
}

export interface RankFacts {
  /** Global popularity rank, or null when outside the ranked list. */
  current: number | null;
  /** Rank roughly 90 days earlier, or null. */
  previous: number | null;
  /** Rank among sites on the same country-code extension (e.g. .nz), when it has one. */
  countryRank: number | null;
  countryTld: string | null;
  /** How many sites the ranking covers (ranks above this are "unranked"). */
  listSize: number;
  currentDate: string | null;
  previousDate: string | null;
}

export interface WorthSignals {
  domain: string;
  checkedAt: string;
  reachable: boolean;
  /** Why the site couldn't be read, in plain words. Null when reachable. */
  error: string | null;
  finalUrl: string | null;
  finalStatus: number | null;
  redirects: number;
  /** Server wait (time to first byte) and total load of the final page, ms. */
  waitMs: number | null;
  totalMs: number | null;
  htmlBytes: number;
  page: PageFacts | null;
  tech: DetectedTech[];
  security: {
    httpsFinal: boolean;
    sslValid: boolean;
    sslDaysRemaining: number | null;
    hsts: boolean;
    csp: boolean;
    frameProtection: boolean;
    noSniff: boolean;
    spf: boolean;
    dmarc: boolean;
  };
  compression: boolean;
  ipv6: boolean;
  registration: {
    registeredAt: string | null;
    expiresAt: string | null;
    registrar: string | null;
  };
  /** Earliest date the site is known to have been online. */
  firstSeen: string | null;
  rank: RankFacts;
}

export interface SpeedResult {
  ok: boolean;
  /** Category scores 0-100 from the mobile lab test. */
  performance: number | null;
  seo: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  lcpMs: number | null;
  cls: number | null;
  tbtMs: number | null;
  error?: string;
}

export type Confidence = "medium" | "low";

export interface Range {
  low: number;
  mid: number;
  high: number;
}

export interface PeriodFigures {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
}

export type TrendDirection = "rising" | "steady" | "falling" | "new" | "unknown";

export type HealthCategoryId =
  | "seo"
  | "traffic"
  | "monetization"
  | "performance"
  | "content"
  | "social"
  | "technical"
  | "security"
  | "growth";

export interface HealthCheck {
  label: string;
  pass: boolean;
  /** What to do when this check fails, in plain words. */
  fix: string;
}

export interface HealthCategory {
  id: HealthCategoryId;
  label: string;
  score: number;
  weight: number;
  checks: HealthCheck[];
  /** False when the homepage couldn't be read, so this area couldn't be scored. */
  checked: boolean;
  /** True when the score comes from the full speed test rather than the quick check. */
  fromSpeedTest?: boolean;
}

export interface Opportunity {
  category: HealthCategoryId;
  label: string;
  summary: string;
  steps: string[];
}

export interface WorthReport {
  domain: string;
  checkedAt: string;
  confidence: Confidence;
  majorBrand: boolean;
  niche: { id: string; label: string; rpm: [number, number] };
  value: Range;
  /** Valuation multiple in months of estimated profit. */
  multipleMonths: number;
  visitors: PeriodFigures;
  pageviews: PeriodFigures;
  adRevenue: PeriodFigures;
  /** Monthly visitors as a range, for the traffic card. */
  visitorRange: Range;
  trend: { direction: TrendDirection; label: string };
  health: {
    overall: number;
    categories: HealthCategory[];
    opportunity: Opportunity | null;
  };
  /** False when the homepage couldn't be read (blocked, error page, timeout). */
  pageRead: boolean;
  mobileFriendly: boolean | null;
  domainAgeYears: number | null;
  monetizationDetected: string[];
  speedIncluded: boolean;
}
