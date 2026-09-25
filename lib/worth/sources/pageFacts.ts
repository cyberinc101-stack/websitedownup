/**
 * Reads SEO, content and social facts from a site's homepage HTML for the
 * Website Worth tool.
 *
 * UNTRUSTED DATA: the HTML comes from arbitrary third-party sites.
 *  - Output is counts, booleans and short plain strings only.
 *  - All text is length-limited; nothing here is ever rendered as HTML.
 * Pure string parsing, no network access. Reuses parsePageMeta from the
 * status report so title/description/icon are read identically everywhere.
 * Contains no secrets.
 */

import { parsePageMeta } from "@/lib/diagnostics/pageMeta";
import type { PageFacts } from "../types";

const MAX_TOPIC_TEXT = 4000;
const OPENING_WORDS = 300;

/** Host suffix -> network name shown in the report. */
const SOCIAL_NETWORKS: Array<[string, string]> = [
  ["facebook.com", "Facebook"],
  ["instagram.com", "Instagram"],
  ["x.com", "X"],
  ["twitter.com", "X"],
  ["linkedin.com", "LinkedIn"],
  ["youtube.com", "YouTube"],
  ["tiktok.com", "TikTok"],
  ["pinterest.com", "Pinterest"],
  ["github.com", "GitHub"],
  ["reddit.com", "Reddit"],
  ["discord.gg", "Discord"],
  ["discord.com", "Discord"],
  ["threads.net", "Threads"],
  ["threads.com", "Threads"],
  ["bsky.app", "Bluesky"],
  ["t.me", "Telegram"],
  ["medium.com", "Medium"],
  ["twitch.tv", "Twitch"],
];

function attr(tag: string, name: string): string | null {
  const re = new RegExp("\\s" + name + "\\s*=\\s*(\"([^\"]*)\"|'([^']*)'|([^\\s\"'>]+))", "i");
  const m = tag.match(re);
  if (!m) return null;
  return m[2] ?? m[3] ?? m[4] ?? "";
}

function stripTags(html: string): string {
  return html
    .replace(/<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function headingTexts(html: string, level: number): string[] {
  const re = new RegExp("<h" + level + "\\b[^>]*>([\\s\\S]*?)<\\/h" + level + ">", "gi");
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null && out.length < 20) {
    const text = stripTags(m[1]);
    if (text) out.push(text.slice(0, 150));
  }
  return out;
}

function socialNetworkFor(host: string): string | null {
  for (const [suffix, name] of SOCIAL_NETWORKS) {
    if (host === suffix || host.endsWith("." + suffix)) return name;
  }
  return null;
}

export function readPageFacts(html: string, pageUrl: URL): PageFacts {
  const meta = parsePageMeta(html, pageUrl);
  const siteHost = pageUrl.hostname.replace(/^www\./, "");

  const htmlTag = html.match(/<html\b[^>]*>/i);
  const lang = htmlTag ? attr(htmlTag[0], "lang") : null;

  // <meta> tags keyed by name/property
  const metas = new Map<string, string>();
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const key = (attr(tag, "property") ?? attr(tag, "name") ?? "").toLowerCase();
    const content = attr(tag, "content");
    if (key && content !== null && !metas.has(key)) metas.set(key, content);
  }

  let hasCanonical = false;
  let hasFeed = false;
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const rel = (attr(tag, "rel") || "").toLowerCase();
    const type = (attr(tag, "type") || "").toLowerCase();
    if (rel.split(/\s+/).includes("canonical")) hasCanonical = true;
    if (rel.includes("alternate") && (type.includes("rss") || type.includes("atom"))) hasFeed = true;
  }

  // Links
  let internalLinks = 0;
  let externalLinks = 0;
  const social = new Set<string>();
  for (const tag of html.match(/<a\b[^>]*>/gi) ?? []) {
    const href = (attr(tag, "href") || "").trim();
    if (!href || href.startsWith("#") || /^(mailto|tel|javascript|data):/i.test(href)) continue;
    let url: URL;
    try {
      url = new URL(href, pageUrl);
    } catch {
      continue;
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") continue;
    const host = url.hostname.replace(/^www\./, "");
    if (host === siteHost || host.endsWith("." + siteHost)) {
      internalLinks++;
    } else {
      externalLinks++;
      const network = socialNetworkFor(host);
      if (network) social.add(network);
    }
  }

  // Images
  let images = 0;
  let imagesWithAlt = 0;
  for (const tag of html.match(/<img\b[^>]*>/gi) ?? []) {
    images++;
    const alt = attr(tag, "alt");
    if (alt !== null && alt.trim() !== "") imagesWithAlt++;
  }

  const bodyStart = html.search(/<body\b/i);
  const bodyText = stripTags(bodyStart >= 0 ? html.slice(bodyStart) : html);
  const words = bodyText.split(" ").filter((w) => /[a-z0-9]/i.test(w));

  const h1s = headingTexts(html, 1);
  const h2s = headingTexts(html, 2);

  const topicText = [
    meta.title || "",
    meta.description || "",
    h1s.join(" "),
    h2s.join(" "),
    words.slice(0, OPENING_WORDS).join(" "),
  ]
    .join(" ")
    .toLowerCase()
    .slice(0, MAX_TOPIC_TEXT);

  const robots = (metas.get("robots") || "").toLowerCase();

  return {
    title: meta.title,
    description: meta.description,
    iconUrl: meta.iconUrl,
    lang: lang ? lang.slice(0, 20) : null,
    h1Count: (html.match(/<h1[\s>]/gi) ?? []).length,
    h2Count: (html.match(/<h2[\s>]/gi) ?? []).length,
    wordCount: words.length,
    internalLinks,
    externalLinks,
    images,
    imagesWithAlt,
    hasCanonical,
    noindex: robots.includes("noindex"),
    hasViewport: (metas.get("viewport") || "").toLowerCase().includes("width="),
    hasStructuredData: /<script\b[^>]*type\s*=\s*["']?application\/ld\+json/i.test(html),
    ogTitle: metas.has("og:title"),
    ogImage: metas.has("og:image") || metas.has("og:image:secure_url") || metas.has("og:image:url"),
    twitterCard: metas.has("twitter:card"),
    hasFeed,
    socialProfiles: Array.from(social).sort(),
    topicText,
  };
}
