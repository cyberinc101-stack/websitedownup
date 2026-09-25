/**
 * Collects every raw fact the Website Worth report needs about one domain:
 * homepage HTML + headers, DNS, SSL, registration, first-seen date.
 * Runs them in parallel; each has its own timeout (5-8s).
 *
 * The popularity rank is NOT added here: lib/server/worthSignals.ts adds it
 * after the cache, so refreshed rank data applies immediately.
 *
 * SERVER-ONLY. Callers must run the SSRF pre-check (isPublicHost) first;
 * lib/server/worthSignals.ts does.
 * UNTRUSTED DATA: page content is reduced to counts, booleans and short
 * plain-text strings by lib/worth/sources/pageFacts.ts.
 * Contains no secrets.
 */

import "server-only";
import { fetchPageForAnalysis } from "@/lib/diagnostics/httpProbe";
import { lookupDns } from "@/lib/diagnostics/dnsRecords";
import { checkSsl } from "@/lib/diagnostics/sslCertificate";
import { lookupDomainExpiry } from "@/lib/diagnostics/domainExpiry";
import { WORTH_HEADER_NAMES } from "@/data/worth/techSignatures";
import { readPageFacts } from "./sources/pageFacts";
import { detectTech } from "./sources/detectTech";
import { lookupFirstSeen } from "./sources/firstSeen";
import type { WorthSignals } from "./types";

export type SignalsWithoutRank = Omit<WorthSignals, "rank">;

export async function collectSignals(domain: string): Promise<SignalsWithoutRank> {
  const [page, dns, ssl, registration, firstSeen] = await Promise.all([
    fetchPageForAnalysis(domain, WORTH_HEADER_NAMES),
    lookupDns(domain),
    checkSsl(domain),
    lookupDomainExpiry(domain),
    lookupFirstSeen(domain),
  ]);

  const headers = page.headers;
  const status = page.finalStatus;
  const readable = page.ok && status !== null && status >= 200 && status < 300 && page.html !== null;

  let facts = null;
  if (readable && page.html && page.finalUrl) {
    try {
      facts = readPageFacts(page.html, new URL(page.finalUrl));
    } catch {
      facts = null;
    }
  }

  let error: string | null = null;
  if (!page.ok) error = page.error || "The site couldn't be reached.";
  else if (status !== null && status >= 400) error = "The site answered with an error (status " + status + "), so its page couldn't be read.";
  else if (!readable) error = "The homepage didn't return a readable web page.";

  const csp = (headers["content-security-policy"] || "").toLowerCase();

  return {
    domain,
    checkedAt: new Date().toISOString(),
    reachable: page.ok,
    error,
    finalUrl: page.finalUrl,
    finalStatus: status,
    redirects: page.redirects,
    waitMs: page.timing ? page.timing.waitMs : null,
    totalMs: page.timing ? page.timing.totalMs : null,
    htmlBytes: page.html ? Buffer.byteLength(page.html, "utf8") : 0,
    page: facts,
    tech: detectTech(readable ? page.html : null, headers),
    security: {
      httpsFinal: page.finalUrl !== null && page.finalUrl.startsWith("https:"),
      sslValid: ssl.valid,
      sslDaysRemaining: ssl.daysRemaining,
      hsts: headers["strict-transport-security"] !== undefined,
      csp: csp !== "",
      frameProtection: headers["x-frame-options"] !== undefined || csp.includes("frame-ancestors"),
      noSniff: (headers["x-content-type-options"] || "").toLowerCase().includes("nosniff"),
      spf: dns.spf !== null,
      dmarc: dns.dmarcPolicy !== null,
    },
    compression: headers["content-encoding"] !== undefined,
    ipv6: dns.ipv6.length > 0,
    registration: {
      registeredAt: registration.registeredAt,
      expiresAt: registration.expiresAt,
      registrar: registration.registrar,
    },
    firstSeen,
  };
}
