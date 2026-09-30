/**
 * Basic up/down reachability check.
 *
 * CLIENT-SAFE: DomainChecker imports normalizeDomain from here in the
 * browser, so this file must NOT import Node-only modules.
 * SECURITY: checkDomain itself is only called server-side via
 * lib/server/siteReport.ts, which runs the SSRF pre-check first.
 * Contains no secrets.
 */

export type CheckStatus = "up" | "down";

export interface CheckResult {
  input: string;
  domain: string;
  status: CheckStatus;
  statusCode: number | null;
  responseTimeMs: number | null;
  checkedAt: string;
  error?: string;
  /** True when the request was aborted for taking too long (as opposed to a refused/reset connection). */
  timedOut?: boolean;
}

const TIMEOUT_MS = 9000;
/** Don't start a second attempt with less than this left. */
const MIN_ATTEMPT_MS = 400;

/**
 * Many big sites stall or drop requests that don't look like a browser.
 * Any HTTP response (even 403/429) proves the server is up, so we only need
 * the request to look ordinary enough to get *an* answer.
 */
const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

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

function isAbortError(err: unknown): boolean {
  return (
    !!err &&
    typeof err === "object" &&
    "name" in err &&
    ((err as { name: unknown }).name === "AbortError" ||
      (err as { name: unknown }).name === "TimeoutError")
  );
}

/**
 * One GET with its OWN timeout (so a stalled attempt can't starve the next
 * one). GET rather than HEAD, because many servers hang or reject HEAD.
 * The body is cancelled as soon as headers arrive; we only need the status.
 */
async function attempt(
  url: string,
  timeoutMs: number
): Promise<{ statusCode: number; responseTimeMs: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: BROWSER_HEADERS,
      cache: "no-store",
    });
    const responseTimeMs = Date.now() - started;
    try {
      await res.body?.cancel();
    } catch {
      // ignore: we already have the status
    }
    return { statusCode: res.status, responseTimeMs };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Performs a real, live reachability check against the given domain.
 *
 * Tries https://domain first. If that fails quickly for a reason other
 * than a timeout (DNS, reset, TLS), it tries https://www.domain with
 * whatever time is left, because some sites only answer on www.
 *
 * timeoutMs is the total budget. Callers that check a large batch of
 * sites (the wider "Having problems" watch list) pass a shorter one so a
 * handful of slow sites can't make the whole batch take far longer.
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

  const deadline = Date.now() + timeoutMs;
  const hosts = [domain, "www." + domain];

  for (let i = 0; i < hosts.length; i++) {
    const remaining = deadline - Date.now();
    if (i > 0 && remaining < MIN_ATTEMPT_MS) break;

    try {
      const result = await attempt("https://" + hosts[i], Math.max(remaining, MIN_ATTEMPT_MS));
      const isServerError = result.statusCode >= 500;
      return {
        input: rawInput,
        domain,
        status: isServerError ? "down" : "up",
        statusCode: result.statusCode,
        responseTimeMs: result.responseTimeMs,
        checkedAt,
        error: isServerError
          ? "The server responded with an error (HTTP " + result.statusCode + ")."
          : undefined,
      };
    } catch (err) {
      if (isAbortError(err)) {
        // A stall on the apex means the budget is spent; don't try www.
        return {
          input: rawInput,
          domain,
          status: "down",
          statusCode: null,
          responseTimeMs: null,
          checkedAt,
          error: "The site took too long to respond.",
          timedOut: true,
        };
      }
      // Fast, non-timeout failure: fall through and try the next host.
    }
  }

  return {
    input: rawInput,
    domain,
    status: "down",
    statusCode: null,
    responseTimeMs: null,
    checkedAt,
    error: "The site could not be reached.",
  };
}