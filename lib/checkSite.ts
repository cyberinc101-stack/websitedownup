/**
 * Basic up/down reachability check.
 *
 * CLIENT-SAFE: DomainChecker imports normalizeDomain from here in the
 * browser, so this file must NOT import Node-only modules.
 * SECURITY: checkDomain itself is only called server-side via
 * lib/server/siteReport.ts, which runs the SSRF pre-check first.
 * Contains no secrets.
 */

import { BOT_USER_AGENT } from "@/lib/config/site";

export type CheckStatus = "up" | "down";

export interface CheckResult {
  input: string;
  domain: string;
  status: CheckStatus;
  statusCode: number | null;
  responseTimeMs: number | null;
  checkedAt: string;
  error?: string;
}

const TIMEOUT_MS = 9000;

/**
 * Normalizes whatever the person typed ("facebook.com", "www.facebook.com",
 * "https://facebook.com/login") down to a bare host we can connect to.
 */
export function normalizeDomain(raw: string): string {
  let value = raw.trim().toLowerCase();
  value = value.replace(/^https?:\/\//, "");
  value = value.split("/")[0];
  value = value.split("?")[0];
  value = value.replace(/^www\./, "");
  return value;
}

export function isLikelyValidDomain(domain: string): boolean {
  if (!domain || domain.length > 253) return false;
  // Basic host pattern: at least one dot, valid label characters.
  return /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(domain);
}

async function attempt(
  url: string,
  method: "HEAD" | "GET",
  signal: AbortSignal
): Promise<{ statusCode: number }> {
  const res = await fetch(url, {
    method,
    redirect: "follow",
    signal,
    headers: {
      "User-Agent": BOT_USER_AGENT,
    },
    cache: "no-store",
  });
  return { statusCode: res.status };
}

/**
 * Performs a real, live reachability check against the given domain.
 * Tries HEAD first (cheap), falls back to GET since some servers
 * reject HEAD requests outright.
 *
 * timeoutMs lets callers that check a large batch of sites (the wider
 * "Having problems" watch list) use a shorter timeout than the default,
 * so a handful of slow/unreachable sites can't make the whole batch take
 * far longer than the majority. The single-site checker and the ranked
 * Top 100 snapshot keep the default, unshortened timeout.
 */
export async function checkDomain(rawInput: string, timeoutMs: number = TIMEOUT_MS): Promise<CheckResult> {
  const domain = normalizeDomain(rawInput);
  const checkedAt = new Date().toISOString();

  if (!isLikelyValidDomain(domain)) {
    return {
      input: rawInput,
      domain,
      status: "down",
      statusCode: null,
      responseTimeMs: null,
      checkedAt,
      error: "That doesn't look like a valid domain.",
    };
  }

  const url = "https://" + domain;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();

  try {
    let result;
    try {
      result = await attempt(url, "HEAD", controller.signal);
    } catch {
      result = await attempt(url, "GET", controller.signal);
    }
    const responseTimeMs = Date.now() - started;
    const isServerError = result.statusCode >= 500;
    return {
      input: rawInput,
      domain,
      status: isServerError ? "down" : "up",
      statusCode: result.statusCode,
      responseTimeMs,
      checkedAt,
      error: isServerError
        ? "The server responded with an error (HTTP " + result.statusCode + ")."
        : undefined,
    };
  } catch (err) {
    const aborted = controller.signal.aborted;
    return {
      input: rawInput,
      domain,
      status: "down",
      statusCode: null,
      responseTimeMs: null,
      checkedAt,
      error: aborted
        ? "The site took too long to respond."
        : "The site could not be reached.",
    };
  } finally {
    clearTimeout(timer);
  }
}