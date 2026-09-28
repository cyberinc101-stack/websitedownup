/**
 * Earnings and growth per day, week, month and year for the App Worth
 * report, using the shared ResultTable so every tool looks the same.
 * No data or security logic. Contains no secrets.
 */

import ResultTable from "@/components/tools/ResultTable";
import { formatCount, formatMoney } from "@/lib/worth/engine/format";
import type { AppReport } from "@/lib/apps/types";

export default function AppPeriods({ report }: { report: AppReport }) {
  const rate = Math.round(report.commissionRate * 100);
  const paid = report.signals.listing.price > 0;

  return (
    <>
      <section className="mt-8">
        <h2 className="font-display text-lg font-bold text-ink">Revenue and profit</h2>
        <div className="mt-3">
          <ResultTable
            rows={[
              { label: "Customer spending", figures: report.consumerSpend, money: true },
              { label: "Apple's " + rate + "% cut", figures: report.appleCommission, money: true },
              { label: "Revenue", figures: report.revenue, money: true },
              { label: "Profit", figures: report.profit, money: true },
            ]}
          />
        </div>
        <p className="mt-2 text-xs text-muted leading-relaxed">
          Customer spending is what users pay in total. Apple keeps {rate}%
          {rate === 15 ? " (developers earning under $1M a year pay the lower rate)" : ""}; the rest is the developer&apos;s
          revenue. Profit takes off about {100 - Math.round(report.profitMargin * 100)}% for running costs. Based on{" "}
          {formatCount(report.monthlyActiveUsers)} monthly active users in the {report.categoryLabel.toLowerCase()} category
          {paid
            ? ", with about " + Math.round(report.upfrontShare * 100) + "% of revenue from the " + formatMoney(report.signals.listing.price) + " price."
            : "."}
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-bold text-ink">Downloads and ratings</h2>
        <div className="mt-3">
          <ResultTable
            rows={[
              { label: "New downloads", figures: report.newDownloads, money: false },
              { label: "New ratings", figures: report.newRatings, money: false },
            ]}
          />
        </div>
        <p className="mt-2 text-xs text-muted leading-relaxed">{report.basis}</p>
      </section>
    </>
  );
}
