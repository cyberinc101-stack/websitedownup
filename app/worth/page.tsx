/**
 * /worth: the Website Worth Calculator.
 * Thin route: all search-facing copy is in seo/pages/worth.ts and all tool
 * UI in components/worth/. Contains no secrets.
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

export const metadata: Metadata = buildMetadata(WORTH_PAGE);

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
