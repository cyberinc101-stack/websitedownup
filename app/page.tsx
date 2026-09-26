import { after } from "next/server";
import HomeChecker from "@/components/HomeChecker";
import AdSlot from "@/components/AdSlot";
import RailRow from "@/components/layout/RailRow";
import AlertBar from "@/components/home/AlertBar";
import ProblemsBox from "@/components/home/ProblemsBox";
import LiveFeed from "@/components/home/LiveFeed";
import PopularSitesExplorer from "@/components/home/PopularSitesExplorer";
import { PopularStatusProvider } from "@/components/home/PopularStatusProvider";
import FaqSection from "@/components/home/FaqSection";
import StatusGuide from "@/components/home/StatusGuide";
import { getPopularSnapshot, getProblemsSnapshot } from "@/lib/server/popularStatus";
import { getRecentActivity, runMonitorTick } from "@/lib/activity/checkActivity";
import { SITE_NAME } from "@/lib/config/site";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// A popular-sites refresh checks 100 sites; give it room to finish.
export const maxDuration = 60;

const FEED_SIZE = 10;

export default async function HomePage() {
  const [snapshot, feed] = await Promise.all([getPopularSnapshot(), getRecentActivity()]);
  after(runMonitorTick);
  // Warm the wider "Having problems" cache in the background, after the
  // response has already been sent, so it never delays this page load and
  // is often already ready by the time ProblemsBox fetches it client-side.
  after(async () => {
    try {
      await getProblemsSnapshot();
    } catch {
      // Best-effort warm-up only; ProblemsBox will fetch fresh on its own.
    }
  });

  return (
    <PopularStatusProvider initial={snapshot}>
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

        <StatusGuide />

        <FaqSection />

        <AdSlot className="mt-12" />
      </div>
    </PopularStatusProvider>
  );
}