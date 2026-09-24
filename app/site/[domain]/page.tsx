import Link from "next/link";
import { headers } from "next/headers";
import { after } from "next/server";
import type { Metadata } from "next";
import { normalizeDomain } from "@/lib/checkSite";
import { getCachedSiteReport } from "@/lib/server/siteReport";
import { clientIpFrom, recordCheck } from "@/lib/activity/checkActivity";
import SiteStatusPanel from "@/components/SiteStatusPanel";
import AdSlot from "@/components/AdSlot";
import AdRailLayout from "@/components/layout/AdRailLayout";
import { SITE_NAME } from "@/lib/config/site";

export const dynamic = "force-dynamic";
// DNS, TLS and port checks need Node APIs, so this must not run on the Edge runtime.
export const runtime = "nodejs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domain: string }>;
}): Promise<Metadata> {
  const { domain: rawDomain } = await params;
  const domain = normalizeDomain(rawDomain);
  return {
    title: "Is " + domain + " down? \u2014 " + SITE_NAME,
    description: `Live status check for ${domain}. See if it's up right now, response time, SSL and domain expiry, and what to try if it won't load for you.`,
  };
}

export default async function SiteDetailPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain: rawDomain } = await params;
  const report = await getCachedSiteReport(rawDomain);

  // Count this visit in the live feed / most checked lists. Runs after the
  // page is sent; bots and crawlers are skipped inside recordCheck.
  const requestHeaders = await headers();
  const ip = clientIpFrom(requestHeaders);
  const userAgent = requestHeaders.get("user-agent");
  after(() =>
    recordCheck(
      { domain: report.domain, status: report.status, responseTimeMs: report.responseTimeMs },
      { ip, userAgent }
    )
  );

  return (
    <AdRailLayout rail={<AdSlot className="min-h-[600px]" />}>
      <Link href="/" className="text-sm text-signal font-medium hover:underline">
        &larr; Check another site
      </Link>

      <div className="mt-4">
        <SiteStatusPanel initial={report} />
      </div>

      <AdSlot className="mt-8" />

      <section className="mt-8 text-sm text-muted leading-relaxed space-y-4">
        <h2 className="font-display text-lg font-bold text-ink">
          {report.status === "up"
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
    </AdRailLayout>
  );
}
