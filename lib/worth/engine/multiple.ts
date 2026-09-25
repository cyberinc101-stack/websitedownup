/**
 * The valuation multiple (in months of profit) used to turn a site's
 * estimated or stated monthly profit into a value. Shared by the domain
 * analyzer (buildReport.ts, which has a measured health score) and the
 * manual valuation calculator (seo tool, which doesn't) so both agree on
 * the same figure for the same inputs.
 *
 * CLIENT-SAFE, pure function. Contains no secrets.
 */

export const BASE_MULTIPLE = 32;
export const MIN_MULTIPLE = 18;
export const MAX_MULTIPLE = 48;
/** Used when no health score is available (the manual calculator). */
export const NEUTRAL_HEALTH = 60;

export type TrendWord = "rising" | "steady" | "falling" | "new" | "unknown";

export function estimateMultiple(
  ageYears: number | null,
  health: number,
  trend: TrendWord | string,
  lowConfidence: boolean
): number {
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
