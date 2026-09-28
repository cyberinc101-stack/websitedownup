/**
 * App Store categories used by the App Worth estimate. Each profile sets:
 *  - activeShare: monthly active users as a share of lifetime downloads
 *  - arpu:        revenue per monthly active user per month, in USD
 *  - stickiness:  daily active users as a share of monthly active users
 * These are rough, conservative industry-typical figures for a monetized
 * app. They are estimates by design; tune them here as you learn more.
 * The engine reads nothing else about categories.
 *
 * Matching: Apple's category name (e.g. "Social Networking") is lowercased
 * and checked against `match` substrings. First match wins;
 * GENERAL_APP_PROFILE is the fallback.
 *
 * CLIENT-SAFE. Contains no secrets.
 */

export interface AppProfile {
  id: string;
  label: string;
  activeShare: number;
  arpu: number;
  stickiness: number;
  match: string[];
}

export const APP_PROFILES: AppProfile[] = [
  { id: "games", label: "Games", activeShare: 0.04, arpu: 0.35, stickiness: 0.2, match: ["game"] },
  { id: "finance", label: "Finance", activeShare: 0.1, arpu: 0.3, stickiness: 0.25, match: ["finance"] },
  { id: "business", label: "Business & productivity", activeShare: 0.08, arpu: 0.35, stickiness: 0.3, match: ["business", "productivity", "developer tools"] },
  { id: "health", label: "Health & fitness", activeShare: 0.05, arpu: 0.3, stickiness: 0.2, match: ["health", "fitness", "medical"] },
  { id: "education", label: "Education", activeShare: 0.05, arpu: 0.25, stickiness: 0.2, match: ["education", "kids"] },
  { id: "media", label: "Entertainment & media", activeShare: 0.07, arpu: 0.2, stickiness: 0.25, match: ["entertainment", "music", "photo", "video", "graphics"] },
  { id: "social", label: "Social & communication", activeShare: 0.12, arpu: 0.1, stickiness: 0.5, match: ["social", "communication"] },
  { id: "lifestyle", label: "Lifestyle", activeShare: 0.04, arpu: 0.1, stickiness: 0.15, match: ["lifestyle"] },
  { id: "info", label: "News & reference", activeShare: 0.05, arpu: 0.08, stickiness: 0.3, match: ["news", "magazine", "book", "reference", "weather", "sports", "navigation"] },
  { id: "commerce", label: "Shopping, food & travel", activeShare: 0.05, arpu: 0.03, stickiness: 0.1, match: ["shopping", "food", "drink", "travel"] },
  { id: "utilities", label: "Utilities", activeShare: 0.06, arpu: 0.06, stickiness: 0.15, match: ["utilit"] },
];

export const GENERAL_APP_PROFILE: AppProfile = {
  id: "general",
  label: "General",
  activeShare: 0.05,
  arpu: 0.1,
  stickiness: 0.2,
  match: [],
};

export function profileForCategory(category: string | null): AppProfile {
  if (!category) return GENERAL_APP_PROFILE;
  const c = category.toLowerCase();
  for (const p of APP_PROFILES) {
    if (p.match.some((m) => c.includes(m))) return p;
  }
  return GENERAL_APP_PROFILE;
}

/**
 * Storefronts checked for per-country ratings. Kept short on purpose:
 * Apple asks lookups to stay around 20 a minute, and each country is one
 * lookup. Together these hold roughly 60% of App Store ratings.
 */
export const RATING_COUNTRIES: Array<{ code: string; label: string }> = [
  { code: "us", label: "United States" },
  { code: "gb", label: "United Kingdom" },
  { code: "ca", label: "Canada" },
  { code: "au", label: "Australia" },
  { code: "de", label: "Germany" },
  { code: "jp", label: "Japan" },
];

/** Tracked countries' share of worldwide ratings (used to scale up to a world figure). */
export const TRACKED_RATING_SHARE = 0.6;
