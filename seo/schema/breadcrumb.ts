/**
 * BreadcrumbList structured data: Home > this page.
 * CLIENT-SAFE. Contains no secrets.
 */

import { SITE_NAME, SITE_URL } from "@/lib/config/site";
import type { SeoPage } from "../types";

export function breadcrumbSchema(page: SeoPage): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE_NAME, item: SITE_URL + "/" },
      { "@type": "ListItem", position: 2, name: page.name, item: SITE_URL + page.path },
    ],
  };
}
