/**
 * "Curated" domains = the ones we deliberately chose to have indexed:
 * lib/sites.ts (POPULAR_SITES) and seo_engine/data/seoDomains.ts
 * (SEO_DOMAINS). Any other /site/[domain] lookup still works exactly the
 * same for the visitor -- it just isn't asked to be indexed, so an
 * unbounded number of arbitrary user-typed lookups can never look like
 * auto-generated scaled content to a search engine.
 *
 * CLIENT-SAFE: no secrets, no Node-only APIs.
 */

import { POPULAR_SITES } from "@/lib/sites";
import { SEO_DOMAINS } from "@/seo_engine/data/seoDomains";

let cachedSet: Set<string> | null = null;

function buildSet(): Set<string> {
  const set = new Set<string>();
  for (const site of POPULAR_SITES) set.add(site.domain.toLowerCase());
  for (const entry of SEO_DOMAINS) set.add(entry.domain.toLowerCase());
  return set;
}

export function isCuratedDomain(domain: string): boolean {
  if (!cachedSet) cachedSet = buildSet();
  return cachedSet.has(domain.toLowerCase());
}
