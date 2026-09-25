$ErrorActionPreference = "Stop"

# 1. New file: lib/watchlist.ts - additional generally-popular sites beyond the Top 100
$watchlist = @"
/**
 * Additional well-known sites, beyond the ranked Top 100 in lib/sites.ts.
 * Used only to widen the "Having problems right now" panel so it can
 * surface outages on sites people care about even when they are not in
 * the ranked Top 100 grid. Not shown in the homepage grid, not part of
 * the sitemap, and does not affect any site's rank.
 * Prefer sites that answer automated checks normally.
 */

import type { ListedSite } from "@/lib/sites";

export const EXTRA_WATCH_SITES: ListedSite[] = [
  { domain: "chase.com", name: "Chase", category: "Banking" },
  { domain: "bankofamerica.com", name: "Bank of America", category: "Banking" },
  { domain: "wellsfargo.com", name: "Wells Fargo", category: "Banking" },
  { domain: "citibank.com", name: "Citibank", category: "Banking" },
  { domain: "capitalone.com", name: "Capital One", category: "Banking" },
  { domain: "americanexpress.com", name: "American Express", category: "Banking" },
  { domain: "target.com", name: "Target", category: "Shopping" },
  { domain: "bestbuy.com", name: "Best Buy", category: "Shopping" },
  { domain: "homedepot.com", name: "Home Depot", category: "Shopping" },
  { domain: "lowes.com", name: "Lowe's", category: "Shopping" },
  { domain: "costco.com", name: "Costco", category: "Shopping" },
  { domain: "ikea.com", name: "IKEA", category: "Shopping" },
  { domain: "nike.com", name: "Nike", category: "Shopping" },
  { domain: "sephora.com", name: "Sephora", category: "Shopping" },
  { domain: "starbucks.com", name: "Starbucks", category: "Food" },
  { domain: "mcdonalds.com", name: "McDonald's", category: "Food" },
  { domain: "chipotle.com", name: "Chipotle", category: "Food" },
  { domain: "dominos.com", name: "Domino's", category: "Food" },
  { domain: "grubhub.com", name: "Grubhub", category: "Food" },
  { domain: "instacart.com", name: "Instacart", category: "Food" },
  { domain: "lyft.com", name: "Lyft", category: "Travel" },
  { domain: "expedia.com", name: "Expedia", category: "Travel" },
  { domain: "tripadvisor.com", name: "TripAdvisor", category: "Travel" },
  { domain: "kayak.com", name: "Kayak", category: "Travel" },
  { domain: "united.com", name: "United Airlines", category: "Travel" },
  { domain: "delta.com", name: "Delta", category: "Travel" },
  { domain: "aa.com", name: "American Airlines", category: "Travel" },
  { domain: "southwest.com", name: "Southwest", category: "Travel" },
  { domain: "marriott.com", name: "Marriott", category: "Travel" },
  { domain: "hilton.com", name: "Hilton", category: "Travel" },
  { domain: "usps.com", name: "USPS", category: "Shipping" },
  { domain: "fedex.com", name: "FedEx", category: "Shipping" },
  { domain: "ups.com", name: "UPS", category: "Shipping" },
  { domain: "att.com", name: "AT&T", category: "Telecom" },
  { domain: "verizon.com", name: "Verizon", category: "Telecom" },
  { domain: "t-mobile.com", name: "T-Mobile", category: "Telecom" },
  { domain: "xfinity.com", name: "Xfinity", category: "Telecom" },
  { domain: "spectrum.com", name: "Spectrum", category: "Telecom" },
  { domain: "peacocktv.com", name: "Peacock", category: "Streaming" },
  { domain: "paramountplus.com", name: "Paramount+", category: "Streaming" },
  { domain: "crunchyroll.com", name: "Crunchyroll", category: "Streaming" },
  { domain: "craigslist.org", name: "Craigslist", category: "Shopping" },
  { domain: "indeed.com", name: "Indeed", category: "Jobs" },
  { domain: "glassdoor.com", name: "Glassdoor", category: "Jobs" },
  { domain: "ziprecruiter.com", name: "ZipRecruiter", category: "Jobs" },
  { domain: "salesforce.com", name: "Salesforce", category: "Business" },
  { domain: "hubspot.com", name: "HubSpot", category: "Business" },
  { domain: "zendesk.com", name: "Zendesk", category: "Business" },
  { domain: "monday.com", name: "monday.com", category: "Work" },
  { domain: "airtable.com", name: "Airtable", category: "Work" },
  { domain: "docusign.com", name: "DocuSign", category: "Business" },
  { domain: "box.com", name: "Box", category: "Cloud" },
  { domain: "protonmail.com", name: "Proton Mail", category: "Email" },
  { domain: "aol.com", name: "AOL", category: "Portal" },
  { domain: "zoho.com", name: "Zoho", category: "Business" },
  { domain: "squarespace.com", name: "Squarespace", category: "Tools" },
  { domain: "wix.com", name: "Wix", category: "Tools" },
  { domain: "mailchimp.com", name: "Mailchimp", category: "Tools" },
  { domain: "calendly.com", name: "Calendly", category: "Tools" },
  { domain: "zillow.com", name: "Zillow", category: "Real Estate" },
  { domain: "redfin.com", name: "Redfin", category: "Real Estate" },
  { domain: "realtor.com", name: "Realtor.com", category: "Real Estate" },
  { domain: "yelp.com", name: "Yelp", category: "Reference" },
  { domain: "walgreens.com", name: "Walgreens", category: "Shopping" },
  { domain: "cvs.com", name: "CVS", category: "Shopping" },
  { domain: "gamestop.com", name: "GameStop", category: "Shopping" },
  { domain: "kohls.com", name: "Kohl's", category: "Shopping" },
  { domain: "macys.com", name: "Macy's", category: "Shopping" },
  { domain: "nordstrom.com", name: "Nordstrom", category: "Shopping" },
  { domain: "asos.com", name: "ASOS", category: "Shopping" },
  { domain: "chess.com", name: "Chess.com", category: "Gaming" },
  { domain: "ign.com", name: "IGN", category: "Entertainment" },
  { domain: "theverge.com", name: "The Verge", category: "News" },
  { domain: "techcrunch.com", name: "TechCrunch", category: "News" },
  { domain: "wired.com", name: "Wired", category: "News" },
  { domain: "arstechnica.com", name: "Ars Technica", category: "News" },
  { domain: "engadget.com", name: "Engadget", category: "News" },
  { domain: "cnet.com", name: "CNET", category: "News" },
  { domain: "forbes.com", name: "Forbes", category: "News" },
  { domain: "businessinsider.com", name: "Business Insider", category: "News" },
  { domain: "bloomberg.com", name: "Bloomberg", category: "News" },
  { domain: "wsj.com", name: "The Wall Street Journal", category: "News" },
  { domain: "reuters.com", name: "Reuters", category: "News" },
  { domain: "npr.org", name: "NPR", category: "News" },
  { domain: "foxnews.com", name: "Fox News", category: "News" },
  { domain: "usatoday.com", name: "USA Today", category: "News" },
  { domain: "washingtonpost.com", name: "The Washington Post", category: "News" },
];
"@
New-Item -ItemType Directory -Force -Path "$PWD\lib" | Out-Null
[System.IO.File]::WriteAllText("$PWD\lib\watchlist.ts", $watchlist, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "Created lib\watchlist.ts"

# 2. Update lib/server/popularStatus.ts - add getProblemsSnapshot (Top 100 + watchlist combined)
$popularStatus = @"
/**
 * Live status of the popular sites list (lib/sites.ts), for the homepage
 * grid, the outage alert bar, and the ranked Top 100 checks.
 *
 * Also exposes getProblemsSnapshot(), a wider check that adds
 * lib/watchlist.ts on top of the Top 100 so "Having problems right now"
 * can surface outages on generally popular sites that are not part of
 * the ranked grid.
 *
 * SERVER-ONLY. No database: results are kept in Vercel's built-in data
 * cache for CACHE_SECONDS (2 minutes). Every visitor in that window gets the same
 * snapshot instantly, and after it expires the next visitor still gets the
 * last snapshot while a fresh one is built in the background. So we run one
 * batch of checks per 2 minutes no matter how much traffic there is, and
 * none at all when nobody is on the site.
 *
 * SECURITY: only checks the fixed, trusted lists in lib/sites.ts and
 * lib/watchlist.ts, never user input, so no SSRF pre-check is needed here.
 * Contains no secrets.
 */

import "server-only";
import { unstable_cache } from "next/cache";
import { checkDomain, type CheckResult } from "@/lib/checkSite";
import { POPULAR_SITES } from "@/lib/sites";
import { EXTRA_WATCH_SITES } from "@/lib/watchlist";

const CACHE_SECONDS = 120;
/**
 * Responses slower than this are listed as "slow" in Having problems.
 * Slow sites still count as Live (green) everywhere else.
 */
const SLOW_THRESHOLD_MS = 6000;

const ALL_WATCH_SITES = [...POPULAR_SITES, ...EXTRA_WATCH_SITES];

export type PopularState = "up" | "slow" | "down";

export interface PopularSiteStatus {
  /** 1 = most popular (position in lib/sites.ts, or the combined watch list). */
  rank: number;
  domain: string;
  name: string;
  category: string;
  state: PopularState;
  statusCode: number | null;
  responseTimeMs: number | null;
  error: string | null;
}

export interface PopularSnapshot {
  checkedAt: string;
  sites: PopularSiteStatus[];
}

async function checkWithRetry(domain: string): Promise<CheckResult> {
  const first = await checkDomain(domain);
  if (first.status === "up") return first;
  // One retry filters out brief network blips before we call a big site "down".
  return checkDomain(domain);
}

function toStatus(site: { domain: string; name: string; category: string }, rank: number, r: CheckResult): PopularSiteStatus {
  let state: PopularState = r.status === "up" ? "up" : "down";
  if (state === "up" && r.responseTimeMs !== null && r.responseTimeMs > SLOW_THRESHOLD_MS) {
    state = "slow";
  }
  return {
    rank,
    domain: site.domain,
    name: site.name,
    category: site.category,
    state,
    statusCode: r.statusCode,
    responseTimeMs: r.responseTimeMs,
    error: r.error ?? null,
  };
}

async function buildSnapshot(): Promise<PopularSnapshot> {
  const results = await Promise.all(POPULAR_SITES.map((s) => checkWithRetry(s.domain)));
  const sites = POPULAR_SITES.map((site, i) => toStatus(site, i + 1, results[i]));
  return { checkedAt: new Date().toISOString(), sites };
}

async function buildProblemsSnapshot(): Promise<PopularSnapshot> {
  const results = await Promise.all(ALL_WATCH_SITES.map((s) => checkWithRetry(s.domain)));
  const sites = ALL_WATCH_SITES.map((site, i) => toStatus(site, i + 1, results[i]));
  return { checkedAt: new Date().toISOString(), sites };
}

export const getPopularSnapshot = unstable_cache(buildSnapshot, ["popular-snapshot-v2"], {
  revalidate: CACHE_SECONDS,
});

export const getProblemsSnapshot = unstable_cache(buildProblemsSnapshot, ["problems-snapshot-v1"], {
  revalidate: CACHE_SECONDS,
});
"@
[System.IO.File]::WriteAllText("$PWD\lib\server\popularStatus.ts", $popularStatus, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "Updated lib\server\popularStatus.ts"

# 3. New file: app/api/problems/route.ts
$problemsRoute = @"
/**
 * GET /api/problems: the latest "Having problems right now" snapshot,
 * covering the ranked Top 100 (lib/sites.ts) plus the wider watch list
 * (lib/watchlist.ts) of generally popular sites outside the ranked grid.
 * Polled by components/home/ProblemsStatusProvider.tsx every 30 seconds.
 *
 * The snapshot itself refreshes every 2 minutes (lib/server/popularStatus.ts);
 * this response is also cached 30 seconds at Vercel's edge.
 * Public data only. Contains no secrets.
 */

import { NextResponse } from "next/server";
import { getProblemsSnapshot } from "@/lib/server/popularStatus";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// A refresh checks a wide list of sites; give it room to finish.
export const maxDuration = 60;

export async function GET() {
  const snapshot = await getProblemsSnapshot();
  return NextResponse.json(snapshot, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
  });
}
"@
New-Item -ItemType Directory -Force -Path "$PWD\app\api\problems" | Out-Null
[System.IO.File]::WriteAllText("$PWD\app\api\problems\route.ts", $problemsRoute, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "Created app\api\problems\route.ts"

# 4. New file: components/home/ProblemsStatusProvider.tsx
$problemsProvider = @"
"use client";

/**
 * Shares the live "Having problems right now" snapshot (Top 100 plus the
 * wider watch list in lib/watchlist.ts) with ProblemsBox and keeps it
 * fresh: polls /api/problems every 30 seconds while the tab is visible.
 * Starts from the server-rendered snapshot, so nothing flashes on load.
 * Separate from PopularStatusProvider because it covers a wider,
 * unranked set of sites than the Top 100 grid. No security logic.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { PopularSnapshot } from "@/lib/server/popularStatus";

const POLL_MS = 30000;

const ProblemsContext = createContext<PopularSnapshot | null>(null);

function isSnapshot(value: unknown): value is PopularSnapshot {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.checkedAt === "string" && Array.isArray(v.sites) && v.sites.length > 0;
}

export function ProblemsStatusProvider({
  initial,
  children,
}: {
  initial: PopularSnapshot;
  children: ReactNode;
}) {
  const [snapshot, setSnapshot] = useState<PopularSnapshot>(initial);

  useEffect(() => {
    let stopped = false;

    async function poll() {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/problems");
        if (!res.ok) return;
        const data: unknown = await res.json();
        if (!stopped && isSnapshot(data)) setSnapshot(data);
      } catch {
        // Network hiccup: keep the last snapshot.
      }
    }

    const id = setInterval(poll, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") poll();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return <ProblemsContext.Provider value={snapshot}>{children}</ProblemsContext.Provider>;
}

export function useProblemsSnapshot(): PopularSnapshot {
  const snapshot = useContext(ProblemsContext);
  if (!snapshot) throw new Error("useProblemsSnapshot must be used inside <ProblemsStatusProvider>");
  return snapshot;
}
"@
[System.IO.File]::WriteAllText("$PWD\components\home\ProblemsStatusProvider.tsx", $problemsProvider, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "Created components\home\ProblemsStatusProvider.tsx"

# 5. Update components/home/ProblemsBox.tsx to use the wider snapshot
$problemsBox = @"
"use client";

/**
 * "Having problems right now": sites (the ranked Top 100 plus the wider
 * watch list in lib/watchlist.ts) that are down or slow in the latest
 * snapshot, down first, then by popularity.
 * Updates live (every 30s) from ProblemsStatusProvider.
 * Sized for the 300px right rail: fixed height with its own scroll (the
 * scrollbar itself is hidden via .no-scrollbar, scrolling still works),
 * so it lines up with the ad containers. Shows an all-clear when nothing's
 * wrong. Pure presentation, no security logic.
 */

import Link from "next/link";
import SiteLogo from "@/components/shared/SiteLogo";
import type { PopularSiteStatus } from "@/lib/server/popularStatus";
import { useProblemsSnapshot } from "./ProblemsStatusProvider";

function detail(site: PopularSiteStatus): string {
  if (site.state === "slow") return site.responseTimeMs + " ms";
  if (site.statusCode !== null) return "HTTP " + site.statusCode;
  return "No response";
}

export default function ProblemsBox({ className = "" }: { className?: string }) {
  const { sites } = useProblemsSnapshot();
  const problems = sites
    .filter((s) => s.state !== "up")
    .sort((a, b) => {
      if (a.state !== b.state) return a.state === "down" ? -1 : 1;
      return a.rank - b.rank;
    });

  return (
    <div
      className={
        "flex h-[300px] flex-col rounded-xl border border-line bg-surface p-4 shadow-card " + className
      }
    >
      <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
        <h2 className="font-display text-base font-bold text-ink">Having problems right now</h2>
        <span
          className={
            "rounded-full px-2 py-0.5 text-xs font-semibold " +
            (problems.length > 0 ? "bg-down-bg text-down" : "bg-up-bg text-up")
          }
        >
          {problems.length}
        </span>
      </div>

      {problems.length === 0 ? (
        <p className="text-sm text-muted">
          All {sites.length} tracked sites are responding normally.
        </p>
      ) : (
        <ul className="no-scrollbar -mx-1.5 flex-1 space-y-0.5 overflow-y-auto pr-1">
          {problems.map((site) => (
            <li key={site.domain}>
              <Link
                href={"/site/" + site.domain}
                className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-bg transition-colors"
              >
                <SiteLogo domain={site.domain} className="h-4 w-4 rounded-sm shrink-0" />
                <span className="text-sm text-ink truncate flex-1 min-w-0">{site.name}</span>
                <span
                  className={
                    "text-[11px] font-semibold shrink-0 " + (site.state === "down" ? "text-down" : "text-slow")
                  }
                >
                  {detail(site)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
"@
[System.IO.File]::WriteAllText("$PWD\components\home\ProblemsBox.tsx", $problemsBox, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "Updated components\home\ProblemsBox.tsx"

# 6. Update app/page.tsx to fetch the wider snapshot and wrap in the new provider
$pageTsx = @"
import { after } from "next/server";
import HomeChecker from "@/components/HomeChecker";
import AdSlot from "@/components/AdSlot";
import RailRow from "@/components/layout/RailRow";
import AlertBar from "@/components/home/AlertBar";
import ProblemsBox from "@/components/home/ProblemsBox";
import LiveFeed from "@/components/home/LiveFeed";
import PopularSitesExplorer from "@/components/home/PopularSitesExplorer";
import { PopularStatusProvider } from "@/components/home/PopularStatusProvider";
import { ProblemsStatusProvider } from "@/components/home/ProblemsStatusProvider";
import FaqSection from "@/components/home/FaqSection";
import { getPopularSnapshot, getProblemsSnapshot } from "@/lib/server/popularStatus";
import { getRecentActivity, runMonitorTick } from "@/lib/activity/checkActivity";
import { SITE_NAME } from "@/lib/config/site";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// A popular-sites refresh checks 100 sites; give it room to finish.
export const maxDuration = 60;

const FEED_SIZE = 10;

export default async function HomePage() {
  const [snapshot, problemsSnapshot, feed] = await Promise.all([
    getPopularSnapshot(),
    getProblemsSnapshot(),
    getRecentActivity(),
  ]);
  after(runMonitorTick);

  return (
    <PopularStatusProvider initial={snapshot}>
      <ProblemsStatusProvider initial={problemsSnapshot}>
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-8 sm:py-12">
          <AlertBar />

          {/* Row 1: checker | top ad */}
          <RailRow
            main={
              <section className="max-w-2xl">
                <p className="font-mono text-xs uppercase tracking-widest text-signal mb-3">
                  Website Status Checker
                </p>
                <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink mb-3">
                  Check if a website is down or online right now
                </h1>
                <p className="text-muted mb-6 leading-relaxed">
                  Enter any website below and {SITE_NAME} will connect to it right now
                  and report whether it&apos;s reachable, along with how long it took
                  to respond.
                </p>
                <HomeChecker />
              </section>
            }
            rail={<AdSlot className="min-h-[250px]" />}
          />

          {/* Row 2: popular sites, with the rail starting level with the first cards */}
          <div className="mt-10">
            <ProblemsBox className="mb-6 lg:hidden" />
            <PopularSitesExplorer
              rail={
                <>
                  <ProblemsBox className="hidden lg:flex" />
                  <AdSlot className="min-h-[250px]" />
                  <LiveFeed initial={feed} limit={FEED_SIZE} />
                  <AdSlot className="min-h-[250px]" />
                </>
              }
            />
          </div>

          <AdSlot className="mt-10" />

          {/* Supporting copy for content depth */}
          <section className="mt-10 text-sm text-muted leading-relaxed space-y-3 max-w-2xl">
            <h2 className="font-display text-lg font-bold text-ink mb-1">How {SITE_NAME} works</h2>
            <p>
              When you check a domain, our server makes a real connection to
              that website at that exact moment and measures how it responds.
              We don&apos;t rely on crowdsourced reports, so what you see reflects
              the site&apos;s status from our end. The top {snapshot.sites.length} sites
              are re-checked every couple of minutes, and we raise an outage
              alert when one of the top 50 stops responding.
            </p>
            <p>
              A result of &ldquo;down&rdquo; means our server couldn&apos;t
              reach the site, or the site&apos;s server reported an error. If a
              site shows as up here but won&apos;t load for you, the problem is
              more likely with your connection, DNS, or local network &mdash; open
              the full report for that site for steps to try.
            </p>
          </section>

          <FaqSection />

          <AdSlot className="mt-12" />
        </div>
      </ProblemsStatusProvider>
    </PopularStatusProvider>
  );
}
"@
[System.IO.File]::WriteAllText("$PWD\app\page.tsx", $pageTsx, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "Updated app\page.tsx"

Write-Host "`nDone. Restart your dev server (npm run dev) to see the changes."
