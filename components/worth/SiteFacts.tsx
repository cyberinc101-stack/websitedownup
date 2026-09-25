/**
 * The factual side of the Website Worth report: domain age, popularity
 * rank and trend, speed, niche, monetization, social profiles and
 * detected technology.
 *
 * UNTRUSTED DATA: nothing here is text from the checked site. Technology
 * and social network names come from our own fixed lists.
 * Contains no secrets.
 */

import { formatAge, formatDate, formatMoney, formatRank } from "@/lib/worth/engine/format";
import type { SpeedResult, WorthReport, WorthSignals } from "@/lib/worth/types";

export type SpeedStatus = "loading" | "done" | "failed";

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{children}</dd>
    </div>
  );
}

function listOr(items: string[], empty: string): string {
  return items.length > 0 ? items.join(", ") : empty;
}

export default function SiteFacts({
  report,
  signals,
  speed,
  speedStatus,
}: {
  report: WorthReport;
  signals: WorthSignals;
  speed: SpeedResult | null;
  speedStatus: SpeedStatus;
}) {
  const reg = signals.registration;
  const rank = signals.rank;
  const age = formatAge(report.domainAgeYears);

  const stack = signals.tech.filter((t) => t.category === "CMS" || t.category === "Framework" || t.category === "Store");
  const hosting = signals.tech.filter((t) => t.category === "CDN" || t.category === "Server");
  const analytics = signals.tech.filter((t) => t.category === "Analytics");

  let speedText: string;
  if (speedStatus === "loading") speedText = "Testing on mobile\u2026";
  else if (speed && speed.ok && speed.performance !== null) {
    speedText = speed.performance + "/100 on mobile";
    if (speed.lcpMs !== null) speedText += ", main content in " + (speed.lcpMs / 1000).toFixed(1) + "s";
  } else if (signals.waitMs !== null) {
    speedText = "Server responded in " + signals.waitMs + " ms";
  } else speedText = "Not available";

  return (
    <section className="mt-10">
      <h2 className="font-display text-lg font-bold text-ink">Site facts</h2>
      <dl className="mt-3 grid gap-x-8 rounded-2xl border border-line bg-surface px-4 sm:px-5 sm:grid-cols-2 divide-y divide-line sm:divide-y-0">
        <Fact label="Domain age">
          {age ? (
            <>
              {age}
              <span className="text-muted">
                {reg.registeredAt ? ", registered " + formatDate(reg.registeredAt) : ", based on first sighting online"}
              </span>
            </>
          ) : (
            "Not published for this domain"
          )}
        </Fact>
        <Fact label="First seen online">{formatDate(signals.firstSeen) ?? "No record found"}</Fact>
        <Fact label="Popularity rank">
          {rank.current !== null ? (
            <>
              {formatRank(rank.current)} worldwide
              {rank.countryRank !== null && rank.countryTld && (
                <span className="block text-muted">
                  {formatRank(rank.countryRank)} among .{rank.countryTld} sites
                </span>
              )}
            </>
          ) : rank.listSize > 0 ? (
            "Outside the top " + rank.listSize.toLocaleString("en-US")
          ) : (
            "Not available"
          )}
        </Fact>
        <Fact label="Traffic trend">{report.trend.label}</Fact>
        <Fact label="Mobile friendly">
          {report.mobileFriendly === null ? "Couldn't check" : report.mobileFriendly ? "Yes, responsive layout" : "No mobile viewport set"}
        </Fact>
        <Fact label="Page speed">{speedText}</Fact>
        <Fact label="Niche">
          {report.niche.label}
          <span className="block text-muted">
            About {formatMoney(report.niche.rpm[0])} to {formatMoney(report.niche.rpm[1])} per 1,000 pageviews
          </span>
        </Fact>
        <Fact label="Monetization detected">{listOr(report.monetizationDetected, "None detected")}</Fact>
        <Fact label="Social profiles linked">{listOr(signals.page ? signals.page.socialProfiles : [], "None linked")}</Fact>
        <Fact label="Built with">{listOr(stack.map((t) => t.name), "Not identified")}</Fact>
        <Fact label="Hosting and server">{listOr(hosting.map((t) => t.name), "Not identified")}</Fact>
        <Fact label="Analytics">{listOr(analytics.map((t) => t.name), "None detected")}</Fact>
      </dl>
    </section>
  );
}
