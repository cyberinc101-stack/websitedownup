/**
 * SERVER-ONLY data + response for the Website Worth badges:
 *   /badge/worth/{domain}   "est. site value | $12.4K"
 *   /badge/health/{domain}  "site health | 86/100"
 *
 * Uses exactly the same valuation as the report (getWorthSignals + the
 * cached speed test + buildReport), so the badge matches the report and
 * rises or falls by itself as the site changes. Signals are cached 12h and
 * the badge image is CDN-cached for 12h, so an embed on a busy page costs
 * at most a couple of fresh checks a day.
 *
 * The speed test can be slow when it isn't cached yet. The badge waits a
 * few seconds for it; if it isn't ready, the badge uses the quick check and
 * the speed test finishes in the background (via after()), so the next
 * refresh includes it — exactly like the report.
 *
 * SECURITY: rate limited per visitor; SSRF checks happen inside
 * getWorthSignals / getSpeedResult. Contains no secrets.
 */

import "server-only";
import { after, NextResponse } from "next/server";
import { normalizeDomain } from "@/lib/checkSite";
import { getWorthSignals } from "@/lib/server/worthSignals";
import { getSpeedResult } from "@/lib/server/worthSpeed";
import { buildReport } from "@/lib/worth/engine/buildReport";
import { formatMoney } from "@/lib/worth/engine/format";
import { renderValueBadge } from "@/lib/badge/renderBadge";
import { checkRateLimit, clientKeyFrom } from "@/lib/security/rateLimit";
import { SITE_NAME } from "@/lib/config/site";
import type { SpeedResult } from "@/lib/worth/types";

const SPEED_WAIT_MS = 8000;
const REQUESTS_PER_MINUTE = 30;

// Same palette as the rest of the site (tailwind.config.js).
const COLOR = {
  signal: "#2F6FED",
  up: "#16A34A",
  slow: "#D97706",
  down: "#E8542B",
  grey: "#9e9e9e",
};

export type WorthMetric = "worth" | "health";

export type WorthBadgeData =
  | { ok: true; domain: string; value: number; majorBrand: boolean; health: number }
  | { ok: false; reason: "invalid" | "unreachable" };

export async function getWorthBadgeData(rawDomain: string): Promise<WorthBadgeData> {
  const result = await getWorthSignals(rawDomain);
  if (!result.ok) return { ok: false, reason: result.status === 400 ? "invalid" : "unreachable" };

  const signals = result.signals;
  if (!signals.reachable && signals.rank.current === null) return { ok: false, reason: "unreachable" };

  const speedPromise = getSpeedResult(signals.domain);
  const raced = await Promise.race([
    speedPromise,
    new Promise<"timeout">((resolve) => setTimeout(() => resolve("timeout"), SPEED_WAIT_MS)),
  ]);

  let speed: SpeedResult | null = null;
  if (raced === "timeout") {
    // Let the test finish and fill the cache after the response is sent.
    after(async () => {
      try {
        await speedPromise;
      } catch {
        // best effort
      }
    });
  } else if (raced && raced.ok) {
    speed = raced;
  }

  const report = buildReport(signals, speed);
  return {
    ok: true,
    domain: report.domain,
    value: report.value.mid,
    majorBrand: report.majorBrand,
    health: report.health.overall,
  };
}

/**
 * Badge money: the same figure as the report headline under $100K
 * ($12,400), the short form above it ($184K, $3.2M, $1.1B, $1.3T…), so any
 * size of value fits and matches the report.
 */
function badgeMoney(n: number): string {
  if (n >= 100 && n < 100000) return "$" + Math.round(n).toLocaleString("en-US");
  return formatMoney(n);
}

function healthColor(score: number): string {
  if (score >= 75) return COLOR.up;
  if (score >= 50) return COLOR.slow;
  return COLOR.down;
}

function svgResponse(svg: string, status: number, cache: string): NextResponse {
  return new NextResponse(svg, {
    status: status,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": cache,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

const CACHE_OK = "public, max-age=3600, s-maxage=43200, stale-while-revalidate=86400";
const CACHE_SHORT = "public, max-age=300, s-maxage=300";

/** Shared handler for both badge routes. */
export async function worthBadgeResponse(request: Request, rawParam: string, metric: WorthMetric): Promise<NextResponse> {
  const label = metric === "worth" ? "est. site value" : "site health";
  let decoded = rawParam;
  try {
    decoded = decodeURIComponent(rawParam);
  } catch {
    // malformed %-encoding — use it as-is; validation below rejects junk
  }
  const domain = normalizeDomain(decoded.replace(/\.svg$/i, ""));

  const allowed = await checkRateLimit("worth-badge", clientKeyFrom(request.headers), REQUESTS_PER_MINUTE);
  if (!allowed) return svgResponse(renderValueBadge(label, "try later", COLOR.grey), 429, "no-store");

  const data = await getWorthBadgeData(domain);
  if (!data.ok) {
    const text = data.reason === "invalid" ? "invalid domain" : "unavailable";
    return svgResponse(renderValueBadge(label, text, COLOR.grey), data.reason === "invalid" ? 400 : 200, CACHE_SHORT);
  }

  if (metric === "health") {
    const score = Math.round(data.health);
    return svgResponse(
      renderValueBadge(label, score + "/100", healthColor(score), data.domain + " site health " + score + "/100 — checked by " + SITE_NAME),
      200,
      CACHE_OK
    );
  }

  // Major brands: ad revenue alone understates them, so mark the figure as a floor.
  const shown = badgeMoney(data.value) + (data.majorBrand ? "+" : "");
  return svgResponse(
    renderValueBadge(
      label,
      shown,
      COLOR.signal,
      data.domain + " estimated value " + shown + " — automated estimate by " + SITE_NAME + ", not an appraisal"
    ),
    200,
    CACHE_OK
  );
}
