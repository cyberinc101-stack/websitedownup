/**
 * HTTP diagnostics: follows redirects hop by hop, measures load timing
 * (DNS / connect / TLS / server wait / download), and reads the final page's
 * <head> for title, description, preview image and icon.
 *
 * SERVER-ONLY: uses Node's http/https/zlib modules.
 * SECURITY rules for this file:
 *  - Every request MUST use `lookup: safeLookup` (SSRF guard). Redirects are
 *    re-checked on every hop, so a public site can't bounce us to 127.0.0.1.
 *  - Only http: and https: redirects are followed.
 *  - Response bodies are capped at MAX_BODY_BYTES *after* decompression,
 *    which protects against gzip bombs.
 *  - We never send cookies or credentials. `rejectUnauthorized: false` only
 *    lets us time sites with broken certificates; certificate validity is
 *    reported separately by sslCertificate.ts.
 * UNTRUSTED DATA: headers and HTML come from third-party sites.
 * Contains no secrets.
 */

import "server-only";
import http from "node:http";
import https from "node:https";
import zlib from "node:zlib";
import type { Readable } from "node:stream";
import { safeLookup } from "@/lib/security/ssrfGuard";
import { BOT_USER_AGENT } from "@/lib/config/site";
import { parsePageMeta } from "./pageMeta";
import type { HeaderEntry, HttpInfo, RedirectHop, TimingInfo } from "./types";

const TOTAL_TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 8;
const MAX_BODY_BYTES = 512 * 1024;
const MAX_HEADER_VALUE_LENGTH = 160;


const INTERESTING_HEADERS = [
  "server",
  "content-type",
  "cache-control",
  "age",
  "x-cache",
  "via",
  "x-powered-by",
  "strict-transport-security",
  "x-frame-options",
  "content-security-policy",
];

type HeaderGetter = (name: string) => string | null;

interface HopResult {
  statusCode: number;
  header: HeaderGetter;
  timing: TimingInfo;
  body: string | null;
}

function errorCode(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    const code = (err as { code: unknown }).code;
    if (typeof code === "string") return code;
  }
  return "";
}

function timeoutError(): NodeJS.ErrnoException {
  const err = new Error("Request timed out") as NodeJS.ErrnoException;
  err.code = "ETIMEDOUT";
  return err;
}

function makeHeaderGetter(headers: http.IncomingHttpHeaders): HeaderGetter {
  return (name) => {
    const value = headers[name.toLowerCase()];
    if (value === undefined) return null;
    return Array.isArray(value) ? value.join(", ") : String(value);
  };
}

function ms(n: number): number {
  return Math.max(0, Math.round(n));
}

/** One request, no automatic redirects. Resolves with status, headers, timing and (optionally) the HTML body. */
function requestOnce(url: URL, readBody: boolean, deadline: number): Promise<HopResult> {
  return new Promise((resolve, reject) => {
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      reject(timeoutError());
      return;
    }

    const start = performance.now();
    let dnsAt: number | null = null;
    let connectAt: number | null = null;
    let tlsAt: number | null = null;
    let firstByteAt: number | null = null;
    let settled = false;

    const options: http.RequestOptions = {
      method: "GET",
      agent: false, // fresh connection every time so the timings are real
      lookup: safeLookup, // SECURITY: SSRF guard
      headers: {
        "User-Agent": BOT_USER_AGENT,
        Accept: "text/html,application/xhtml+xml,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
      },
    };

    const req =
      url.protocol === "https:"
        ? https.request(url, { ...options, rejectUnauthorized: false })
        : http.request(url, options);

    const timer = setTimeout(() => fail(timeoutError()), remaining);

    function timing(endAt: number): TimingInfo {
      const dnsEnd = dnsAt ?? start;
      const connectEnd = connectAt ?? dnsEnd;
      const tlsEnd = tlsAt ?? connectEnd;
      const firstByte = firstByteAt ?? tlsEnd;
      return {
        redirectMs: 0,
        dnsMs: ms(dnsEnd - start),
        connectMs: ms(connectEnd - dnsEnd),
        tlsMs: ms(tlsEnd - connectEnd),
        waitMs: ms(firstByte - tlsEnd),
        downloadMs: ms(endAt - firstByte),
        totalMs: ms(endAt - start),
      };
    }

    function finish(result: HopResult) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    }

    function fail(err: Error) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      req.destroy();
      reject(err);
    }

    req.on("socket", (socket) => {
      socket.once("lookup", () => {
        dnsAt = performance.now();
      });
      socket.once("connect", () => {
        connectAt = performance.now();
      });
      socket.once("secureConnect", () => {
        tlsAt = performance.now();
      });
    });

    req.on("error", fail);

    req.on("response", (res) => {
      firstByteAt = performance.now();
      const header = makeHeaderGetter(res.headers);
      const statusCode = res.statusCode ?? 0;
      const isRedirect = statusCode >= 300 && statusCode < 400 && header("location") !== null;
      const isHtml = (header("content-type") || "").toLowerCase().includes("html");

      if (!readBody || isRedirect || !isHtml) {
        const t = timing(performance.now());
        res.destroy();
        finish({ statusCode, header, timing: t, body: null });
        return;
      }

      let stream: Readable = res;
      const encoding = (header("content-encoding") || "").toLowerCase();
      if (encoding.includes("br")) stream = res.pipe(zlib.createBrotliDecompress());
      else if (encoding.includes("gzip")) stream = res.pipe(zlib.createGunzip());
      else if (encoding.includes("deflate")) stream = res.pipe(zlib.createInflate());

      const chunks: Buffer[] = [];
      let size = 0;

      const done = () => {
        const t = timing(performance.now());
        res.destroy();
        finish({ statusCode, header, timing: t, body: Buffer.concat(chunks).toString("utf8") });
      };

      stream.on("data", (chunk: Buffer) => {
        if (settled) return;
        chunks.push(chunk);
        size += chunk.length;
        if (size >= MAX_BODY_BYTES) done(); // SECURITY: size cap (post-decompression)
      });
      stream.on("end", done);
      stream.on("error", done); // a partial body is still useful
    });

    req.end();
  });
}

function detectCdn(h: HeaderGetter): string | null {
  const server = (h("server") || "").toLowerCase();
  const via = (h("via") || "").toLowerCase();
  const servedBy = (h("x-served-by") || "").toLowerCase();

  if (h("cf-ray") !== null || server.includes("cloudflare")) return "Cloudflare";
  if (h("x-vercel-id") !== null || server === "vercel") return "Vercel";
  if (h("x-amz-cf-id") !== null || via.includes("cloudfront")) return "Amazon CloudFront";
  if (h("x-nf-request-id") !== null || server.includes("netlify")) return "Netlify";
  if (h("x-fastly-request-id") !== null || servedBy.includes("cache-")) return "Fastly";
  if (server.includes("akamai") || h("x-akamai-transformed") !== null) return "Akamai";
  if (h("x-azure-ref") !== null) return "Azure Front Door";
  if (server === "gws" || server.includes("google frontend")) return "Google";
  return null;
}

function pickHeaders(h: HeaderGetter): HeaderEntry[] {
  const out: HeaderEntry[] = [];
  for (const name of INTERESTING_HEADERS) {
    const value = h(name);
    if (value === null) continue;
    out.push({
      name,
      value:
        value.length > MAX_HEADER_VALUE_LENGTH
          ? value.slice(0, MAX_HEADER_VALUE_LENGTH - 3) + "..."
          : value,
    });
  }
  return out;
}

function failed(hops: RedirectHop[], error: string): HttpInfo {
  return {
    ok: false,
    hops,
    finalUrl: null,
    finalStatus: null,
    server: null,
    cdn: null,
    hsts: false,
    headers: [],
    timing: null,
    page: null,
    error,
  };
}

function describeHttpError(err: unknown): string {
  switch (errorCode(err)) {
    case "EBLOCKED":
      return "This domain points to a private network address, so it wasn't contacted.";
    case "ETIMEDOUT":
      return "The request timed out.";
    case "ECONNREFUSED":
      return "The server refused the connection.";
    case "ENOTFOUND":
      return "The domain couldn't be resolved.";
    case "ECONNRESET":
      return "The connection was reset by the server.";
    default:
      return "The request failed before a response came back.";
  }
}

export async function probeHttp(domain: string): Promise<HttpInfo> {
  const deadline = Date.now() + TOTAL_TIMEOUT_MS;
  const hops: RedirectHop[] = [];
  let url = new URL("https://" + domain);
  let redirectMs = 0;
  let triedHttpFallback = false;

  for (let hopCount = 0; hopCount <= MAX_REDIRECTS; ) {
    let hop: HopResult;
    try {
      hop = await requestOnce(url, true, deadline);
    } catch (err) {
      const code = errorCode(err);
      // Some older sites only serve plain HTTP. Try it once before giving up.
      if (hops.length === 0 && !triedHttpFallback && code !== "ETIMEDOUT" && code !== "EBLOCKED") {
        triedHttpFallback = true;
        url = new URL("http://" + domain);
        continue;
      }
      return failed(hops, describeHttpError(err));
    }

    hops.push({ url: url.toString(), statusCode: hop.statusCode });
    hopCount++;

    const location = hop.header("location");
    if (hop.statusCode >= 300 && hop.statusCode < 400 && location) {
      let next: URL;
      try {
        next = new URL(location, url);
      } catch {
        return failed(hops, "The site sent an invalid redirect.");
      }
      // SECURITY: only follow web redirects.
      if (next.protocol !== "http:" && next.protocol !== "https:") {
        return failed(hops, "The site redirects to a non-web address.");
      }
      redirectMs += hop.timing.totalMs;
      url = next;
      continue;
    }

    return {
      ok: true,
      hops,
      finalUrl: url.toString(),
      finalStatus: hop.statusCode,
      server: hop.header("server"),
      cdn: detectCdn(hop.header),
      hsts: hop.header("strict-transport-security") !== null,
      headers: pickHeaders(hop.header),
      timing: { ...hop.timing, redirectMs },
      page: hop.body ? parsePageMeta(hop.body, url) : null,
    };
  }

  return failed(hops, "Too many redirects (more than " + MAX_REDIRECTS + ").");
}
