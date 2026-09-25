/**
 * WebApplication structured data for free online tools.
 * CLIENT-SAFE. Contains no secrets.
 */

import { SITE_NAME, SITE_URL } from "@/lib/config/site";
import type { SeoPage } from "../types";

export function webApplicationSchema(page: SeoPage): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: page.name,
    url: SITE_URL + page.path,
    description: page.description,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };
}
