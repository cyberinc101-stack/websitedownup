/**
 * Detects a site's technology (CMS, framework, analytics, ad networks,
 * affiliate programs, payments, CDN, web server) from its homepage HTML and
 * response headers, using the fingerprints in data/worth/techSignatures.ts.
 *
 * UNTRUSTED DATA in, fixed names out: the result only ever contains names
 * from the signatures file, never text from the site.
 * Pure string matching, no network access. Contains no secrets.
 */

import { TECH_SIGNATURES } from "@/data/worth/techSignatures";
import type { DetectedTech } from "../types";

export function detectTech(html: string | null, headers: Record<string, string>): DetectedTech[] {
  const source = (html || "").toLowerCase();
  const found: DetectedTech[] = [];

  for (const sig of TECH_SIGNATURES) {
    const htmlHit = source !== "" && (sig.html ?? []).some((p) => source.includes(p.toLowerCase()));
    const headerHit = (sig.headers ?? []).some((h) => {
      const value = headers[h.name];
      if (value === undefined) return false;
      return h.includes === undefined || value.toLowerCase().includes(h.includes);
    });
    if (htmlHit || headerHit) found.push({ name: sig.name, category: sig.category });
  }

  return found;
}
