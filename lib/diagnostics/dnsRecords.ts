/**
 * DNS diagnostics: A/AAAA addresses plus mail-related records (MX, NS, SPF, DMARC).
 *
 * SERVER-ONLY: uses Node's dns module.
 * DNS queries only read public records, so no SSRF guard is needed here.
 * Contains no secrets.
 */

import "server-only";
import { Resolver } from "node:dns/promises";
import type { DnsInfo } from "./types";

const DNS_TIMEOUT_MS = 3000;
const MAX_ADDRESSES = 6;
const MAX_RECORDS = 5;
const MAX_TXT_LENGTH = 200;

function errorCode(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    const code = (err as { code: unknown }).code;
    if (typeof code === "string") return code;
  }
  return "";
}

function dnsErrorMessage(code: string): string {
  switch (code) {
    case "ENOTFOUND":
      return "This domain doesn't exist or has no DNS records.";
    case "ENODATA":
      return "The domain exists but has no address records.";
    case "ETIMEOUT":
      return "The DNS lookup timed out.";
    case "ESERVFAIL":
      return "The domain's DNS servers returned an error.";
    case "EREFUSED":
      return "The DNS query was refused.";
    default:
      return "The DNS lookup failed.";
  }
}

function clip(value: string, max: number): string {
  return value.length > max ? value.slice(0, max - 3) + "..." : value;
}

function findTxt(records: string[][], prefix: string): string | null {
  const joined = records.map((chunks) => chunks.join(""));
  const match = joined.find((t) => t.toLowerCase().startsWith(prefix));
  return match ? clip(match, MAX_TXT_LENGTH) : null;
}

export async function lookupDns(domain: string): Promise<DnsInfo> {
  const resolver = new Resolver({ timeout: DNS_TIMEOUT_MS, tries: 1 });

  const timedA = async () => {
    const started = Date.now();
    const addresses = await resolver.resolve4(domain);
    return { addresses, ms: Date.now() - started };
  };

  const [a, aaaa, mx, ns, txt, dmarc] = await Promise.allSettled([
    timedA(),
    resolver.resolve6(domain),
    resolver.resolveMx(domain),
    resolver.resolveNs(domain),
    resolver.resolveTxt(domain),
    resolver.resolveTxt("_dmarc." + domain),
  ]);

  const ipv4 = a.status === "fulfilled" ? a.value.addresses.slice(0, MAX_ADDRESSES) : [];
  const ipv6 = aaaa.status === "fulfilled" ? aaaa.value.slice(0, MAX_ADDRESSES) : [];
  const lookupMs = a.status === "fulfilled" ? a.value.ms : null;

  const mxList =
    mx.status === "fulfilled"
      ? mx.value
          .slice()
          .sort((x, y) => x.priority - y.priority)
          .slice(0, MAX_RECORDS)
          .map((r) => r.priority + " " + r.exchange)
      : [];
  const nsList = ns.status === "fulfilled" ? ns.value.slice(0, MAX_RECORDS) : [];
  const spf = txt.status === "fulfilled" ? findTxt(txt.value, "v=spf1") : null;

  let dmarcPolicy: string | null = null;
  if (dmarc.status === "fulfilled") {
    const record = findTxt(dmarc.value, "v=dmarc1");
    if (record) {
      const policy = record.match(/(?:^|;)\s*p\s*=\s*([a-z]+)/i);
      dmarcPolicy = policy ? policy[1].toLowerCase() : "set";
    }
  }

  const base = { ipv4, ipv6, lookupMs, mx: mxList, ns: nsList, spf, dmarcPolicy };

  if (ipv4.length === 0 && ipv6.length === 0) {
    const code = a.status === "rejected" ? errorCode(a.reason) : "ENODATA";
    return { ok: false, ...base, error: dnsErrorMessage(code) };
  }
  return { ok: true, ...base };
}
