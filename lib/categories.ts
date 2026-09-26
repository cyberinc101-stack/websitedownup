/**
 * Groups every tracked domain (POPULAR_SITES + SEO_DOMAINS) by its existing
 * `category` field, for /category/[category] hub pages and the small
 * "see other X sites" cross-link on each /site/[domain] report page.
 *
 * CLIENT-SAFE: no secrets, no Node-only APIs. Built once per server
 * instance and cached in memory (the underlying lists are static).
 */

import { POPULAR_SITES } from "@/lib/sites";
import { SEO_DOMAINS } from "@/seo_engine/data/seoDomains";

export interface CategoryEntry {
  domain: string;
  name: string;
}

export interface CategoryData {
  slug: string;
  label: string;
  entries: CategoryEntry[];
}

function slugify(category: string): string {
  return category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

interface Built {
  bySlug: Map<string, CategoryData>;
  byDomain: Map<string, CategoryData>;
}

let cached: Built | null = null;

function build(): Built {
  const bySlug = new Map<string, CategoryData>();
  const byDomain = new Map<string, CategoryData>();
  const seenDomains = new Set<string>();

  function add(domain: string, category: string, name: string) {
    const key = domain.toLowerCase();
    if (seenDomains.has(key)) return;
    seenDomains.add(key);

    const slug = slugify(category);
    let data = bySlug.get(slug);
    if (!data) {
      data = { slug, label: category, entries: [] };
      bySlug.set(slug, data);
    }
    data.entries.push({ domain, name });
    byDomain.set(key, data);
  }

  for (const site of POPULAR_SITES) add(site.domain, site.category, site.name);
  for (const entry of SEO_DOMAINS) add(entry.domain, entry.category, entry.domain);

  return { bySlug, byDomain };
}

function get(): Built {
  if (!cached) cached = build();
  return cached;
}

export function listCategorySlugs(): string[] {
  return Array.from(get().bySlug.keys());
}

export function getCategory(slug: string): CategoryData | null {
  return get().bySlug.get(slug) ?? null;
}

export function getCategoryForDomain(domain: string): CategoryData | null {
  return get().byDomain.get(domain.toLowerCase()) ?? null;
}
