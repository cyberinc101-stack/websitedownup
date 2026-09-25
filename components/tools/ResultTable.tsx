/**
 * Shows one or more money/count figures across day/week/month/year, the
 * same layout the domain-analyzer report uses (components/worth/PeriodTable.tsx),
 * so every calculator on the site presents figures consistently.
 * No data or security logic.
 */

import { formatCount, formatMoney } from "@/lib/worth/engine/format";
import type { PeriodFigures } from "@/lib/worth/types";

const PERIODS: Array<{ key: keyof PeriodFigures; label: string }> = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "yearly", label: "Yearly" },
];

export default function ResultTable({
  rows,
}: {
  rows: Array<{ label: string; figures: PeriodFigures; money: boolean }>;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface">
      <table className="w-full text-xs sm:text-sm sm:min-w-[420px] tabular-nums">
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
                  className={
                    "py-3 px-1.5 sm:px-3 text-right last:pr-3 sm:last:pr-4 " +
                    (p.key === "monthly" ? "font-semibold text-ink" : "text-ink")
                  }
                >
                  {row.money ? formatMoney(row.figures[p.key]) : formatCount(row.figures[p.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
