/**
 * Colour tone for 0-100 scores in the Website Worth report, mapped to the
 * same up/slow/down palette the status checker uses everywhere else
 * (StatusBadge, the popular-sites grid, Having problems), so a "Strong"
 * health score reads as the same green as an "Up" site, not an unrelated
 * shade invented just for this page.
 *
 * Returns Tailwind CLASS NAMES, not hex values: components apply the class
 * (e.g. on an <svg> or wrapping element) and use `currentColor` for
 * strokes, fills and backgrounds, so every score always matches the site's
 * real palette even if those tokens change later.
 * CLIENT-SAFE. Contains no secrets.
 */

export type ScoreTone = "up" | "slow" | "down";

export function scoreTone(score: number): ScoreTone {
  if (score >= 75) return "up";
  if (score >= 50) return "slow";
  return "down";
}

export function scoreWord(score: number): string {
  if (score >= 75) return "Strong";
  if (score >= 50) return "Fair";
  return "Weak";
}

/** Tailwind text-colour class for a tone; pair with currentColor for fills/strokes/backgrounds. */
export const TONE_CLASS: Record<ScoreTone, string> = {
  up: "text-up",
  slow: "text-slow",
  down: "text-down",
};

/** Class for a score that couldn't be checked at all (distinct from a low score). */
export const UNCHECKED_CLASS = "text-muted";
