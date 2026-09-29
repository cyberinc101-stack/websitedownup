/**
 * Lays out a finished App Worth report, in the same order as the website
 * worth report: a share row, value, key stats, earnings per period, an
 * in-content ad, health, charts and countries, app facts, then the
 * estimate disclaimer.
 * No data or security logic. Contains no secrets.
 */

import AdSlot from "@/components/AdSlot";
import ShareButton from "@/components/shared/ShareButton";
import AppValueHero from "./AppValueHero";
import AppKeyStats from "./AppKeyStats";
import AppPeriods from "./AppPeriods";
import AppHealth from "./AppHealth";
import AppRankings from "./AppRankings";
import AppFacts from "./AppFacts";
import { SITE_NAME } from "@/lib/config/site";
import type { AppReport } from "@/lib/apps/types";

export default function AppReportView({ report }: { report: AppReport }) {
  const l = report.signals.listing;
  return (
    <div className="mt-6">
      <div className="mb-3 flex justify-end">
        <ShareButton
          title={l.name + " app worth — " + SITE_NAME}
          text={l.name + "'s estimated value, downloads and revenue."}
        />
      </div>

      <AppValueHero report={report} />
      <AppKeyStats report={report} />
      <AppPeriods report={report} />

      <AdSlot className="mt-8" />

      <AppHealth report={report} />
      <AppRankings report={report} />

      <AdSlot className="mt-8" />

      <AppFacts report={report} />

      <p className="mt-6 text-xs text-muted leading-relaxed">
        All figures are estimates from the public App Store listing, not the app&apos;s own sales data. Checked{" "}
        {new Date(report.signals.checkedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}.{" "}
        <a href={"/go/app/" + l.id} target="_blank" rel="noopener nofollow" className="text-signal hover:underline">
          View on the App Store
        </a>
      </p>
    </div>
  );
}
