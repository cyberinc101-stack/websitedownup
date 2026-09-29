/**
 * The full SEO domain list: the hand-written base list plus the bulk
 * extras, with duplicates removed. Import SEO_DOMAINS from here.
 */

import { SEO_DOMAINS as BASE_SEO_DOMAINS, type SeoDomain } from "./seoDomains";
import { EXTRA_SEO_DOMAINS } from "./seoDomainsExtra";

export type { SeoDomain };

const seen = new Set<string>();

export const SEO_DOMAINS: SeoDomain[] = [...BASE_SEO_DOMAINS, ...EXTRA_SEO_DOMAINS].filter((d) => {
  const key = d.domain.toLowerCase();
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});