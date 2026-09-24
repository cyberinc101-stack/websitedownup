/**
 * Extracts display info (title, description, preview image, icon) from a
 * page's HTML so the report can show the site's logo and front-page image.
 *
 * UNTRUSTED DATA: the HTML comes from arbitrary third-party sites.
 * SECURITY rules for this file:
 *  - Output is plain strings only. React escapes them when rendered; never
 *    pass these values to dangerouslySetInnerHTML.
 *  - Image URLs must be http(s). Anything else (javascript:, data:, file:)
 *    is dropped. http is upgraded to https to avoid mixed-content warnings.
 *  - All text is length-limited.
 * Pure string parsing, no network access, no secrets.
 */

import type { PageMeta } from "./types";

const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 300;
const MAX_URL_LENGTH = 2048;
const MAX_HEAD_SCAN = 200000;

function decodeEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, n: string) => safeCodePoint(parseInt(n, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => safeCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

function safeCodePoint(code: number): string {
  if (!Number.isFinite(code) || code < 32 || code > 0x10ffff) return "";
  try {
    return String.fromCodePoint(code);
  } catch {
    return "";
  }
}

function cleanText(value: string | null | undefined, max: number): string | null {
  if (!value) return null;
  const text = decodeEntities(value).replace(/\s+/g, " ").trim();
  if (!text) return null;
  return text.length > max ? text.slice(0, max - 3) + "..." : text;
}

/** Reads one attribute from a single HTML tag. `name` is always a constant from this file. */
function getAttr(tag: string, name: string): string | null {
  const re = new RegExp("\\s" + name + "\\s*=\\s*(\"([^\"]*)\"|'([^']*)'|([^\\s\"'>]+))", "i");
  const m = tag.match(re);
  if (!m) return null;
  return decodeEntities(m[2] ?? m[3] ?? m[4] ?? "");
}

/** SECURITY: only returns absolute https URLs. */
function safeImageUrl(raw: string | null, base: URL): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw.trim(), base);
    if (url.protocol === "http:") url.protocol = "https:";
    if (url.protocol !== "https:") return null;
    const href = url.toString();
    return href.length > MAX_URL_LENGTH ? null : href;
  } catch {
    return null;
  }
}

function largestSize(sizes: string | null): number {
  if (!sizes) return 0;
  if (sizes.toLowerCase() === "any") return 512;
  let best = 0;
  for (const part of sizes.split(/\s+/)) {
    const n = parseInt(part.split(/x/i)[0], 10);
    if (!isNaN(n) && n > best) best = n;
  }
  return best;
}

function pickIcon(head: string, base: URL): string | null {
  let bestHref: string | null = null;
  let bestScore = -1;

  for (const tag of head.match(/<link\b[^>]*>/gi) ?? []) {
    const rel = (getAttr(tag, "rel") || "").toLowerCase();
    if (!rel.includes("icon")) continue;
    const href = getAttr(tag, "href");
    if (!href) continue;

    let score = largestSize(getAttr(tag, "sizes"));
    if (rel.includes("apple-touch-icon")) score += 1000; // usually the crispest logo
    if (rel.includes("mask-icon")) score = 0; // single-colour SVG, looks wrong on its own

    if (score > bestScore) {
      bestScore = score;
      bestHref = href;
    }
  }

  return safeImageUrl(bestHref, base) ?? safeImageUrl("/favicon.ico", base);
}

export function parsePageMeta(html: string, pageUrl: URL): PageMeta {
  const headEnd = html.search(/<\/head>/i);
  const head = headEnd > 0 ? html.slice(0, headEnd) : html.slice(0, MAX_HEAD_SCAN);

  const metas = new Map<string, string>();
  for (const tag of head.match(/<meta\b[^>]*>/gi) ?? []) {
    const key = (getAttr(tag, "property") ?? getAttr(tag, "name") ?? "").toLowerCase();
    const content = getAttr(tag, "content");
    if (key && content && !metas.has(key)) metas.set(key, content);
  }

  const titleMatch = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

  const image =
    metas.get("og:image:secure_url") ??
    metas.get("og:image") ??
    metas.get("og:image:url") ??
    metas.get("twitter:image") ??
    metas.get("twitter:image:src") ??
    null;

  return {
    title: cleanText(titleMatch ? titleMatch[1] : metas.get("og:title"), MAX_TITLE_LENGTH),
    description: cleanText(
      metas.get("description") ?? metas.get("og:description"),
      MAX_DESCRIPTION_LENGTH
    ),
    siteName: cleanText(metas.get("og:site_name"), MAX_TITLE_LENGTH),
    imageUrl: safeImageUrl(image, pageUrl),
    iconUrl: pickIcon(head, pageUrl),
  };
}
