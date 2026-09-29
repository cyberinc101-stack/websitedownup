/**
 * Monetag ads: paste your codes from the Monetag dashboard here.
 *
 * Three standalone formats are used (deliberately NOT the bundled
 * "Multitag" — that groups Vignette/In-Page Push/OnClick/Push Notifications
 * behind one script and one service worker, which would both duplicate the
 * two formats below and collide with the site's own push-alert service
 * worker in public/sw.js):
 *   - Vignette Banner: a full-screen card between page views, with a
 *     Close button.
 *   - In-Page Push: a small notification-style card in a corner.
 *   - OnClick (Popunder): opens a new tab on click. The most aggressive of
 *     the three, so it's throttled hard in MonetagAds.tsx (never on the
 *     landing page, at most once per browser session) to avoid feeling
 *     spammy.
 * How and when they load is decided in components/ads/MonetagAds.tsx.
 *
 * HOW TO FILL THIS IN: in Monetag, copy each code and paste it between
 * the backticks below exactly as Monetag gives it (the whole <meta ...>
 * or <script>...</script>). Leave a value empty to turn that format off.
 *
 * SECURITY: everything here is public (it ends up in the page source
 * anyway). Only https script addresses are accepted, and codes are never
 * inserted as raw HTML: we read out the script address and zone number and
 * load the script the same way Monetag's own code does.
 * CLIENT-SAFE. Contains no secrets.
 */

/** Site verification meta tag, e.g. <meta name="monetag" content="abc123"> */
export const MONETAG_VERIFICATION_TAG = `<meta name="monetag" content="0584363c3f525e46e5be38b545b28be5">`;

/** Vignette Banner code. */
export const MONETAG_VIGNETTE_CODE = `<script>(function(s){s.dataset.zone='11910476',s.src='https://n6wxm.com/vignette.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))</script>`;

/** In-Page Push code. */
export const MONETAG_IN_PAGE_PUSH_CODE = `<script>(function(s){s.dataset.zone='11910470',s.src='https://nap5k.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))</script>`;

/** OnClick (Popunder) code. Standalone zone — NOT the bundled Multitag one. */
export const MONETAG_ONCLICK_CODE = `<script>(function(s){s.dataset.zone='11917227',s.src='https://al5sm.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))</script>`;

// ---------------------------------------------------------------------------
// Parsing (no need to edit below).

export interface MonetagTag {
  src: string;
  zone: string | null;
}

/** Reads the script address and zone number out of a pasted Monetag code. */
export function parseMonetagCode(code: string): MonetagTag | null {
  const text = code.trim();
  if (!text) return null;
  const srcMatch = text.match(/src\s*=\s*['"](https:\/\/[^'"\s]+)['"]/i);
  if (!srcMatch) return null;
  let src: string;
  try {
    const url = new URL(srcMatch[1]);
    if (url.protocol !== "https:" || !/^[a-z0-9.-]+$/i.test(url.hostname)) return null;
    src = url.toString();
  } catch {
    return null;
  }
  const zoneMatch = text.match(/zone\s*=\s*['"](\d{3,12})['"]/i);
  return { src, zone: zoneMatch ? zoneMatch[1] : null };
}

/** Reads name and content out of the pasted verification meta tag. */
export function parseVerificationTag(tag: string): { name: string; content: string } | null {
  const text = tag.trim();
  if (!text) return null;
  const name = text.match(/name\s*=\s*['"]([a-z0-9_-]{1,40})['"]/i);
  const content = text.match(/content\s*=\s*['"]([^'"<>]{1,200})['"]/i);
  return name && content ? { name: name[1], content: content[1] } : null;
}

export const MONETAG_VIGNETTE = parseMonetagCode(MONETAG_VIGNETTE_CODE);
export const MONETAG_IN_PAGE_PUSH = parseMonetagCode(MONETAG_IN_PAGE_PUSH_CODE);
export const MONETAG_ONCLICK = parseMonetagCode(MONETAG_ONCLICK_CODE);
export const MONETAG_VERIFICATION = parseVerificationTag(MONETAG_VERIFICATION_TAG);

/** Monetag SmartLink (https) for the leave-site gate. Empty = no ad step. */
export const MONETAG_SMARTLINK = "https://omg10.com/4/11910746";
