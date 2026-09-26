/**
 * Real, accumulating uptime history for this exact domain, built from every
 * check we have actually run against it -- never fabricated or
 * estimated. A domain checked for the first time simply shows that instead
 * of a made-up percentage.
 * Pure presentation, no data or security logic.
 */

import type { UptimeStats } from "@/lib/server/domainHistory";
import { formatDate, plural } from "./format";

function toneFor(percent: number | null): string {
  if (percent === null) return "text-muted";
  if (percent >= 99) return "text-up";
  if (percent >= 95) return "text-ink";
  return "text-down";
}

export default function UptimeHistoryCard({
  domain,
  stats,
}: {
  domain: string;
  stats: UptimeStats;
}) {
  if (stats.totalChecks === 0) {
    return (
      <section className="rounded-lg border border-line bg-white/70 p-4">
        <h2 className="font-display text-sm font-bold text-ink mb-1">Uptime history</h2>
        <p className="text-xs text-muted leading-relaxed">
          This is the first time we&apos;ve checked {domain}. Come back after a few
          more checks and we&apos;ll start showing its real uptime record here.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-line bg-white/70 p-4">
      <h2 className="font-display text-sm font-bold text-ink mb-2">Uptime history</h2>
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 mb-2">
        <div>
          <span className={"text-2xl font-bold " + toneFor(stats.uptimePercent)}>
            {stats.uptimePercent}%
          </span>
          <span className="text-xs text-muted ml-1.5">uptime</span>
        </div>
        <div className="text-xs text-muted">
          Based on {plural(stats.totalChecks, "check")} since{" "}
          <span className="text-ink font-medium">{formatDate(stats.firstCheckedAt)}</span>
        </div>
      </div>
      <div className="text-xs text-muted space-y-0.5">
        {stats.lastDownAt ? (
          <p>
            Last seen down: <span className="text-ink">{formatDate(stats.lastDownAt)}</span>
          </p>
        ) : (
          <p>No downtime recorded in our checks so far.</p>
        )}
        {stats.avgResponseTimeMs !== null && (
          <p>
            Average response time across these checks:{" "}
            <span className="text-ink">{stats.avgResponseTimeMs} ms</span>
          </p>
        )}
      </div>
    </section>
  );
}
