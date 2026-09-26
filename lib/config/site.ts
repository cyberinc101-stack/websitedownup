/**
 * Site-wide settings: domain, contact email, AdSense publisher ID.
 * Change these in ONE place (or better, set the env vars in Vercel:
 * Project > Settings > Environment Variables) and every page, the sitemap,
 * robots.txt, ads.txt and the bot User-Agent pick them up.
 *
 * CLIENT-SAFE. SECURITY NOTE: every value here is PUBLIC. Anything named
 * NEXT_PUBLIC_* is bundled into the browser JavaScript, so never put a
 * secret (API key, password, token) in a NEXT_PUBLIC_ variable or this file.
 * An AdSense publisher ID is public by design, so it's fine here.
 */

/** Your live domain, no trailing slash. e.g. https://example.com */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://web-site-down-oru-p.vercel.app"
).replace(/\/+$/, "");

export const SITE_NAME = "Website Worth Up or Down";

/** Public contact address shown on /contact. */
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@example.com";

/**
 * AdSense publisher ID in the form "pub-1234567890123456" (without "ca-").
 * Leave empty until AdSense gives you one; /ads.txt returns 404 until then.
 */
export const ADSENSE_PUBLISHER_ID = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || "";

/**
 * AdSense ad unit ID (the data-ad-slot number of a responsive display unit,
 * e.g. "1234567890"). Create one in AdSense > Ads > By ad unit once approved.
 *
 * Ad boxes on the page only appear when BOTH the publisher ID and this slot
 * ID are set — until then every AdSlot renders nothing and ad-only rails
 * collapse, so no empty "Ad slot" placeholders show. The AdSense script in
 * layout.tsx (used for site verification / Auto ads) and /ads.txt only need
 * the publisher ID and are unaffected.
 */
export const ADSENSE_SLOT_ID = (process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID || "").trim();

export const ADS_LIVE = /^pub-\d{10,20}$/.test(ADSENSE_PUBLISHER_ID) && /^\d{6,20}$/.test(ADSENSE_SLOT_ID);

/** Identifies our checker to the sites it checks, with a link explaining what it is. */
export const BOT_USER_AGENT = "IsSiteUpBot/1.0 (+" + SITE_URL + "/about)";
