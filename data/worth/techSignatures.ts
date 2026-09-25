/**
 * Fingerprints for detecting a site's technology from its HTML and response
 * headers. Matching is plain lowercase substring search, so keep patterns
 * specific enough not to match ordinary text.
 *
 * To add a technology: add one entry. `html` patterns are matched against
 * the page source; `headers` against the named response header (the header
 * must also be listed in WORTH_HEADER_NAMES below so it gets fetched).
 *
 * The names shown here describe the analysed site's own stack; they are not
 * data sources used by this site.
 * Contains no secrets.
 */

export type TechCategory =
  | "CMS"
  | "Framework"
  | "Store"
  | "Analytics"
  | "Advertising"
  | "Affiliate"
  | "Payments"
  | "CDN"
  | "Server";

export interface TechSignature {
  name: string;
  category: TechCategory;
  html?: string[];
  headers?: Array<{ name: string; includes?: string }>;
}

/** Every response header the analyzer reads. Passed to fetchPageForAnalysis. */
export const WORTH_HEADER_NAMES = [
  "server",
  "x-powered-by",
  "x-generator",
  "via",
  "x-served-by",
  "cf-ray",
  "x-vercel-id",
  "x-amz-cf-id",
  "x-nf-request-id",
  "x-fastly-request-id",
  "x-shopify-stage",
  "x-wix-request-id",
  "x-drupal-cache",
  "x-github-request-id",
  "x-litespeed-cache",
  "x-pingback",
  "content-type",
  "content-encoding",
  "strict-transport-security",
  "content-security-policy",
  "x-frame-options",
  "x-content-type-options",
];

export const TECH_SIGNATURES: TechSignature[] = [
  // CMS and site builders
  { name: "WordPress", category: "CMS", html: ["/wp-content/", "/wp-includes/"], headers: [{ name: "x-pingback" }] },
  { name: "Shopify", category: "Store", html: ["cdn.shopify.com", "shopify.theme"], headers: [{ name: "x-shopify-stage" }] },
  { name: "WooCommerce", category: "Store", html: ["woocommerce"] },
  { name: "Magento", category: "Store", html: ["mage/cookies", "magento_"] },
  { name: "BigCommerce", category: "Store", html: ["cdn11.bigcommerce.com", "bigcommerce.com/s-"] },
  { name: "Wix", category: "CMS", html: ["static.wixstatic.com", "wix-bolt"], headers: [{ name: "x-wix-request-id" }] },
  { name: "Squarespace", category: "CMS", html: ["static1.squarespace.com", "squarespace-cdn"] },
  { name: "Webflow", category: "CMS", html: ["data-wf-page", "webflow.js"] },
  { name: "Ghost", category: "CMS", html: ["content=\"ghost ", "ghost-portal"] },
  { name: "Drupal", category: "CMS", html: ["drupal-settings-json", "/sites/default/files/"], headers: [{ name: "x-drupal-cache" }, { name: "x-generator", includes: "drupal" }] },
  { name: "Joomla", category: "CMS", html: ["/media/jui/", "content=\"joomla"] },
  { name: "Blogger", category: "CMS", html: ["blogger.com/static", "content='blogger'"] },
  { name: "HubSpot CMS", category: "CMS", html: ["hs-scripts.com", "hubspot.net/hub/"] },
  { name: "Framer", category: "CMS", html: ["framerusercontent.com"] },

  // Frameworks
  { name: "Next.js", category: "Framework", html: ["__next_data__", "/_next/static/"], headers: [{ name: "x-powered-by", includes: "next.js" }] },
  { name: "Nuxt", category: "Framework", html: ["__nuxt", "/_nuxt/"] },
  { name: "Gatsby", category: "Framework", html: ["___gatsby"] },
  { name: "Astro", category: "Framework", html: ["astro-island", "/_astro/"] },
  { name: "Remix", category: "Framework", html: ["__remixcontext"] },
  { name: "SvelteKit", category: "Framework", html: ["__sveltekit", "/_app/immutable/"] },
  { name: "Angular", category: "Framework", html: ["ng-version="] },
  { name: "Laravel", category: "Framework", html: ["laravel_session"] },
  { name: "Express", category: "Framework", headers: [{ name: "x-powered-by", includes: "express" }] },
  { name: "PHP", category: "Framework", headers: [{ name: "x-powered-by", includes: "php" }] },
  { name: "ASP.NET", category: "Framework", headers: [{ name: "x-powered-by", includes: "asp.net" }] },

  // Analytics
  { name: "Google Analytics", category: "Analytics", html: ["googletagmanager.com/gtag/js", "google-analytics.com/analytics.js"] },
  { name: "Google Tag Manager", category: "Analytics", html: ["googletagmanager.com/gtm.js"] },
  { name: "Microsoft Clarity", category: "Analytics", html: ["clarity.ms/tag"] },
  { name: "Hotjar", category: "Analytics", html: ["static.hotjar.com"] },
  { name: "Plausible", category: "Analytics", html: ["plausible.io/js"] },
  { name: "Fathom", category: "Analytics", html: ["cdn.usefathom.com"] },
  { name: "Meta Pixel", category: "Analytics", html: ["connect.facebook.net/en_us/fbevents.js", "fbq('init'"] },
  { name: "Vercel Analytics", category: "Analytics", html: ["/_vercel/insights/"] },

  // Advertising
  { name: "Google AdSense", category: "Advertising", html: ["pagead2.googlesyndication.com", "adsbygoogle"] },
  { name: "Google Ad Manager", category: "Advertising", html: ["securepubads.g.doubleclick.net", "googletag.pubads"] },
  { name: "Ezoic", category: "Advertising", html: ["ezojs.com", "ezoic.net"] },
  { name: "Mediavine", category: "Advertising", html: ["scripts.mediavine.com"] },
  { name: "Raptive", category: "Advertising", html: ["ads.adthrive.com", "cafemedia"] },
  { name: "Journey by Mediavine", category: "Advertising", html: ["scripts.scriptwrapper.com"] },
  { name: "Carbon Ads", category: "Advertising", html: ["cdn.carbonads.com"] },
  { name: "Taboola", category: "Advertising", html: ["cdn.taboola.com"] },
  { name: "Outbrain", category: "Advertising", html: ["widgets.outbrain.com"] },

  // Affiliate
  { name: "Amazon Associates", category: "Affiliate", html: ["amzn.to/", "amazon-adsystem.com", "amazon.com/dp/"] },
  { name: "Skimlinks", category: "Affiliate", html: ["s.skimresources.com"] },
  { name: "Impact", category: "Affiliate", html: ["sjv.io/", "pxf.io/"] },
  { name: "ShareASale", category: "Affiliate", html: ["shareasale.com/r.cfm"] },
  { name: "Awin", category: "Affiliate", html: ["awin1.com/cread.php"] },
  { name: "CJ Affiliate", category: "Affiliate", html: ["anrdoezrs.net", "jdoqocy.com", "tkqlhce.com"] },

  // Payments and subscriptions
  { name: "Stripe", category: "Payments", html: ["js.stripe.com"] },
  { name: "PayPal", category: "Payments", html: ["paypal.com/sdk/js", "paypalobjects.com"] },
  { name: "Paddle", category: "Payments", html: ["cdn.paddle.com"] },
  { name: "Lemon Squeezy", category: "Payments", html: ["lemonsqueezy.com"] },

  // CDN and hosting
  { name: "Cloudflare", category: "CDN", headers: [{ name: "cf-ray" }, { name: "server", includes: "cloudflare" }] },
  { name: "Vercel", category: "CDN", headers: [{ name: "x-vercel-id" }] },
  { name: "Amazon CloudFront", category: "CDN", headers: [{ name: "x-amz-cf-id" }, { name: "via", includes: "cloudfront" }] },
  { name: "Netlify", category: "CDN", headers: [{ name: "x-nf-request-id" }, { name: "server", includes: "netlify" }] },
  { name: "Fastly", category: "CDN", headers: [{ name: "x-fastly-request-id" }] },
  { name: "GitHub Pages", category: "CDN", headers: [{ name: "x-github-request-id" }] },

  // Web servers
  { name: "Nginx", category: "Server", headers: [{ name: "server", includes: "nginx" }] },
  { name: "Apache", category: "Server", headers: [{ name: "server", includes: "apache" }] },
  { name: "LiteSpeed", category: "Server", headers: [{ name: "server", includes: "litespeed" }, { name: "x-litespeed-cache" }] },
  { name: "Microsoft IIS", category: "Server", headers: [{ name: "server", includes: "microsoft-iis" }] },
  { name: "Caddy", category: "Server", headers: [{ name: "server", includes: "caddy" }] },
];
