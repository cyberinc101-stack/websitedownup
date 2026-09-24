/**
 * Shared types for the live check activity (feed + most checked).
 * CLIENT-SAFE: no Node imports, no logic, no secrets.
 */

export type ActivityStatus = "up" | "down";

/**
 * "user": a real visitor ran this check.
 * "monitor": our own automatic monitor checked a popular site (also a
 * real check with a real result, shown with an "auto" tag).
 */
export type ActivitySource = "user" | "monitor";

export interface ActivityItem {
  domain: string;
  status: ActivityStatus;
  responseTimeMs: number | null;
  checkedAt: string;
  source: ActivitySource;
}

export interface ActivityFeed {
  /** Always true now (memory fallback when Redis is not configured). Kept for compatibility. */
  enabled: boolean;
  items: ActivityItem[];
  updatedAt: string;
}

export interface MostCheckedItem {
  domain: string;
  checks: number;
  lastStatus: ActivityStatus | null;
  lastCheckedAt: string | null;
}
