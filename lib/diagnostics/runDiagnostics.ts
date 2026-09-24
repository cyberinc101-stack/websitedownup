/**
 * Entry point for the site report diagnostics. Runs every check in parallel.
 *
 * SERVER-ONLY. Each check has its own timeout (3-8s), so the whole report
 * finishes in roughly the time of the slowest check.
 * Callers should go through lib/server/siteReport.ts, which applies the
 * SSRF pre-check first.
 * Contains no secrets.
 */

import "server-only";
import { isLikelyValidDomain, normalizeDomain } from "@/lib/checkSite";
import { lookupDns } from "./dnsRecords";
import { checkSsl } from "./sslCertificate";
import { probeHttp } from "./httpProbe";
import { lookupDomainExpiry } from "./domainExpiry";
import { checkWebPorts } from "./portCheck";
import type { Diagnostics } from "./types";

/** Returns null when the input isn't a usable domain. */
export async function runDiagnostics(rawInput: string): Promise<Diagnostics | null> {
  const domain = normalizeDomain(rawInput);
  if (!isLikelyValidDomain(domain)) return null;

  const [dns, ssl, http, domainInfo, ports] = await Promise.all([
    lookupDns(domain),
    checkSsl(domain),
    probeHttp(domain),
    lookupDomainExpiry(domain),
    checkWebPorts(domain),
  ]);

  return { dns, ssl, http, domain: domainInfo, ports, ranAt: new Date().toISOString() };
}
