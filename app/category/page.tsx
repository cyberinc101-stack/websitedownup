import Link from "next/link";
import type { Metadata } from "next";
import { getCategory, listCategorySlugs } from "@/lib/categories";
import type { CategoryData } from "@/lib/categories";
import { SITE_NAME, SITE_URL } from "@/lib/config/site";

const MIN_LISTED = 3;

export const metadata: Metadata = {
  title: "Is it down? Browse websites by category \u2014 " + SITE_NAME,
  description:
    "Browse live website status checks by category: streaming, gaming, banking, telecom, social, shopping and more.",
  alternates: { canonical: SITE_URL + "/category" },
};

export default function CategoryIndexPage() {
  const categories = listCategorySlugs()
    .map((s) => getCategory(s))
    .filter((c): c is CategoryData => c !== null && c.entries.length >= MIN_LISTED)
    .sort((a, b) => b.entries.length - a.entries.length);

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-8 py-10 sm:py-14">
      <Link href="/" className="text-sm text-signal font-medium hover:underline">
        &larr; Back to checker
      </Link>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink mt-3 mb-2">
        Website status by category
      </h1>
      <p className="text-muted leading-relaxed mb-6">
        Pick a category to see live up/down status for the sites in it.
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {categories.map((c) => (
          <li key={c.slug}>
            <Link
              href={"/category/" + c.slug}
              className="block rounded-lg border border-line bg-white/70 px-3 py-2 text-sm text-ink hover:border-signal/50 transition-colors"
            >
              {c.label}
              <span className="block text-xs text-muted">{c.entries.length} sites</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}