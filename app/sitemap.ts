import type { MetadataRoute } from "next";
import { POPULAR_SITES } from "@/lib/sites";
import { SEO_DOMAINS } from "@/seo_engine/data/seoDomains";
import { listCategorySlugs } from "@/lib/categories";
import { SITE_URL } from "@/lib/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/worth",
    "/tools/website-value-calculator",
    "/tools/website-revenue-calculator",
    "/tools/adsense-revenue-calculator",
    "/tools/rpm-calculator",
    "/tools/website-traffic-value-calculator",
    "/about",
    "/contact",
    "/privacy",
  ].map((path) => ({
    url: SITE_URL + path,
    lastModified: new Date(),
  }));

  const siteRoutes = POPULAR_SITES.map((site) => ({
    url: SITE_URL + "/site/" + site.domain,
    lastModified: new Date(),
  }));

  // Dedup against POPULAR_SITES so no domain gets two sitemap entries.
  const popularDomainSet = new Set(POPULAR_SITES.map((s) => s.domain));
  const seoRoutes = SEO_DOMAINS.filter((d) => !popularDomainSet.has(d.domain)).map(
    (d) => ({
      url: SITE_URL + "/site/" + d.domain,
      lastModified: new Date(),
    })
  );

  const categoryRoutes = listCategorySlugs().map((slug) => ({
    url: SITE_URL + "/category/" + slug,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...siteRoutes, ...seoRoutes, ...categoryRoutes];
}