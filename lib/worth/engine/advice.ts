/**
 * Plain-language summaries for the "biggest opportunity" callout, one per
 * health category. The specific next steps come from each failing check's
 * `fix` text in health.ts; these explain why the category matters.
 *
 * CLIENT-SAFE. Contains no secrets.
 */

import type { HealthCategoryId } from "../types";

export const OPPORTUNITY_COPY: Record<HealthCategoryId, { label: string; summary: string }> = {
  seo: {
    label: "Improve search visibility",
    summary:
      "Search engines can't rank what they can't understand. Fixing the basics on the homepage is the cheapest traffic gain available.",
  },
  performance: {
    label: "Speed up the site",
    summary:
      "Slow pages lose visitors before they load and rank lower on mobile. Every visitor kept is more pageviews and more ad revenue.",
  },
  content: {
    label: "Add more content depth",
    summary:
      "Thin pages give search engines little to rank and visitors little reason to stay. More useful content means more ways to be found.",
  },
  social: {
    label: "Strengthen social presence",
    summary:
      "Links shared on social media look bare without preview tags, and linked profiles give visitors and search engines more trust signals.",
  },
  technical: {
    label: "Fix technical foundations",
    summary:
      "Technical problems quietly cost rankings and visitors. They're usually quick to fix and rarely need new content.",
  },
  security: {
    label: "Tighten security",
    summary:
      "Browsers warn visitors away from insecure sites, and buyers discount sites with security gaps. Most fixes are single settings.",
  },
  monetization: {
    label: "Monetize the traffic",
    summary:
      "Traffic is only worth what it earns. Adding a revenue stream suited to the niche is the most direct way to raise the site's value.",
  },
  traffic: {
    label: "Grow organic traffic",
    summary:
      "Traffic is the biggest driver of this estimate. Publishing content that answers what people search for is the most reliable way to grow it.",
  },
  growth: {
    label: "Build momentum",
    summary:
      "Buyers pay more for sites that are growing. Consistent publishing and promotion turn a flat trend into a rising one.",
  },
};
