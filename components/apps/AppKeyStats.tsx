/**
 * Tiles with the app's headline numbers: downloads, active users, revenue
 * per download and per user, lifetime revenue, ratings. All estimates
 * except ratings, which are public counts.
 * No data or security logic. Contains no secrets.
 */

import { formatCount, formatMoney } from "@/lib/worth/engine/format";
import type { AppReport } from "@/lib/apps/types";

function money(n: number): string {
  if (n > 0 && n < 0.01) return "<$0.01";
  return formatMoney(n);
}

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-display text-xl sm:text-2xl font-bold text-ink tabular-nums leading-tight">{value}</p>
      {note && <p className="mt-0.5 text-xs text-muted leading-snug">{note}</p>}
    </div>
  );
}

export default function AppKeyStats({ report }: { report: AppReport }) {
  const l = report.signals.listing;
  const dl = report.lifetimeDownloads;
  const stickiness = report.monthlyActiveUsers > 0 ? Math.round((report.dailyActiveUsers / report.monthlyActiveUsers) * 100) : 0;

  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-bold text-ink">Key stats</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Lifetime downloads" value={formatCount(dl.mid)} note={formatCount(dl.low) + " to " + formatCount(dl.high)} />
        <Tile label="Monthly active users" value={formatCount(report.monthlyActiveUsers)} />
        <Tile label="Daily active users" value={formatCount(report.dailyActiveUsers)} note={stickiness + "% of monthly users"} />
        <Tile label="Downloads per day" value={formatCount(report.newDownloads.daily)} />
        <Tile label="Revenue per download" value={money(report.revenuePerDownload)} note="Over the app's lifetime" />
        <Tile label="Revenue per user" value={money(report.revenuePerUser)} note="Per active user, per month" />
        <Tile label="Lifetime revenue" value={formatMoney(report.lifetimeRevenue)} note="Since release" />
        <Tile label="Value per user" value={money(report.valuePerUser)} note="Value / monthly users" />
        <Tile
          label="Rating"
          value={l.rating !== null ? l.rating.toFixed(1) + " ★" : "–"}
          note={l.ratingCount ? formatCount(l.ratingCount) + " US ratings" : "Not rated yet"}
        />
        <Tile label="Ratings worldwide" value={formatCount(report.worldRatings)} note="Estimated, all countries" />
        <Tile label="Valuation multiple" value={report.multipleMonths + "×"} note="Months of profit" />
        <Tile label="Profit margin" value={Math.round(report.profitMargin * 100) + "%"} note="After running costs" />
      </div>
    </section>
  );
}
