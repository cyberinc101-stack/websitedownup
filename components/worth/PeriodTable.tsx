/**
 * Visitors, pageviews and ad revenue per day, week, month and year.
 * Scrolls sideways inside its own box on narrow screens.
 * No data or security logic. Contains no secrets.
 */

import { formatCount, formatMoney } from "@/lib/worth/engine/format";
import type { PeriodFigures, WorthReport } from "@/lib/worth/types";

const PERIODS: Array<{ key: keyof PeriodFigures; label: string }> = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "yearly", label: "Yearly" },
];

export default function PeriodTable({ report }: { report: WorthReport }) {
  const rows: Array<{ label: string; figures: PeriodFigures; money: boolean }> = [
    { label: "Visitors", figures: report.visitors, money: false },
    { label: "Pageviews", figures: report.pageviews, money: false },
    { label: "Ad revenue", figures: report.adRevenue, money: true },
  ];
  const [rpmLow, rpmHigh] = report.niche.rpm;

  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-bold text-ink">Traffic and earnings</h2>
      <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full text-xs sm:text-sm sm:min-w-[480px] tabular-nums">
          <thead>
            <tr className="border-b border-line text-muted">
              <th scope="col" className="py-3 pl-3 sm:pl-4 pr-1 sm:pr-2 text-left font-medium">
                Estimated
              </th>
              {PERIODS.map((p) => (
                <th key={p.key} scope="col" className="py-3 px-1.5 sm:px-3 text-right font-medium">
                  {p.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-line last:border-0">
                <th scope="row" className="py-3 pl-3 sm:pl-4 pr-1 sm:pr-2 text-left font-medium text-ink">
                  {row.label}
                </th>
                {PERIODS.map((p) => (
                  <td
                    key={p.key}
                    className={"py-3 px-1.5 sm:px-3 text-right last:pr-3 sm:last:pr-3 " + (p.key === "monthly" ? "font-semibold text-ink" : "text-ink")}
                  >
                    {row.money ? formatMoney(row.figures[p.key]) : formatCount(row.figures[p.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted leading-relaxed">
        Ad revenue is what this traffic could earn from display ads in the {report.niche.label.toLowerCase()} niche, at
        about {formatMoney(rpmLow)} to {formatMoney(rpmHigh)} per 1,000 pageviews. Monthly visitors likely fall between{" "}
        {formatCount(report.visitorRange.low)} and {formatCount(report.visitorRange.high)}.
      </p>
    </section>
  );
}
