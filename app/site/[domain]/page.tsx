import Link from "next/link";
import { Suspense } from "react";
import { headers } from "next/headers";
import { after } from "next/server";
import type { Metadata } from "next";
import { normalizeDomain } from "@/lib/checkSite";
import { getCachedSiteReport } from "@/lib/server/siteReport";
import { getUptimeStats } from "@/lib/server/domainHistory";
import { getPopularSnapshot } from "@/lib/server/popularStatus";
import { clientIpFrom, recordCheck, getRecentActivity, runMonitorTick } from "@/lib/activity/checkActivity";
import SiteStatusPanel from "@/components/SiteStatusPanel";
import EmbedBadge from "@/components/report/EmbedBadge";
import ReportProblemButton from "@/components/report/ReportProblemButton";
import AdSlot from "@/components/AdSlot";
import AdRailLayout from "@/components/layout/AdRailLayout";
import { PopularStatusProvider } from "@/components/home/PopularStatusProvider";
import ProblemsBox from "@/components/home/ProblemsBox";
import LiveFeed from "@/components/home/LiveFeed";
import { SITE_NAME, SITE_URL } from "@/lib/config/site";
import { getCategoryForDomain } from "@/lib/categories";
import { isCuratedDomain } from "@/lib/seo/curatedDomains";

export const dynamic = "force-dynamic";
// DNS, TLS and port checks need Node APIs, so this must not run on the Edge runtime.
export const runtime = "nodejs";
// The rail now also loads the popular-sites snapshot (100 checks on a cache
// miss); give it the same room as the homepage.
export const maxDuration = 60;

const FEED_SIZE = 10;
const RELATED_COUNT = 8;

/** Friendly name for a domain ("Netflix" for netflix.com), or the domain itself. */
function displayNameFor(domain: string): string {
  const category = getCategoryForDomain(domain);
  const entry = category?.entries.find((e) => e.domain.toLowerCase() === domain.toLowerCase());
  return entry && entry.name && entry.name !== entry.domain ? entry.name : domain;
}

/**
 * Other sites from the same category, starting just after this one in the
 * list and wrapping around. Every page therefore links to a different set
 * of neighbours, which spreads internal links across the whole category
 * instead of piling them on the first few entries.
 */
function relatedSitesFor(domain: string, limit: number) {
  const category = getCategoryForDomain(domain);
  if (!category) return [];
  const list = category.entries;
  const lower = domain.toLowerCase();
  const idx = Math.max(
    0,
    list.findIndex((e) => e.domain.toLowerCase() === lower)
  );
  const out: { domain: string; name: string }[] = [];
  for (let step = 1; step < list.length && out.length < limit; step++) {
    const entry = list[(idx + step) % list.length];
    if (entry.domain.toLowerCase() !== lower) out.push(entry);
  }
  return out;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domain: string }>;
}): Promise<Metadata> {
  const { domain: rawDomain } = await params;
  const domain = normalizeDomain(rawDomain);
  const label = displayNameFor(domain);
  const title = "Is " + label + " down? Live status & outage check \u2014 " + SITE_NAME;
  const description =
    `Is ${label}${label !== domain ? " (" + domain + ")" : ""} down right now? Live status check with response time, SSL certificate and domain expiry, plus what to try if ${domain} won't load for you.`;
  const url = SITE_URL + "/site/" + domain;
  const curated = isCuratedDomain(domain);

  return {
    title,
    description,
    alternates: { canonical: url },
    // Only the deliberately curated domains (popular sites + SEO_DOMAINS)
    // are indexed. Arbitrary lookups still work fully; they just stay out
    // of search results instead of looking like unbounded auto-generated
    // pages.
    robots: {
      index: curated,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

/** Shown in place of the report card + write-ups while the checks are still running. */
function ReportSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="rounded-2xl border border-line bg-white/60 p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-lg bg-line shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-48 rounded bg-line" />
            <div className="h-3 w-64 rounded bg-line" />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted shrink-0">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-line border-t-signal" />
            Checking&hellip;
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-[220px_minmax(0,1fr)]">
          <div className="aspect-[1.91/1] rounded-lg bg-line" />
          <div className="h-36 rounded-lg bg-line" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-line" />
          ))}
        </div>
      </div>
      <div className="mt-8 h-8 w-56 rounded bg-line" />
    </div>
  );
}

/** Shown in the rail while the popular-sites snapshot and live feed load. */
function RailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-[300px] rounded-xl bg-line" />
      <div className="h-[300px] rounded-xl bg-line" />
    </div>
  );
}

/**
 * Awaits the full site report (status + diagnostics) and renders the report
 * card plus the write-up sections below it. Rendered inside a Suspense
 * boundary so the nav link, ads and rail don't wait on it.
 */
async function ReportSection({ rawDomain }: { rawDomain: string }) {
  const report = await getCachedSiteReport(rawDomain);
  const uptimeStats = await getUptimeStats(report.domain);
  const category = getCategoryForDomain(report.domain);
  const label = displayNameFor(report.domain);
  const related = relatedSitesFor(report.domain, RELATED_COUNT);

  // Count this visit in the live feed / most checked lists, and give the
  // live monitor a chance to run its next tick too (same as the homepage).
  // Runs after the page is sent; bots and crawlers are skipped inside
  // recordCheck.
  const requestHeaders = await headers();
  const ip = clientIpFrom(requestHeaders);
  const userAgent = requestHeaders.get("user-agent");
  after(() =>
    recordCheck(
      { domain: report.domain, status: report.status, responseTimeMs: report.responseTimeMs },
      { ip, userAgent }
    )
  );
  after(runMonitorTick);

  const breadcrumbItems = [
    { name: "Home", item: SITE_URL },
    ...(category
      ? [{ name: category.label + " sites", item: SITE_URL + "/category/" + category.slug }]
      : []),
    { name: `Is ${label} down?`, item: `${SITE_URL}/site/${report.domain}` },
  ];
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: b.name,
      item: b.item,
    })),
  };

  const isUp = report.status === "up";
  const timing =
    typeof report.responseTimeMs === "number"
      ? ` in about ${Math.round(report.responseTimeMs)} ms`
      : "";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="mt-4">
        <SiteStatusPanel initial={report} uptimeStats={uptimeStats} />
      </div>

      <ReportProblemButton domain={report.domain} />

      <p className="mt-3 text-xs text-muted">Own or run {report.domain}? <a href="#embed" className="text-signal hover:underline">Add a live status badge to your site</a>.</p>

      <AdSlot className="mt-8" />

      <section className="mt-8 text-sm text-muted leading-relaxed space-y-4">
        <h2 className="font-display text-lg font-bold text-ink">
          Is {label} down right now?
        </h2>
        <p>
          {isUp
            ? `Our latest live check reached ${report.domain} and it responded normally${timing}. If ${label} still won't open for you, the problem is most likely on your side, such as your network, DNS or browser, and the fixes below usually sort it out.`
            : `Our latest live check did not get a normal response from ${report.domain}, so ${label} may be down or having problems right now. Check the response and SSL details above, and see how many other visitors have reported a problem.`}
        </p>
      </section>

      <section className="mt-8 text-sm text-muted leading-relaxed space-y-4">
        <h2 className="font-display text-lg font-bold text-ink">
          {isUp
            ? `${report.domain} looks reachable from here \u2014 but still can't load it?`
            : `What to try if ${report.domain} won't load`}
        </h2>
        <p>
          If {SITE_NAME} says a site is up but it still won&apos;t open for
          you, the issue is usually on your end rather than the
          site&apos;s &mdash; start with these:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            Hard-refresh the page (Ctrl/Cmd + Shift + R) to rule out a stale
            cached version.
          </li>
          <li>
            Try the site in a private/incognito window &mdash; this rules out
            browser extensions and stored cookies as the cause.
          </li>
          <li>
            Flush your local DNS cache (on Windows: open Command Prompt and
            run <code className="font-mono text-ink">ipconfig /flushdns</code>).
          </li>
          <li>
            Try a different network &mdash; for example switch from Wi-Fi to
            mobile data &mdash; to check whether it&apos;s your ISP or router.
          </li>
          <li>
            If you&apos;re on a work or school network, the site may simply
            be blocked by a firewall or content filter.
          </li>
        </ul>
        <p>
          If none of that helps and the site shows as &ldquo;down&rdquo;
          above, it&apos;s most likely an outage on their end &mdash; try again in
          a few minutes.
        </p>
      </section>

      <section className="mt-8 text-sm text-muted leading-relaxed space-y-3">
        <h2 className="font-display text-lg font-bold text-ink">
          How this check works
        </h2>
        <p>
          When you load this page, {SITE_NAME} makes a live connection to
          {" " + report.domain} and records exactly how it responds &mdash;
          the same request your own browser would make. Alongside the basic
          up/down result, we run a handful of supporting checks: DNS
          resolution, SSL certificate validity and expiry, domain
          registration status, and which ports respond, all shown in the
          cards above.
        </p>
        <p>
          Want to keep an eye on {report.domain} going forward? Tap the
          star next to its name to save it, then turn on alerts from your
          saved sites page and we&apos;ll notify you the moment we detect
          it&apos;s down.
        </p>
        <p>
          Curious about the business side? See{" "}
          <Link href="/worth" className="text-signal hover:underline">
            what a website like {label} could be worth
          </Link>
          .
        </p>
      </section>

      {related.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-lg font-bold text-ink">
            {category ? "Other " + category.label.toLowerCase() + " sites" : "Similar sites"}
          </h2>
          <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {related.map((r) => (
              <li key={r.domain}>
                <Link
                  href={"/site/" + r.domain}
                  className="block rounded-lg border border-line bg-white/70 px-3 py-2 text-sm text-ink hover:border-signal/50 transition-colors truncate"
                >
                  Is {r.name !== r.domain ? r.name : r.domain} down?
                  <span className="block text-xs text-muted truncate">{r.domain}</span>
                </Link>
              </li>
            ))}
          </ul>
          {category && (
            <p className="mt-3 text-xs text-muted">
              See all{" "}
              <Link href={"/category/" + category.slug} className="text-signal hover:underline">
                {category.label} sites
              </Link>
              .
            </p>
          )}
        </section>
      )}

      <div id="embed" className="scroll-mt-20"><EmbedBadge domain={report.domain} /></div>
    </>
  );
}

/**
 * Awaits the popular-sites snapshot and recent activity feed, and renders
 * the right rail's live boxes. Its own Suspense boundary so a slow
 * popular-sites cache miss (100 checks) never holds up the report either.
 */
async function RailSection() {
  const [snapshot, feed] = await Promise.all([getPopularSnapshot(), getRecentActivity()]);
  return (
    <PopularStatusProvider initial={snapshot}>
      <ProblemsBox />
      <LiveFeed initial={feed} limit={FEED_SIZE} />
    </PopularStatusProvider>
  );
}

export default async function SiteDetailPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain: rawDomain } = await params;

  return (
    <AdRailLayout
      rail={<AdSlot className="min-h-[250px]" />}
      railBottom={
        <Suspense fallback={<RailSkeleton />}>
          <RailSection />
        </Suspense>
      }
    >
      <Link href="/" className="text-sm text-signal font-medium hover:underline">
        &larr; Check another site
      </Link>

      <Suspense fallback={<ReportSkeleton />}>
        <ReportSection rawDomain={rawDomain} />
      </Suspense>
      <AdSlot className="mt-12" />
    </AdRailLayout>
  );
}