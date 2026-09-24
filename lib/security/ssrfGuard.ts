/**
 * SECURITY-CRITICAL FILE: SSRF (server-side request forgery) protection.
 * SERVER-ONLY: uses Node's dns/net modules.
 *
 * PulseCheck connects to whatever domain a visitor types in. Without this
 * guard, someone could enter a domain that resolves to an internal address
 * (127.0.0.1, 10.x.x.x, 169.254.169.254 cloud metadata, etc.) and use our
 * server to probe networks it should never reach.
 *
 * Rules for this file:
 *  - Every outgoing connection to a user-supplied host must use `safeLookup`
 *    (as the `lookup` option) or be checked with `isPublicHost` first.
 *  - Only ever ADD ranges to the blocklist. Removing one opens a hole.
 *  - Contains no secrets or keys.
 */

import "server-only";
import dns from "node:dns";
import net from "node:net";
import type { LookupFunction } from "node:net";

// SECURITY: IPv4 ranges that must never be contacted.
// [base address, prefix length]
const BLOCKED_IPV4_RANGES: Array<[string, number]> = [
  ["0.0.0.0", 8], // "this" network
  ["10.0.0.0", 8], // private
  ["100.64.0.0", 10], // carrier-grade NAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local, includes cloud metadata 169.254.169.254
  ["172.16.0.0", 12], // private
  ["192.0.0.0", 24], // IETF protocol assignments
  ["192.0.2.0", 24], // documentation
  ["192.168.0.0", 16], // private
  ["198.18.0.0", 15], // benchmarking
  ["198.51.100.0", 24], // documentation
  ["203.0.113.0", 24], // documentation
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved + broadcast
];

function ipv4ToInt(ip: string): number {
  const parts = ip.split(".").map((p) => parseInt(p, 10));
  return (((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3]) >>> 0;
}

function inIpv4Range(ip: string, base: string, bits: number): boolean {
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return ((ipv4ToInt(ip) & mask) >>> 0) === ((ipv4ToInt(base) & mask) >>> 0);
}

/** Converts the hex tail of "::ffff:7f00:1" style addresses to dotted IPv4. */
function mappedHexToIpv4(tail: string): string | null {
  const groups = tail.split(":");
  if (groups.length !== 2) return null;
  const hi = parseInt(groups[0], 16);
  const lo = parseInt(groups[1], 16);
  if (isNaN(hi) || isNaN(lo)) return null;
  return [hi >> 8, hi & 255, lo >> 8, lo & 255].join(".");
}

/**
 * SECURITY: returns true when an IP address is private, reserved or otherwise
 * not a normal public internet address. Unknown formats are treated as blocked.
 */
export function isBlockedAddress(ip: string): boolean {
  const version = net.isIP(ip);

  if (version === 4) {
    return BLOCKED_IPV4_RANGES.some(([base, bits]) => inIpv4Range(ip, base, bits));
  }

  if (version === 6) {
    const lower = ip.toLowerCase();

    // IPv4-mapped IPv6 (::ffff:1.2.3.4 or ::ffff:102:304): check the IPv4 inside.
    if (lower.startsWith("::ffff:")) {
      const tail = lower.slice(7);
      if (net.isIP(tail) === 4) return isBlockedAddress(tail);
      const converted = mappedHexToIpv4(tail);
      return converted === null ? true : isBlockedAddress(converted);
    }

    // Unspecified, loopback and deprecated IPv4-compatible forms (all start with "::").
    if (lower.startsWith("::")) return true;

    // NAT64 prefix can be used to reach IPv4 addresses indirectly.
    if (lower.startsWith("64:ff9b:")) return true;

    const first = parseInt(lower.split(":")[0], 16);
    if (isNaN(first)) return true;
    if ((first & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
    if ((first & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
    if ((first & 0xff00) === 0xff00) return true; // ff00::/8 multicast
    return false;
  }

  // Not a valid IP at all.
  return true;
}

function blockedError(hostname: string): NodeJS.ErrnoException {
  const err = new Error(
    "Blocked connection to " + hostname + ": it resolves to a private or reserved address."
  ) as NodeJS.ErrnoException;
  err.code = "EBLOCKED";
  return err;
}

/**
 * SECURITY: drop-in replacement for dns.lookup, passed as the `lookup`
 * option to http/https/net/tls. It resolves the host and refuses to connect
 * if ANY resolved address is private. Because the check happens at connect
 * time, it also defeats DNS-rebinding tricks.
 */
export const safeLookup: LookupFunction = (hostname, options, callback) => {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) {
      callback(err, "", undefined);
      return;
    }
    if (addresses.length === 0 || addresses.some((a) => isBlockedAddress(a.address))) {
      callback(blockedError(hostname), "", undefined);
      return;
    }
    if (options.all) {
      callback(null, addresses);
    } else {
      callback(null, addresses[0].address, addresses[0].family);
    }
  });
};

/**
 * SECURITY: pre-flight check used before code paths that can't take a custom
 * lookup (e.g. the global fetch in lib/checkSite.ts).
 * Returns false when the host resolves to any private address.
 * Unresolvable hosts return true: there's nothing to protect, and the normal
 * check will report them as unreachable.
 */
export async function isPublicHost(host: string): Promise<boolean> {
  if (net.isIP(host)) return !isBlockedAddress(host);
  try {
    const addresses = await dns.promises.lookup(host, { all: true });
    return addresses.every((a) => !isBlockedAddress(a.address));
  } catch {
    return true;
  }
}
