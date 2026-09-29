import Link from "next/link";
import { getCategory, listCategorySlugs } from "@/lib/categories";
import type { CategoryData } from "@/lib/categories";
import { POPULAR_SITES } from "@/lib/sites";

const CATEGORY_COUNT = 12;
const QUICK_COUNT = 12;
const MIN_LISTED = 3;

/**
 * Server-rendered link blocks for the homepage: the biggest category hubs
 * and the most popular sites. Plain links (no client JS), so visitors and
 * crawlers both get a direct path into the deeper pages.
 */
export default function HomeBrowse() {
  const categories = listCategorySlugs()
    .map((s) => getCategory(s))
    .filter((c): c is CategoryData => c !== null && c.entries.length >= MIN_LISTED)
    .sort((a, b) => b.entries.length - a.entries.length)
    .slice(0, CATEGORY_COUNT);

  const quick = POPULAR_SITES.slice(0, QUICK_COUNT);

  return (
    <div className="mt-10 space-y-8">
      <section>
        <h2 className="font-display text-lg font-bold text-ink">Browse by category</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={"/category/" + c.slug}
                className="inline-block rounded-full border border-line bg-white/70 px-3 py-1 text-sm text-ink hover:border-signal/50 transition-colors"
              >
                {c.label}
                <span className="ml-1.5 text-xs text-muted">{c.entries.length}</span>
              </Link>
            </li>
          ))}
          <li>
            <Link href="/category" className="inline-block px-2 py-1 text-sm text-signal hover:underline">
              All categories
            </Link>
          </li>
        </ul>
      </section>

      <section>
        <h2 className="font-display text-lg font-bold text-ink">Is it down? Quick checks</h2>
        <ul className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {quick.map((s) => (
            <li key={s.domain}>
              <Link
                href={"/site/" + s.domain}
                className="block rounded-lg border border-line bg-white/70 px-3 py-2 text-sm text-ink hover:border-signal/50 transition-colors truncate"
              >
                Is {s.name} down?
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}