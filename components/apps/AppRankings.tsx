/**
 * US chart positions and ratings by country for the App Worth report.
 * A chart that couldn't be read shows "Couldn't check", never "Not ranked".
 * No data or security logic. Contains no secrets.
 */

import { formatCount, formatRank } from "@/lib/worth/engine/format";
import type { AppReport, ChartRanks } from "@/lib/apps/types";

const CHARTS: Array<{ key: keyof Omit<ChartRanks, "checked">; label: string }> = [
  { key: "topFree", label: "Top Free" },
  { key: "topPaid", label: "Top Paid" },
  { key: "topGrossing", label: "Top Grossing" },
];

export default function AppRankings({ report }: { report: AppReport }) {
  const { charts, countries } = report.signals;
  const maxCount = countries.reduce((m, c) => Math.max(m, c.ratingCount), 0);

  return (
    <section className="mt-10">
      <h2 className="font-display text-lg font-bold text-ink">Charts and ratings by country</h2>

      <div className="mt-3 grid grid-cols-3 gap-3">
        {CHARTS.map((c) => {
          const rank = charts[c.key];
          const checked = charts.checked[c.key];
          return (
            <div key={c.key} className="rounded-xl border border-line bg-surface px-3 py-3 sm:px-4">
              <p className="text-xs text-muted">US {c.label}</p>
              <p className={"mt-1 font-display text-xl sm:text-2xl font-bold tabular-nums " + (rank !== null ? "text-up" : "text-muted")}>
                {rank !== null ? formatRank(rank) : "–"}
              </p>
              <p className="text-xs text-muted">{rank !== null ? "of top 100" : checked ? "Not in top 100" : "Couldn't check"}</p>
            </div>
          );
        })}
      </div>

      {countries.length > 0 ? (
        <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full text-xs sm:text-sm tabular-nums">
            <thead>
              <tr className="border-b border-line text-muted">
                <th scope="col" className="py-3 pl-3 sm:pl-4 pr-2 text-left font-medium">Country</th>
                <th scope="col" className="py-3 px-2 text-right font-medium">Ratings</th>
                <th scope="col" className="py-3 px-2 text-right font-medium">Stars</th>
                <th scope="col" className="hidden sm:table-cell py-3 pl-2 pr-4 text-left font-medium w-2/5">
                  <span className="sr-only">Share</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {countries.map((c) => (
                <tr key={c.code} className="border-b border-line last:border-0">
                  <th scope="row" className="py-2.5 pl-3 sm:pl-4 pr-2 text-left font-medium text-ink">{c.label}</th>
                  <td className="py-2.5 px-2 text-right text-ink">{formatCount(c.ratingCount)}</td>
                  <td className="py-2.5 px-2 text-right text-ink">{c.rating !== null ? c.rating.toFixed(1) : "–"}</td>
                  <td className="hidden sm:table-cell py-2.5 pl-2 pr-4" aria-hidden="true">
                    <span className="block h-1.5 rounded-full bg-line">
                      <span className="block h-1.5 rounded-full bg-signal" style={{ width: maxCount > 0 ? Math.max(2, (c.ratingCount / maxCount) * 100) + "%" : "0%" }} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted">
          No ratings yet in the major App Store countries.
        </p>
      )}
      <p className="mt-2 text-xs text-muted leading-relaxed">
        About {formatCount(report.worldRatings)} ratings worldwide, estimated from these countries&apos; share of all App
        Store ratings.
      </p>
    </section>
  );
}
