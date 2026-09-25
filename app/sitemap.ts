import type { MetadataRoute } from "next";
import { POPULAR_SITES } from "@/lib/sites";
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

  return [...staticRoutes, ...siteRoutes];
}

