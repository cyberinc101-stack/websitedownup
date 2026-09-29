/**
 * /worth: the Website Worth Calculator.
 * Thin route: all search-facing copy is in seo/pages/worth.ts and all tool
 * UI in components/worth/. Contains no secrets.
 *
 * generateMetadata() adds a domain-specific title, description and share
 * card (via /api/og/worth) whenever ?domain= is a real address, so a
 * shared report link shows that domain, not a generic card. With no
 * domain (or an invalid one) it falls back to the plain page metadata,
 * which in turn falls back to the site-wide app/opengraph-image.tsx.
 */

import { Suspense } from "react";
import type { Metadata } from "next";
import AdRailLayout from "@/components/layout/AdRailLayout";
import AdSlot from "@/components/AdSlot";
import WorthAnalyzer from "@/components/worth/WorthAnalyzer";
import SeoArticle from "@/seo/components/SeoArticle";
import JsonLd from "@/seo/components/JsonLd";
import { WORTH_PAGE } from "@/seo/pages/worth";
import { buildMetadata } from "@/seo/buildMetadata";
import { faqSchema } from "@/seo/schema/faq";
import { breadcrumbSchema } from "@/seo/schema/breadcrumb";
import { webApplicationSchema } from "@/seo/schema/webApplication";
import { isLikelyValidDomain, normalizeDomain } from "@/lib/checkSite";
import { SITE_NAME, SITE_URL } from "@/lib/config/site";

/**
 * Explicit fallback for the no-domain case: a page using generateMetadata
 * does NOT automatically inherit the site-wide app/opengraph-image.tsx the
 * way a page with a plain `export const metadata` object does, so without
 * this the page would have no share-card image at all.
 */
const DEFAULT_OG_IMAGE = SITE_URL + "/opengraph-image";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>;
}): Promise<Metadata> {
  const base = buildMetadata(WORTH_PAGE);
  const { domain: rawDomain } = await searchParams;
  const domain = normalizeDomain(rawDomain || "");
  if (!isLikelyValidDomain(domain)) {
    return {
      ...base,
      openGraph: { ...base.openGraph, images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630 }] },
      twitter: { ...base.twitter, images: [DEFAULT_OG_IMAGE] },
    };
  }

  const title = domain + " website worth — " + SITE_NAME;
  const description = "See " + domain + "'s estimated value, traffic and ad revenue, worked out live.";
  const url = SITE_URL + "/worth?domain=" + encodeURIComponent(domain);
  const image = SITE_URL + "/api/og/worth?domain=" + encodeURIComponent(domain);

  return {
    ...base,
    title,
    description,
    alternates: { canonical: url },
    openGraph: { ...base.openGraph, title, description, url, images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { ...base.twitter, title, description, images: [image] },
  };
}

function FormFallback() {
  return <div className="h-[52px] rounded-xl border border-line bg-surface" aria-hidden="true" />;
}

export default function WorthPage() {
  return (
    <AdRailLayout rail={<AdSlot className="min-h-[250px]" />}>
      <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink mb-3">{WORTH_PAGE.h1}</h1>
      <p className="text-muted mb-6 leading-relaxed">{WORTH_PAGE.intro}</p>

      <Suspense fallback={<FormFallback />}>
        <WorthAnalyzer />
      </Suspense>

      <AdSlot className="mt-10" />

      <SeoArticle page={WORTH_PAGE} />

      <AdSlot className="mt-12" />

      <JsonLd data={[webApplicationSchema(WORTH_PAGE), faqSchema(WORTH_PAGE.faqs), breadcrumbSchema(WORTH_PAGE)]} />
    </AdRailLayout>
  );
}
