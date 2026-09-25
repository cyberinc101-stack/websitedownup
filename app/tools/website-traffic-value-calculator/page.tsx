/**
 * /tools/website-traffic-value-calculator
 * Thin route: copy lives in seo/pages/website-traffic-value-calculator.ts, tool UI in components/tools/TrafficValueCalculator.tsx.
 * Contains no secrets.
 */

import type { Metadata } from "next";
import AdRailLayout from "@/components/layout/AdRailLayout";
import AdSlot from "@/components/AdSlot";
import TrafficValueCalculator from "@/components/tools/TrafficValueCalculator";
import SeoArticle from "@/seo/components/SeoArticle";
import JsonLd from "@/seo/components/JsonLd";
import { TRAFFIC_VALUE_CALCULATOR_PAGE } from "@/seo/pages/website-traffic-value-calculator";
import { buildMetadata } from "@/seo/buildMetadata";
import { faqSchema } from "@/seo/schema/faq";
import { breadcrumbSchema } from "@/seo/schema/breadcrumb";
import { webApplicationSchema } from "@/seo/schema/webApplication";

export const metadata: Metadata = buildMetadata(TRAFFIC_VALUE_CALCULATOR_PAGE);

export default function Page() {
  return (
    <AdRailLayout rail={<AdSlot className="min-h-[250px]" />}>
      <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink mb-3">{TRAFFIC_VALUE_CALCULATOR_PAGE.h1}</h1>
      <p className="text-muted mb-6 leading-relaxed">{TRAFFIC_VALUE_CALCULATOR_PAGE.intro}</p>

      <TrafficValueCalculator />

      <AdSlot className="mt-10" />

      <SeoArticle page={TRAFFIC_VALUE_CALCULATOR_PAGE} />

      <AdSlot className="mt-12" />

      <JsonLd data={[webApplicationSchema(TRAFFIC_VALUE_CALCULATOR_PAGE), faqSchema(TRAFFIC_VALUE_CALCULATOR_PAGE.faqs), breadcrumbSchema(TRAFFIC_VALUE_CALCULATOR_PAGE)]} />
    </AdRailLayout>
  );
}
