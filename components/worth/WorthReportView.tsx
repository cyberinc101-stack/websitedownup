/**
 * Lays out a finished Website Worth report: value, traffic and earnings,
 * an in-content ad, health score, site facts and the estimate disclaimer.
 * (The page adds the next ad below the report, so none is needed here.) No data or security logic. Contains no secrets.
 */

import AdSlot from "@/components/AdSlot";
import ValueHero from "./ValueHero";
import PeriodTable from "./PeriodTable";
import HealthScore from "./HealthScore";
import SiteFacts, { type SpeedStatus } from "./SiteFacts";
import type { SpeedResult, WorthReport, WorthSignals } from "@/lib/worth/types";

export default function WorthReportView({
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
  return (
    <div className="mt-6">
      {signals.error && (
        <p className="mb-4 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink">
          {signals.error} The figures below use what could still be checked, so treat them as rough.
        </p>
      )}

      <ValueHero report={report} iconUrl={signals.page ? signals.page.iconUrl : null} />
      <PeriodTable report={report} />

      <AdSlot className="mt-8" />

      <HealthScore report={report} speedPending={speedStatus === "loading"} />
      <SiteFacts report={report} signals={signals} speed={speed} speedStatus={speedStatus} />

      <p className="mt-6 text-xs text-muted leading-relaxed">
        All figures are estimates based on public information, not the site&apos;s own analytics or accounts. Checked{" "}
        {new Date(report.checkedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}.
      </p>
    </div>
  );
}
