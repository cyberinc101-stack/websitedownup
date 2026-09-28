"use client";

/**
 * Loads the Monetag ads (codes in lib/config/monetag.ts), timed so they
 * earn without driving visitors away:
 *
 *  - Nothing on the About, Contact and Privacy pages.
 *  - In-Page Push starts 8 seconds after the page opens, so visitors see
 *    and use the tool first. It then runs site-wide.
 *  - The Vignette Banner starts from a visitor's SECOND page in a visit.
 *    The page they arrive on (often straight from Google) is never covered,
 *    and people who come back for more see it between pages.
 *  - Scripts load after the page is idle, so they don't slow it down.
 *
 * Each script is added exactly the way Monetag's own code does it
 * (a <script> with data-zone), once per visit to the site.
 * CLIENT-ONLY. Contains no secrets.
 */

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { MONETAG_IN_PAGE_PUSH, MONETAG_VIGNETTE, type MonetagTag } from "@/lib/config/monetag";

const NO_AD_PATHS = ["/about", "/contact", "/privacy"];
const IN_PAGE_PUSH_DELAY_MS = 8000;
const VIGNETTE_FROM_PAGE = 2;
const PAGE_COUNT_KEY = "mt-pages";

const loaded = new Set<string>();

function addScript(tag: MonetagTag) {
  const key = tag.src + "|" + (tag.zone ?? "");
  if (loaded.has(key)) return;
  loaded.add(key);
  const s = document.createElement("script");
  if (tag.zone) s.dataset.zone = tag.zone;
  s.setAttribute("data-cfasync", "false");
  s.async = true;
  s.src = tag.src;
  (document.body || document.documentElement).appendChild(s);
}

function whenIdle(fn: () => void) {
  const w = window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number };
  if (w.requestIdleCallback) w.requestIdleCallback(fn, { timeout: 3000 });
  else window.setTimeout(fn, 1500);
}

/** Counts pages viewed in this visit (tab). Falls back to 1 if storage is blocked. */
function bumpPageCount(): number {
  try {
    const n = (parseInt(window.sessionStorage.getItem(PAGE_COUNT_KEY) || "0", 10) || 0) + 1;
    window.sessionStorage.setItem(PAGE_COUNT_KEY, String(n));
    return n;
  } catch {
    return 1;
  }
}

export default function MonetagAds() {
  const pathname = usePathname() || "/";

  useEffect(() => {
    if (!MONETAG_IN_PAGE_PUSH && !MONETAG_VIGNETTE) return;
    const pages = bumpPageCount();
    if (NO_AD_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) return;

    let timer: number | undefined;
    if (MONETAG_IN_PAGE_PUSH) {
      const tag = MONETAG_IN_PAGE_PUSH;
      timer = window.setTimeout(() => whenIdle(() => addScript(tag)), IN_PAGE_PUSH_DELAY_MS);
    }
    if (MONETAG_VIGNETTE && pages >= VIGNETTE_FROM_PAGE) {
      const tag = MONETAG_VIGNETTE;
      whenIdle(() => addScript(tag));
    }
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [pathname]);

  return null;
}
