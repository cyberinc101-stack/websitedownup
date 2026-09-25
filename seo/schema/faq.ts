/**
 * FAQPage structured data built from an SEO page's FAQ list.
 * CLIENT-SAFE. Contains no secrets.
 */

import type { SeoFaq } from "../types";

export function faqSchema(faqs: SeoFaq[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
