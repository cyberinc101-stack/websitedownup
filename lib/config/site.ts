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

/** Your live domain, no trailing slash. e.g. https://pulsecheck.app */
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

/** Identifies our checker to the sites it checks, with a link explaining what it is. */
export const BOT_USER_AGENT = "IsSiteUpBot/1.0 (+" + SITE_URL + "/about)";