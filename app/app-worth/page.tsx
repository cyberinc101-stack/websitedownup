/**
 * /app-worth: the App Worth Calculator (App Store apps only).
 * Thin route: search-facing copy is in seo/pages/app-worth.ts and the tool
 * UI in components/apps/. Contains no secrets.
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

export const metadata: Metadata = buildMetadata(APP_WORTH_PAGE);

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
