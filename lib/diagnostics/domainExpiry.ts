/**
 * Domain registration diagnostics: registrar, registration and expiry dates.
 *
 * Uses RDAP, the official public successor to WHOIS, asking each domain's
 * own registry directly (e.g. the .com registry for github.com). Which
 * registry handles which extension comes from IANA's official RDAP
 * directory, loaded once and kept for 24 hours. A public relay service is
 * used only as a fallback for extensions missing from that directory; it
 * rate-limits cloud servers heavily, which is why it's no longer first.
 *
 * SECURITY: the user's input only picks WHICH registry entry to use. Every
 * host we connect to comes from IANA's directory (or the fixed relay URL),
 * never from the input, so there's no SSRF risk.
 * CACHING: successful lookups are kept in memory for 12 hours (this data
 * rarely changes). Failures are never cached, so a rate-limited or slow
 * moment doesn't stick; each failed request is retried once.
 *
 * SERVER-ONLY. UNTRUSTED DATA: registry responses are treated as plain text.
 * UI RULE: never show the lookup service's name in user-facing text.
 * Contains no secrets.
 */

import "server-only";
import type { DomainInfo } from "./types";

const IANA_BOOTSTRAP_URL = "https://data.iana.org/rdap/dns.json";
const FALLBACK_RDAP_URL = "https://rdap.org/domain/";
const BOOTSTRAP_TTL_MS = 86400000;
const BOOTSTRAP_TIMEOUT_MS = 5000;
const RDAP_TIMEOUT_MS = 6000;
const RETRY_DELAY_MS = 400;
const RESULT_TTL_MS = 12 * 3600 * 1000;
const MAX_CACHED_RESULTS = 1000;
const MAX_ATTEMPTS = 3;
const MAX_TEXT_LENGTH = 100;
const DAY_MS = 86400000;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function emptyDomain(error: string): DomainInfo {
  return {
    ok: false,
    lookedUp: null,
    registrar: null,
    registeredAt: null,
    expiresAt: null,
    daysRemaining: null,
    error,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toIso(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function findEventDate(json: Record<string, unknown>, action: string): string | null {
  const events = json.events;
  if (!Array.isArray(events)) return null;
  for (const event of events) {
    if (isRecord(event) && event.eventAction === action) return toIso(event.eventDate);
  }
  return null;
}

function findRegistrar(json: Record<string, unknown>): string | null {
  const entities = json.entities;
  if (!Array.isArray(entities)) return null;
  for (const entity of entities) {
    if (!isRecord(entity)) continue;
    const roles = entity.roles;
    if (!Array.isArray(roles) || !roles.includes("registrar")) continue;

    // vCard format: ["vcard", [["fn", {}, "text", "Registrar Name"], ...]]
    const vcard = entity.vcardArray;
    if (Array.isArray(vcard) && Array.isArray(vcard[1])) {
      for (const item of vcard[1]) {
        if (Array.isArray(item) && item[0] === "fn" && typeof item[3] === "string") {
          const name = item[3].trim();
          return name.length > MAX_TEXT_LENGTH ? name.slice(0, MAX_TEXT_LENGTH) : name;
        }
      }
    }
  }
  return null;
}

/** "api.shop.example.co.uk" -> ["api.shop.example.co.uk", "shop.example.co.uk", "example.co.uk"] */
function candidateNames(domain: string): string[] {
  const labels = domain.split(".");
  const names: string[] = [];
  for (let i = 0; i <= labels.length - 2 && names.length < MAX_ATTEMPTS; i++) {
    names.push(labels.slice(i).join("."));
  }
  return names;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ------------------------------------------------------------------ */
/* IANA registry directory                                             */
/* ------------------------------------------------------------------ */

let registryMap: Map<string, string> | null = null;
let registryLoadedAt = 0;

/** Parses IANA's directory: {"services": [[["com","net"], ["https://rdap.verisign.com/com/v1/"]], ...]} */
function parseBootstrap(json: unknown): Map<string, string> | null {
  if (!isRecord(json) || !Array.isArray(json.services)) return null;
  const map = new Map<string, string>();
  for (const service of json.services) {
    if (!Array.isArray(service) || !Array.isArray(service[0]) || !Array.isArray(service[1])) continue;
    const urls = service[1].filter((u): u is string => typeof u === "string");
    // SECURITY: only use https registry URLs.
    const base = urls.find((u) => u.startsWith("https://"));
    if (!base) continue;
    const normalized = base.endsWith("/") ? base : base + "/";
    for (const tld of service[0]) {
      if (typeof tld === "string" && tld) map.set(tld.toLowerCase(), normalized);
    }
  }
  return map.size > 0 ? map : null;
}

async function getRegistryMap(): Promise<Map<string, string> | null> {
  if (registryMap && Date.now() - registryLoadedAt < BOOTSTRAP_TTL_MS) return registryMap;
  try {
    const res = await fetch(IANA_BOOTSTRAP_URL, {
      cache: "no-store",
      signal: AbortSignal.timeout(BOOTSTRAP_TIMEOUT_MS),
    });
    if (res.ok) {
      const parsed = parseBootstrap(await res.json());
      if (parsed) {
        registryMap = parsed;
        registryLoadedAt = Date.now();
      }
    }
  } catch {
    // Keep any older copy; the relay fallback still works without it.
  }
  return registryMap;
}

/* ------------------------------------------------------------------ */
/* Lookup                                                              */
/* ------------------------------------------------------------------ */

type FetchOutcome =
  | { kind: "found"; json: Record<string, unknown> }
  | { kind: "not-found" }
  | { kind: "failed"; error: string };

async function fetchOnce(url: string): Promise<FetchOutcome> {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Accept: "application/rdap+json, application/json" },
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(RDAP_TIMEOUT_MS),
    });
  } catch {
    return { kind: "failed", error: "The registration lookup timed out." };
  }
  if (res.status === 404) return { kind: "not-found" };
  if (!res.ok) return { kind: "failed", error: "Registration details aren't available right now." };
  try {
    const json: unknown = await res.json();
    if (isRecord(json)) return { kind: "found", json };
  } catch {
    // fall through
  }
  return { kind: "failed", error: "The registry returned an unreadable response." };
}

/** One request, retried once if it failed (timeouts, rate limits, server errors). */
async function fetchWithRetry(url: string): Promise<FetchOutcome> {
  const first = await fetchOnce(url);
  if (first.kind !== "failed") return first;
  await sleep(RETRY_DELAY_MS);
  return fetchOnce(url);
}

const resultCache = new Map<string, { info: DomainInfo; at: number }>();

function cacheResult(domain: string, info: DomainInfo): void {
  if (resultCache.size >= MAX_CACHED_RESULTS) {
    const oldest = resultCache.keys().next().value;
    if (oldest !== undefined) resultCache.delete(oldest);
  }
  resultCache.set(domain, { info, at: Date.now() });
}

export async function lookupDomainExpiry(domain: string): Promise<DomainInfo> {
  const cached = resultCache.get(domain);
  if (cached && Date.now() - cached.at < RESULT_TTL_MS) return cached.info;

  const registries = await getRegistryMap();
  const tld = domain.split(".").pop() || "";
  const registryBase = registries ? registries.get(tld) ?? null : null;
  let lastError = "Registration details aren't published for this domain extension.";

  for (const name of candidateNames(domain)) {
    const urls: string[] = [];
    if (registryBase) urls.push(registryBase + "domain/" + encodeURIComponent(name));
    urls.push(FALLBACK_RDAP_URL + encodeURIComponent(name));

    let notFound = false;
    for (const url of urls) {
      const outcome = await fetchWithRetry(url);
      if (outcome.kind === "not-found") {
        notFound = true;
        break; // not registered at this level: try the parent name
      }
      if (outcome.kind === "failed") {
        lastError = outcome.error;
        continue; // try the fallback source
      }

      const json = outcome.json;
      const expiresAt = findEventDate(json, "expiration");
      const daysRemaining =
        expiresAt !== null ? Math.floor((new Date(expiresAt).getTime() - Date.now()) / DAY_MS) : null;
      const info: DomainInfo = {
        ok: true,
        lookedUp: name,
        registrar: findRegistrar(json),
        registeredAt: findEventDate(json, "registration"),
        expiresAt,
        daysRemaining,
      };
      cacheResult(domain, info);
      return info;
    }

    // Both sources failed (not a 404): stop rather than guessing at parents.
    if (!notFound) return emptyDomain(lastError);
  }

  return emptyDomain("Registration details aren't published for this domain extension.");
}
