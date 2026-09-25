/**
 * /tools/rpm-calculator
 * Thin route: copy lives in seo/pages/rpm-calculator.ts, tool UI in components/tools/RpmCalculator.tsx.
 * Contains no secrets.
 */

import type { Metadata } from "next";
import AdRailLayout from "@/components/layout/AdRailLayout";
import AdSlot from "@/components/AdSlot";
import RpmCalculator from "@/components/tools/RpmCalculator";
import SeoArticle from "@/seo/components/SeoArticle";
import JsonLd from "@/seo/components/JsonLd";
import { RPM_CALCULATOR_PAGE } from "@/seo/pages/rpm-calculator";
import { buildMetadata } from "@/seo/buildMetadata";
import { faqSchema } from "@/seo/schema/faq";
import { breadcrumbSchema } from "@/seo/schema/breadcrumb";
import { webApplicationSchema } from "@/seo/schema/webApplication";

export const metadata: Metadata = buildMetadata(RPM_CALCULATOR_PAGE);

export default function Page() {
  return (
    <AdRailLayout rail={<AdSlot className="min-h-[250px]" />}>
      <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink mb-3">{RPM_CALCULATOR_PAGE.h1}</h1>
      <p className="text-muted mb-6 leading-relaxed">{RPM_CALCULATOR_PAGE.intro}</p>

      <RpmCalculator />

      <AdSlot className="mt-10" />

      <SeoArticle page={RPM_CALCULATOR_PAGE} />

      <AdSlot className="mt-12" />

      <JsonLd data={[webApplicationSchema(RPM_CALCULATOR_PAGE), faqSchema(RPM_CALCULATOR_PAGE.faqs), breadcrumbSchema(RPM_CALCULATOR_PAGE)]} />
    </AdRailLayout>
  );
}
