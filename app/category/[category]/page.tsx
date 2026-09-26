import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategory, listCategorySlugs } from "@/lib/categories";
import { SITE_NAME, SITE_URL } from "@/lib/config/site";

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

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-8 py-10 sm:py-14">
      <Link href="/" className="text-sm text-signal font-medium hover:underline">
        &larr; Back to checker
      </Link>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink mt-3 mb-2">
        {data.label} websites &mdash; live status
      </h1>
      <p className="text-muted leading-relaxed mb-6">
        Check whether any of these {data.entries.length} {data.label.toLowerCase()} sites are
        down right now. Tap a site to run a live check with response time, SSL, DNS and more.
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {data.entries.map((entry) => (
          <li key={entry.domain}>
            <Link
              href={"/site/" + entry.domain}
              className="block rounded-lg border border-line bg-white/70 px-3 py-2 text-sm text-ink hover:border-signal/50 transition-colors truncate"
            >
              {entry.name !== entry.domain ? entry.name : entry.domain}
              <span className="block text-xs text-muted truncate">{entry.domain}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
