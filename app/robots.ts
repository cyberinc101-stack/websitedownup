import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The API is for our own pages; crawling it would just burn checks.
      disallow: "/api/",
    },
    sitemap: SITE_URL + "/sitemap.xml",
  };
}
