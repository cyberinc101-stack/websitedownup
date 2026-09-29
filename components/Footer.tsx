import Link from "next/link";
import { SITE_NAME } from "@/lib/config/site";
import { getCategory, listCategorySlugs } from "@/lib/categories";
import type { CategoryData } from "@/lib/categories";

const TOP_CATEGORY_COUNT = 8;
const MIN_LISTED = 3;

export default function Footer() {
  const topCategories = listCategorySlugs()
    .map((s) => getCategory(s))
    .filter((c): c is CategoryData => c !== null && c.entries.length >= MIN_LISTED)
    .sort((a, b) => b.entries.length - a.entries.length)
    .slice(0, TOP_CATEGORY_COUNT);

  return (
    <footer className="border-t border-line bg-surface mt-16">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 pt-8 grid grid-cols-2 sm:grid-cols-3 gap-6 text-sm">
        <div>
          <h2 className="font-display font-bold text-ink mb-2">Browse by category</h2>
          <ul className="space-y-1.5 text-muted">
            {topCategories.map((c) => (
              <li key={c.slug}>
                <Link href={"/category/" + c.slug} className="hover:text-ink transition-colors">
                  {c.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/category" className="text-signal hover:underline">
                All categories
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="font-display font-bold text-ink mb-2">Tools</h2>
          <ul className="space-y-1.5 text-muted">
            <li>
              <Link href="/" className="hover:text-ink transition-colors">
                Is it down? Status checker
              </Link>
            </li>
            <li>
              <Link href="/worth" className="hover:text-ink transition-colors">
                Website worth
              </Link>
            </li>
            <li>
              <Link href="/app-worth" className="hover:text-ink transition-colors">
                App worth
              </Link>
            </li>
            <li>
              <Link href="/saved" className="hover:text-ink transition-colors">
                Saved sites &amp; alerts
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted">
        <p>
          {SITE_NAME} performs a live check at the moment you ask &mdash; it is not
          affiliated with, or endorsed by, any service it checks.
        </p>
        <div className="flex items-center gap-5 shrink-0">
          <Link href="/about" className="hover:text-ink transition-colors">
            About
          </Link>
          <Link href="/contact" className="hover:text-ink transition-colors">
            Contact
          </Link>
          <Link href="/privacy" className="hover:text-ink transition-colors">
            Privacy
          </Link>
          <span>&copy; {new Date().getFullYear()} {SITE_NAME}</span>
        </div>
      </div>
    </footer>
  );
}