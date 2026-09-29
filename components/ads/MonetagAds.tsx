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
 *  - OnClick (Popunder) is the most aggressive format (opens a new tab on
 *    click), so it's throttled harder than the other two: same "never on
 *    the landing page" rule as Vignette, PLUS it's only ever injected once
 *    per browser session (sessionStorage-gated, not just once per tab's JS
 *    memory), so even navigating around for a while or reloading mid-visit
 *    doesn't re-arm it.
 *  - Scripts load after the page is idle, so they don't slow it down.
 *
 * Each script is added exactly the way Monetag's own code does it
 * (a <script> with data-zone), once per visit to the site.
 * CLIENT-ONLY. Contains no secrets.
 */

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { MONETAG_IN_PAGE_PUSH, MONETAG_ONCLICK, MONETAG_VIGNETTE, type MonetagTag } from "@/lib/config/monetag";

const NO_AD_PATHS = ["/about", "/contact", "/privacy"];
const IN_PAGE_PUSH_DELAY_MS = 8000;
const VIGNETTE_FROM_PAGE = 2;
const ONCLICK_FROM_PAGE = 2;
const PAGE_COUNT_KEY = "mt-pages";
const ONCLICK_SESSION_KEY = "mt-onclick-loaded";

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

/** True once, then marks itself so it never returns true again this session. */
function claimOnclickSlot(): boolean {
  try {
    if (window.sessionStorage.getItem(ONCLICK_SESSION_KEY) === "1") return false;
    window.sessionStorage.setItem(ONCLICK_SESSION_KEY, "1");
    return true;
  } catch {
    // Storage blocked: fall back to once per tab's JS memory via the
    // `loaded` set in addScript(), rather than not showing it at all.
    return true;
  }
}

export default function MonetagAds() {
  const pathname = usePathname() || "/";

  useEffect(() => {
    if (!MONETAG_IN_PAGE_PUSH && !MONETAG_VIGNETTE && !MONETAG_ONCLICK) return;
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
    if (MONETAG_ONCLICK && pages >= ONCLICK_FROM_PAGE && claimOnclickSlot()) {
      const tag = MONETAG_ONCLICK;
      whenIdle(() => addScript(tag));
    }
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [pathname]);

  return null;
}
