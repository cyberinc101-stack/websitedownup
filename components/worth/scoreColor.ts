/**
 * Colours for 0-100 scores in the Website Worth report. Fixed hex values
 * (applied as inline styles) so they read the same on every theme.
 * CLIENT-SAFE. Contains no secrets.
 */

export function scoreColor(score: number): string {
  if (score >= 75) return "#15803d";
  if (score >= 50) return "#b45309";
  return "#b91c1c";
}

export function scoreWord(score: number): string {
  if (score >= 75) return "Strong";
  if (score >= 50) return "Fair";
  return "Weak";
}
