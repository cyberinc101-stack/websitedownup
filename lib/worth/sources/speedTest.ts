/**
 * Mobile lab speed test (performance, SEO, accessibility and best-practice
 * scores plus core loading metrics) via Google's public PageSpeed API.
 *
 * Slow (typically 10-30s), so it has its own route (/api/worth/speed) and
 * the report shows the quick check until this lands.
 *
 * SECURITY-SENSITIVE: reads PAGESPEED_API_KEY from a server-only env var.
 *  - Never prefix it with NEXT_PUBLIC_, never log it or return it.
 *  - The key is optional: without it the API still works at a much lower
 *    shared quota, and failures fall back to the quick check.
 * Requests go to a fixed Google host (the site itself is fetched by Google,
 * not by us), so there is no SSRF risk here.
 * SERVER-ONLY. UI RULE: never name the speed-test provider in the UI.
 */

import "server-only";
import type { SpeedResult } from "../types";

const API_URL = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
const TIMEOUT_MS = 50000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function failed(error: string): SpeedResult {
  return {
    ok: false,
    performance: null,
    seo: null,
    accessibility: null,
    bestPractices: null,
    lcpMs: null,
    cls: null,
    tbtMs: null,
    error,
  };
}

function categoryScore(categories: Record<string, unknown>, key: string): number | null {
  const cat = categories[key];
  if (!isRecord(cat) || typeof cat.score !== "number") return null;
  return Math.round(cat.score * 100);
}

function auditValue(audits: Record<string, unknown>, key: string): number | null {
  const audit = audits[key];
  if (!isRecord(audit) || typeof audit.numericValue !== "number") return null;
  return audit.numericValue;
}

export async function runSpeedTest(domain: string): Promise<SpeedResult> {
  const params = new URLSearchParams();
  params.set("url", "https://" + domain + "/");
  params.set("strategy", "mobile");
  params.append("category", "PERFORMANCE");
  params.append("category", "SEO");
  params.append("category", "ACCESSIBILITY");
  params.append("category", "BEST_PRACTICES");
  const key = process.env.PAGESPEED_API_KEY; // SECURITY: secret, never log
  if (key) params.set("key", key);

  let res: Response;
  try {
    res = await fetch(API_URL + "?" + params.toString(), {
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return failed("The speed test took too long to finish.");
  }
  if (res.status === 429) return failed("The speed test is busy right now.");
  if (!res.ok) return failed("The speed test couldn't load this site.");

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return failed("The speed test returned an unreadable result.");
  }
  if (!isRecord(json) || !isRecord(json.lighthouseResult)) {
    return failed("The speed test returned an unreadable result.");
  }
  const lh = json.lighthouseResult;
  const categories = isRecord(lh.categories) ? lh.categories : {};
  const audits = isRecord(lh.audits) ? lh.audits : {};

  const performance = categoryScore(categories, "performance");
  if (performance === null) return failed("The speed test couldn't load this site.");

  const lcp = auditValue(audits, "largest-contentful-paint");
  const tbt = auditValue(audits, "total-blocking-time");
  const cls = auditValue(audits, "cumulative-layout-shift");

  return {
    ok: true,
    performance,
    seo: categoryScore(categories, "seo"),
    accessibility: categoryScore(categories, "accessibility"),
    bestPractices: categoryScore(categories, "best-practices"),
    lcpMs: lcp === null ? null : Math.round(lcp),
    cls: cls === null ? null : Math.round(cls * 1000) / 1000,
    tbtMs: tbt === null ? null : Math.round(tbt),
  };
}
