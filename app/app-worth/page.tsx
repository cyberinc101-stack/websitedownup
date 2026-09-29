/**
 * /app-worth: the App Worth Calculator (App Store apps only).
 * Thin route: search-facing copy is in seo/pages/app-worth.ts and the tool
 * UI in components/apps/. Contains no secrets.
 *
 * generateMetadata() adds an app-specific title, description and share
 * card (via /api/og/app) whenever ?app= and &name= are present, so a
 * shared report link shows that app, not a generic card. `name` comes
 * from wherever the link was built (components/apps/AppWorthTool.tsx) â€”
 * see that route's comment for why it isn't looked up here instead. With
 * no name it falls back to the plain page metadata, which in turn falls
 * back to the site-wide app/opengraph-image.tsx.
 */

import { Suspense } from "react";
import type { Metadata } from "next";
import AdRailLayout from "@/components/layout/AdRailLayout";
import AdSlot from "@/components/AdSlot";
import AppWorthTool from "@/components/apps/AppWorthTool";
import SeoArticle from "@/seo/components/SeoArticle";
import JsonLd from "@/seo/components/JsonLd";
import { APP_WORTH_PAGE } from "@/seo/pages/app-worth";
import { buildMetadata } from "@/seo/buildMetadata";
import { faqSchema } from "@/seo/schema/faq";
import { breadcrumbSchema } from "@/seo/schema/breadcrumb";
import { webApplicationSchema } from "@/seo/schema/webApplication";
import { SITE_NAME, SITE_URL } from "@/lib/config/site";

/**
 * Explicit fallback when there's no name to build a card from: a page
 * using generateMetadata does NOT automatically inherit the site-wide
 * app/opengraph-image.tsx the way a page with a plain `export const
 * metadata` object does, so without this the page would have no
 * share-card image at all.
 */
const DEFAULT_OG_IMAGE = SITE_URL + "/opengraph-image";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ app?: string; name?: string }>;
}): Promise<Metadata> {
  const base = buildMetadata(APP_WORTH_PAGE);
  const { app, name } = await searchParams;
  const appId = (app || "").trim();
  const appName = (name || "").trim().slice(0, 80);
  if (!appId || !appName) {
    return {
      ...base,
      openGraph: { ...base.openGraph, images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630 }] },
      twitter: { ...base.twitter, images: [DEFAULT_OG_IMAGE] },
    };
  }

  const title = appName + " — App Worth — " + SITE_NAME;
  const description = "See " + appName + "'s estimated downloads, ratings and App Store revenue, worked out live.";
  const url = SITE_URL + "/app-worth?app=" + encodeURIComponent(appId);
  const image = SITE_URL + "/api/og/app?app=" + encodeURIComponent(appId) + "&name=" + encodeURIComponent(appName);

  return {
    ...base,
    title,
    description,
    alternates: { canonical: url },
    openGraph: { ...base.openGraph, title, description, url, images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { ...base.twitter, title, description, images: [image] },
  };
}

function ToolFallback() {
  return <div className="h-[100px] rounded-xl border border-line bg-surface" aria-hidden="true" />;
}

export default function AppWorthPage() {
  return (
    <AdRailLayout rail={<AdSlot className="min-h-[250px]" />}>
      <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink mb-3">{APP_WORTH_PAGE.h1}</h1>
      <p className="text-muted mb-6 leading-relaxed">{APP_WORTH_PAGE.intro}</p>

      <Suspense fallback={<ToolFallback />}>
        <AppWorthTool />
      </Suspense>

      <AdSlot className="mt-10" />

      <SeoArticle page={APP_WORTH_PAGE} />

      <AdSlot className="mt-12" />

      <JsonLd data={[webApplicationSchema(APP_WORTH_PAGE), faqSchema(APP_WORTH_PAGE.faqs), breadcrumbSchema(APP_WORTH_PAGE)]} />
    </AdRailLayout>
  );
}
