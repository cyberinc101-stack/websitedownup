/**
 * The shared visual design for every generated share-card (Open Graph /
 * Twitter) image: brand mark, an eyebrow pill naming what kind of check
 * this is (or a live status, colored via `accent`), the big headline (a
 * domain, an app name, or the site's own tagline), a subtitle, and an
 * accent-colored bottom bar.
 *
 * Worth and app cards deliberately never bake in a live figure (value,
 * downloads): social platforms cache this image for hours to days, so a
 * number baked in would go stale and misleading almost immediately — that
 * belongs on the page itself. The one exception is live up/down status on
 * the /site/[domain] card: "is it down right now" is itself the shareable
 * moment, so app/site/[domain]/opengraph-image.tsx intentionally reads the
 * status at share time and tints the card accordingly, the same tradeoff
 * the site's existing status badges already make.
 *
 * Used from next/og "opengraph-image"/"twitter-image" convention files via
 * `new ImageResponse(ogCardElement({...}), OG_SIZE)`. Plain JSX-returning
 * function, not a React component — next/og (Satori) only understands a
 * React element tree with inline styles, no Tailwind classes, no hooks.
 * CLIENT-SAFE. Contains no secrets.
 */

import { OG_COLORS } from "./theme";
import { SITE_NAME, SITE_URL } from "@/lib/config/site";

export type OgAccent = "signal" | "up" | "down" | "slow";

const ACCENT_COLORS: Record<OgAccent, string> = {
  signal: OG_COLORS.signal,
  up: OG_COLORS.up,
  down: OG_COLORS.down,
  slow: OG_COLORS.slow,
};

const ACCENT_PILL: Record<OgAccent, { bg: string; text: string }> = {
  signal: { bg: OG_COLORS.signalLight, text: OG_COLORS.signalDark },
  up: { bg: OG_COLORS.upBg, text: OG_COLORS.up },
  down: { bg: OG_COLORS.downBg, text: OG_COLORS.down },
  slow: { bg: OG_COLORS.slowBg, text: OG_COLORS.slow },
};

function BrandMark() {
  return (
    <div style={{ display: "flex", position: "relative", width: 56, height: 56 }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          background: OG_COLORS.signal,
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: -3,
          right: -3,
          width: 20,
          height: 20,
          borderRadius: 10,
          background: OG_COLORS.up,
          border: "4px solid " + OG_COLORS.surface,
          display: "flex",
        }}
      />
    </div>
  );
}

export function ogCardElement(props: {
  eyebrow?: string;
  title: string;
  subtitle: string;
  accent?: OgAccent;
}) {
  const accent = props.accent ?? "signal";
  const accentColor = ACCENT_COLORS[accent];
  const pill = ACCENT_PILL[accent];
  const host = SITE_URL.replace(/^https?:\/\//, "");

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(135deg, " + OG_COLORS.bg + " 0%, " + OG_COLORS.surface + " 100%)",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "72px 80px 0 80px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <BrandMark />
          <span style={{ fontSize: 28, fontWeight: 700, color: OG_COLORS.ink, letterSpacing: -0.5 }}>
            {SITE_NAME}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", gap: 20 }}>
          {props.eyebrow && (
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                background: pill.bg,
                color: pill.text,
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: 2,
                padding: "8px 20px",
                borderRadius: 999,
              }}
            >
              {props.eyebrow.toUpperCase()}
            </div>
          )}
          <span
            style={{
              fontSize: props.title.length > 22 ? 72 : 92,
              fontWeight: 800,
              color: OG_COLORS.ink,
              letterSpacing: -2,
              lineHeight: 1.05,
              maxWidth: 1000,
            }}
          >
            {props.title}
          </span>
          <span style={{ fontSize: 34, color: OG_COLORS.muted, maxWidth: 880 }}>{props.subtitle}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 40 }}>
          <span style={{ fontSize: 24, color: OG_COLORS.muted }}>{host}</span>
        </div>
      </div>
      <div style={{ display: "flex", width: "100%", height: 14, background: accentColor }} />
    </div>
  );
}
