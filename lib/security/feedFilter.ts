/**
 * SECURITY / BRAND SAFETY: decides which checked domains may appear in the
 * public "Recently checked" feed and "Most checked" list.
 *
 * Anything shown there is visible to every visitor, so without a filter
 * someone could push adult or offensive domain names onto the homepage.
 * That would hurt visitors' trust and can break AdSense content policies.
 * Filtered domains can still be checked normally; they just don't appear
 * in public lists.
 *
 * Add terms to BLOCKED_TERMS any time (lowercase, matched anywhere in the
 * domain). Over-blocking is fine here: a hidden domain costs nothing.
 * Avoid short terms that hide real brands (e.g. "cock" hides peacock.com,
 * "rape" hides grape-related sites).
 * Contains no secrets.
 */

const BLOCKED_TERMS: readonly string[] = [
  "porn",
  "xxx",
  "sex",
  "nude",
  "naked",
  "nsfw",
  "hentai",
  "erotic",
  "escort",
  "onlyfans",
  "fansly",
  "xvideos",
  "xnxx",
  "xhamster",
  "chaturbate",
  "stripchat",
  "camgirl",
  "milf",
  "fuck",
  "shit",
  "cunt",
  "bitch",
  "pussy",
  "whore",
  "slut",
  "nazi",
  "kkk",
  "casino",
  "gambl",
  "betting",
  "darkweb",
  "hack",
  "warez",
  "torrent",
];

const MAX_FEED_DOMAIN_LENGTH = 60;

export function isFeedSafeDomain(domain: string): boolean {
  const d = domain.toLowerCase();
  if (d.length > MAX_FEED_DOMAIN_LENGTH) return false;
  // Punycode (xn--) can disguise lookalike or offensive names.
  if (d.includes("xn--")) return false;
  return !BLOCKED_TERMS.some((term) => d.includes(term));
}
