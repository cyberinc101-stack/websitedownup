"use client";

/**
 * The headline of the Website Worth report: the site, its estimated value,
 * and the value range drawn as a band on a log scale with the midpoint
 * marked. The one animated moment on the page: the band opens out from the
 * midpoint once, and not at all for visitors who prefer reduced motion.
 *
 * UNTRUSTED DATA: iconUrl comes from the checked site (https-only, see
 * pageMeta.ts) and is only used as an <img> src.
 * Contains no secrets.
 */

import { useEffect, useState } from "react";
import { formatMoney, formatMoneyLong } from "@/lib/worth/engine/format";
import type { WorthReport } from "@/lib/worth/types";

function logPosition(value: number, min: number, max: number): number {
  const lo = Math.log10(Math.max(min, 1));
  const hi = Math.log10(Math.max(max, 1));
  if (hi <= lo) return 50;
  return ((Math.log10(Math.max(value, 1)) - lo) / (hi - lo)) * 100;
}

export default function ValueHero({ report, iconUrl }: { report: WorthReport; iconUrl: string | null }) {
  const [open, setOpen] = useState(false);
  const [iconFailed, setIconFailed] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setOpen(true));
    return () => window.cancelAnimationFrame(id);
  }, [report.domain]);

  const { low, mid, high } = report.value;
  // Pad the scale so the band never touches the edges.
  const scaleMin = low / 3;
  const scaleMax = high * 3;
  const left = logPosition(low, scaleMin, scaleMax);
  const right = logPosition(high, scaleMin, scaleMax);
  const marker = logPosition(mid, scaleMin, scaleMax);

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 sm:p-7">
      <div className="flex items-center gap-3">
        {iconUrl && !iconFailed ? (
          <img
            src={iconUrl}
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 rounded-md shrink-0 object-contain"
            referrerPolicy="no-referrer"
            onError={() => setIconFailed(true)}
          />
        ) : (
          <span className="h-9 w-9 rounded-md bg-line shrink-0 flex items-center justify-center font-display font-bold text-ink">
            {report.domain.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <p className="font-display font-bold text-ink truncate">{report.domain}</p>
          <p className="text-xs text-muted">Estimated website value</p>
        </div>
      </div>

      <p className="mt-6 font-display text-5xl sm:text-6xl font-bold tracking-tight text-ink leading-none tabular-nums">
        {formatMoneyLong(mid)}
      </p>

      <div className="mt-8" aria-hidden="true">
        <div className="relative h-2 rounded-full bg-line">
          <div
            className="absolute inset-y-0 rounded-full bg-signal opacity-30 motion-safe:transition-all motion-safe:duration-700 ease-out"
            style={{
              left: (open ? left : marker) + "%",
              right: 100 - (open ? right : marker) + "%",
            }}
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
            ? "Medium confidence: based on the site's position in public popularity rankings."
            : "Low confidence: this site isn't in the public popularity rankings, so its traffic is estimated from on-site signals."}{" "}
          <a href="#how-it-works" className="text-signal font-medium hover:underline">
            How this is calculated
          </a>
        </p>
        {report.majorBrand && (
          <p className="text-ink">
            This is one of the world&apos;s biggest sites. Its real business value is far beyond what its advertising
            potential suggests.
          </p>
        )}
      </div>
    </section>
  );
}
