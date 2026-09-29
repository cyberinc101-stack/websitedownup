import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategory, listCategorySlugs } from "@/lib/categories";
import type { CategoryData } from "@/lib/categories";
import { SITE_NAME, SITE_URL } from "@/lib/config/site";

/** Hubs with fewer sites than this stay out of search results (too thin to rank). */
const MIN_INDEXABLE = 3;

export function generateStaticParams() {
  return listCategorySlugs().map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const data = getCategory(slug);
  if (!data) return {};

  const title = data.label + " websites down? Live status checker \u2014 " + SITE_NAME;
  const description =
    "Check whether any " + data.label.toLowerCase() + " website is down right now. Live status checks for " +
    data.entries.length + " tracked " + data.label.toLowerCase() + " sites.";
  const url = SITE_URL + "/category/" + slug;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: data.entries.length >= MIN_INDEXABLE, follow: true },
    openGraph: { title, description, url, siteName: SITE_NAME, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const data = getCategory(slug);
  if (!data) notFound();

  const lowerLabel = data.label.toLowerCase();
  const entries = [...data.entries].sort((a, b) => a.name.localeCompare(b.name));

  const others = listCategorySlugs()
    .filter((s) => s !== slug)
    .map((s) => getCategory(s))
    .filter((c): c is CategoryData => c !== null && c.entries.length >= MIN_INDEXABLE)
    .sort((a, b) => b.entries.length - a.entries.length)
    .slice(0, 12);

  const url = SITE_URL + "/category/" + slug;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Categories", item: SITE_URL + "/category" },
        { "@type": "ListItem", position: 3, name: data.label, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: data.label + " websites",
      itemListElement: entries.map((e, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: e.name,
        url: SITE_URL + "/site/" + e.domain,
      })),
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-8 py-10 sm:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <p className="text-sm">
        <Link href="/" className="text-signal font-medium hover:underline">Home</Link>
        <span className="text-muted"> / </span>
        <Link href="/category" className="text-signal font-medium hover:underline">Categories</Link>
      </p>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink mt-3 mb-2">
        {data.label} websites &mdash; live status
      </h1>
      <p className="text-muted leading-relaxed mb-6">
        Check whether any of these {entries.length} {lowerLabel} sites are
        down right now. Tap a site to run a live check with response time, SSL, DNS and more.
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {entries.map((entry) => (
          <li key={entry.domain}>
            <Link
              href={"/site/" + entry.domain}
              className="block rounded-lg border border-line bg-white/70 px-3 py-2 text-sm text-ink hover:border-signal/50 transition-colors truncate"
            >
              Is {entry.name} down?
              <span className="block text-xs text-muted truncate">{entry.domain}</span>
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-10 text-sm text-muted leading-relaxed space-y-3">
        <h2 className="font-display text-lg font-bold text-ink">
          If a {lowerLabel} site won&apos;t load
        </h2>
        <p>
          When one {lowerLabel} site stops responding, it&apos;s worth checking a couple of others in
          this list. If several fail at once, the cause is often your own connection or DNS rather than
          the sites themselves. If only one fails, the run of live checks on its page shows whether it
          is genuinely down and how many other visitors have reported the same problem.
        </p>
        <p>
          Want to know the moment a site goes down? Save it from its page and turn on alerts. You can
          also see{" "}
          <Link href="/worth" className="text-signal hover:underline">what a website is worth</Link>.
        </p>
      </section>

      {others.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-lg font-bold text-ink">Other categories</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {others.map((c) => (
              <li key={c.slug}>
                <Link
                  href={"/category/" + c.slug}
                  className="inline-block rounded-full border border-line bg-white/70 px-3 py-1 text-sm text-ink hover:border-signal/50 transition-colors"
                >
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">
            <Link href="/category" className="text-signal hover:underline">Browse all categories</Link>
          </p>
        </section>
      )}
    </div>
  );
}