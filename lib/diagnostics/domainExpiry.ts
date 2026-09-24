/**
 * Domain registration diagnostics: registrar, registration and expiry dates.
 *
 * Uses RDAP, the official public successor to WHOIS. Requests go to a fixed
 * public bootstrap service which redirects to the right registry, so the
 * user's input never controls which host we connect to (no SSRF risk).
 * No API key needed. Results are cached for 12 hours because this data
 * rarely changes and the service rate-limits heavy use.
 *
 * SERVER-ONLY. UNTRUSTED DATA: registry responses are treated as plain text.
 * UI RULE: never show the lookup service's name in user-facing text.
 * Contains no secrets.
 */

import "server-only";
import type { DomainInfo } from "./types";

const RDAP_BOOTSTRAP_URL = "https://rdap.org/domain/";
const RDAP_TIMEOUT_MS = 5000;
const CACHE_SECONDS = 43200;
const MAX_ATTEMPTS = 3;
const MAX_TEXT_LENGTH = 100;
const DAY_MS = 86400000;

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

export async function lookupDomainExpiry(domain: string): Promise<DomainInfo> {
  for (const name of candidateNames(domain)) {
    let res: Response;
    try {
      res = await fetch(RDAP_BOOTSTRAP_URL + encodeURIComponent(name), {
        headers: { Accept: "application/rdap+json, application/json" },
        redirect: "follow",
        signal: AbortSignal.timeout(RDAP_TIMEOUT_MS),
        next: { revalidate: CACHE_SECONDS },
      });
    } catch {
      return emptyDomain("The registration lookup timed out.");
    }

    if (res.status === 404) continue; // not registered at this level, try the parent
    if (!res.ok) {
      return emptyDomain("Registration details aren't available right now.");
    }

    let json: unknown;
    try {
      json = await res.json();
    } catch {
      return emptyDomain("The registry returned an unreadable response.");
    }
    if (!isRecord(json)) {
      return emptyDomain("The registry returned an unreadable response.");
    }

    const expiresAt = findEventDate(json, "expiration");
    const daysRemaining =
      expiresAt !== null ? Math.floor((new Date(expiresAt).getTime() - Date.now()) / DAY_MS) : null;

    return {
      ok: true,
      lookedUp: name,
      registrar: findRegistrar(json),
      registeredAt: findEventDate(json, "registration"),
      expiresAt,
      daysRemaining,
    };
  }

  return emptyDomain("Registration details aren't published for this domain extension.");
}
