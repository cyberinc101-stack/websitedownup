/**
 * /tools/adsense-revenue-calculator
 * Thin route: copy lives in seo/pages/adsense-revenue-calculator.ts, tool UI in components/tools/AdsenseCalculator.tsx.
 * Contains no secrets.
 */

import type { Metadata } from "next";
import AdRailLayout from "@/components/layout/AdRailLayout";
import AdSlot from "@/components/AdSlot";
import AdsenseCalculator from "@/components/tools/AdsenseCalculator";
import SeoArticle from "@/seo/components/SeoArticle";
import JsonLd from "@/seo/components/JsonLd";
import { ADSENSE_REVENUE_CALCULATOR_PAGE } from "@/seo/pages/adsense-revenue-calculator";
import { buildMetadata } from "@/seo/buildMetadata";
import { faqSchema } from "@/seo/schema/faq";
import { breadcrumbSchema } from "@/seo/schema/breadcrumb";
import { webApplicationSchema } from "@/seo/schema/webApplication";

export const metadata: Metadata = buildMetadata(ADSENSE_REVENUE_CALCULATOR_PAGE);

export default function Page() {
  return (
    <AdRailLayout rail={<AdSlot className="min-h-[250px]" />}>
      <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink mb-3">{ADSENSE_REVENUE_CALCULATOR_PAGE.h1}</h1>
      <p className="text-muted mb-6 leading-relaxed">{ADSENSE_REVENUE_CALCULATOR_PAGE.intro}</p>

      <AdsenseCalculator />

      <AdSlot className="mt-10" />

      <SeoArticle page={ADSENSE_REVENUE_CALCULATOR_PAGE} />

      <AdSlot className="mt-12" />

      <JsonLd data={[webApplicationSchema(ADSENSE_REVENUE_CALCULATOR_PAGE), faqSchema(ADSENSE_REVENUE_CALCULATOR_PAGE.faqs), breadcrumbSchema(ADSENSE_REVENUE_CALCULATOR_PAGE)]} />
    </AdRailLayout>
  );
}
