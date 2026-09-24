/**
 * Shared types for the site report diagnostics.
 *
 * CLIENT-SAFE: this file must stay free of Node-only imports so client
 * components can `import type` from it. No logic, no secrets.
 */

export interface DnsInfo {
  ok: boolean;
  ipv4: string[];
  ipv6: string[];
  /** Time to resolve the main A record, in ms. */
  lookupMs: number | null;
  mx: string[];
  ns: string[];
  spf: string | null;
  /** DMARC policy value (none / quarantine / reject), or null if no record. */
  dmarcPolicy: string | null;
  error?: string;
}

export interface SslInfo {
  /** A certificate was retrieved from the server. */
  ok: boolean;
  /** The certificate is trusted, matches the host and is in date. */
  valid: boolean;
  issuer: string | null;
  validFrom: string | null;
  validTo: string | null;
  daysRemaining: number | null;
  protocol: string | null;
  /** Human-readable verification problem, when a cert was found but isn't valid. */
  problem?: string;
  /** Human-readable connection failure, when no cert could be retrieved. */
  error?: string;
}

export interface RedirectHop {
  url: string;
  statusCode: number;
}

export interface HeaderEntry {
  name: string;
  value: string;
}

/** Load timing for the final page, all in ms. */
export interface TimingInfo {
  redirectMs: number;
  dnsMs: number;
  connectMs: number;
  tlsMs: number;
  waitMs: number;
  downloadMs: number;
  totalMs: number;
}

/**
 * UNTRUSTED DATA: everything here comes from the checked site's own HTML.
 * Render as plain text / img src only (React escapes it). Never use
 * dangerouslySetInnerHTML with these values.
 */
export interface PageMeta {
  title: string | null;
  description: string | null;
  siteName: string | null;
  /** Social preview image (og:image), https only. */
  imageUrl: string | null;
  /** Best icon found (apple-touch-icon, icon, or /favicon.ico), https only. */
  iconUrl: string | null;
}

export interface HttpInfo {
  ok: boolean;
  hops: RedirectHop[];
  finalUrl: string | null;
  finalStatus: number | null;
  server: string | null;
  cdn: string | null;
  hsts: boolean;
  headers: HeaderEntry[];
  timing: TimingInfo | null;
  page: PageMeta | null;
  error?: string;
}

export interface DomainInfo {
  ok: boolean;
  /** The registrable name that was actually looked up (e.g. github.com for api.github.com). */
  lookedUp: string | null;
  registrar: string | null;
  registeredAt: string | null;
  expiresAt: string | null;
  daysRemaining: number | null;
  error?: string;
}

export interface PortResult {
  port: number;
  label: string;
  open: boolean;
  ms: number | null;
}

export interface Diagnostics {
  dns: DnsInfo;
  ssl: SslInfo;
  http: HttpInfo;
  domain: DomainInfo;
  ports: PortResult[];
  ranAt: string;
}
