"use client";

/**
 * Headline of the App Worth report: the app, its estimated value and the
 * value range drawn as a band on a log scale (same design as the website
 * worth ValueHero). The band opens out once, not at all with reduced motion.
 *
 * UNTRUSTED DATA: name and developer come from the store listing and are
 * rendered as plain text. iconUrl is https-only from Apple's image host.
 * Contains no secrets.
 */

import { useEffect, useState } from "react";
import { formatMoney, formatMoneyLong } from "@/lib/worth/engine/format";
import type { AppReport } from "@/lib/apps/types";

function logPosition(value: number, min: number, max: number): number {
  const lo = Math.log10(Math.max(min, 1));
  const hi = Math.log10(Math.max(max, 1));
  if (hi <= lo) return 50;
  return ((Math.log10(Math.max(value, 1)) - lo) / (hi - lo)) * 100;
}

export function AppIcon({ name, iconUrl, size = "lg" }: { name: string; iconUrl: string | null; size?: "lg" | "sm" }) {
  const [failed, setFailed] = useState(false);
  const box = size === "lg" ? "h-12 w-12 rounded-xl" : "h-9 w-9 rounded-lg";
  if (iconUrl && !failed) {
    return (
      <img
        src={iconUrl}
        alt=""
        width={size === "lg" ? 48 : 36}
        height={size === "lg" ? 48 : 36}
        loading="lazy"
        className={box + " shrink-0 object-cover border border-line"}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <span className={box + " bg-line shrink-0 flex items-center justify-center font-display font-bold text-ink"}>
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

export default function AppValueHero({ report }: { report: AppReport }) {
  const l = report.signals.listing;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setOpen(true));
    return () => window.cancelAnimationFrame(id);
  }, [l.id]);

  const { low, mid, high } = report.value;
  const scaleMin = low / 3;
  const scaleMax = high * 3;
  const left = logPosition(low, scaleMin, scaleMax);
  const right = logPosition(high, scaleMin, scaleMax);
  const marker = logPosition(mid, scaleMin, scaleMax);

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 sm:p-7">
      <div className="flex items-center gap-3">
        <AppIcon name={l.name} iconUrl={l.iconUrl} />
        <div className="min-w-0">
          <p className="font-display font-bold text-ink truncate">{l.name}</p>
          <p className="text-xs text-muted truncate">
            {(l.developer ? l.developer + " · " : "") + "Estimated app value"}
          </p>
        </div>
      </div>

      <p className="mt-6 font-display text-5xl sm:text-6xl font-bold tracking-tight text-ink leading-none tabular-nums">
        {formatMoneyLong(mid)}
      </p>

      <div className="mt-8" aria-hidden="true">
        <div className="relative h-2 rounded-full bg-line">
          <div
            className="absolute inset-y-0 rounded-full bg-signal opacity-30 motion-safe:transition-all motion-safe:duration-700 ease-out"
            style={{ left: (open ? left : marker) + "%", right: 100 - (open ? right : marker) + "%" }}
          />
          <div
            className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-surface bg-signal shadow"
            style={{ left: marker + "%" }}
          />
        </div>
        <div className="relative mt-2 h-5 text-xs text-muted tabular-nums">
          <span className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: left + "%" }}>
            {formatMoney(low)}
          </span>
          <span className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: right + "%" }}>
            {formatMoney(high)}
          </span>
        </div>
      </div>
      <p className="sr-only">
        Estimated range {formatMoney(low)} to {formatMoney(high)}.
      </p>

      <div className="mt-5 grid gap-1.5 text-sm text-muted">
        <p>
          Likely between <span className="text-ink font-medium">{formatMoney(low)}</span> and{" "}
          <span className="text-ink font-medium">{formatMoney(high)}</span>, valued at{" "}
          <span className="text-ink font-medium">{report.multipleMonths}&times;</span> estimated monthly profit.
        </p>
        <p>
          {report.confidence === "medium"
            ? "Medium confidence: this app is in a US top chart, which anchors the estimate."
            : "Low confidence: Apple doesn't publish downloads or revenue, so this is estimated from ratings, category and update history."}{" "}
          <a href="#how-it-works" className="text-signal font-medium hover:underline">
            How this is calculated
          </a>
        </p>
        {!l.ratingCount && (
          <p className="text-ink">This app has no public ratings yet, so there&apos;s very little to go on.</p>
        )}
        {report.majorBrand && (
          <p className="text-ink">
            This is one of the biggest apps in the world. Its real business value is far beyond what this estimate
            suggests.
          </p>
        )}
      </div>
    </section>
  );
}
