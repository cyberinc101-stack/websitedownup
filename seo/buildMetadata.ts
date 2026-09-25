/**
 * Builds Next.js page metadata (title, description, canonical URL, social
 * preview tags) from an SEO page file.
 * CLIENT-SAFE. Contains no secrets.
 */

import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/config/site";
import type { SeoPage } from "./types";

export function buildMetadata(page: SeoPage): Metadata {
  const title = page.title + " \u2014 " + SITE_NAME;
  return {
    title,
    description: page.description,
    alternates: { canonical: SITE_URL + page.path },
    openGraph: {
      title,
      description: page.description,
      url: SITE_URL + page.path,
      siteName: SITE_NAME,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description: page.description,
    },
  };
}
