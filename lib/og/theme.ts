/**
 * Shared colors and sizing for generated share-card (Open Graph / Twitter)
 * images, kept in sync with tailwind.config.js's palette. next/og renders
 * these with Satori, which only understands inline styles (no Tailwind
 * classes, no external stylesheet), so the actual hex values live here
 * once and every card image imports them.
 * CLIENT-SAFE. Contains no secrets.
 */

export const OG_COLORS = {
  ink: "#0B1220",
  muted: "#5B6472",
  surface: "#FFFFFF",
  bg: "#F5F8FB",
  line: "#E2E8F1",
  signal: "#2F6FED",
  signalDark: "#1E4FC4",
  signalLight: "#EAF1FF",
  up: "#16A34A",
  upBg: "#E9F8EF",
  down: "#E8542B",
  downBg: "#FDEEE8",
  slow: "#D97706",
  slowBg: "#FEF3E2",
} as const;

/** Standard Open Graph size (also what Twitter's summary_large_image wants). */
export const OG_SIZE = { width: 1200, height: 630 };
