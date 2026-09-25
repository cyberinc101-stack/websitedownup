"use client";

/**
 * RPM Calculator: the reference tool for the RPM metric itself. Two tabs:
 * work out your RPM from real earnings and pageviews, or work out likely
 * earnings from a target RPM. No data or security logic.
 */

import { useMemo, useState } from "react";
import NumberField from "./NumberField";
import ResultTable from "./ResultTable";
import { periods } from "./periods";
import { formatMoney } from "@/lib/worth/engine/format";

type Mode = "find-rpm" | "find-earnings";

export default function RpmCalculator() {
  const [mode, setMode] = useState<Mode>("find-rpm");
  const [earnings, setEarnings] = useState("150");
  const [pageviews, setPageviews] = useState("50000");
  const [rpm, setRpm] = useState("3.00");

  const rpmResult = useMemo(() => {
    const e = parseFloat(earnings);
    const p = parseFloat(pageviews);
    if (!Number.isFinite(e) || !Number.isFinite(p) || p <= 0) return null;
    return (e / p) * 1000;
  }, [earnings, pageviews]);

  const earningsResult = useMemo(() => {
    const p = parseFloat(pageviews);
    const r = parseFloat(rpm);
    if (!Number.isFinite(p) || !Number.isFinite(r) || p <= 0 || r < 0) return null;
    return periods((p / 1000) * r);
  }, [pageviews, rpm]);

  return (
    <div>
      <div className="mb-4 inline-flex rounded-full border border-line bg-surface p-1 text-sm">
        {(
          [
            ["find-rpm", "Find my RPM"],
            ["find-earnings", "Find my earnings"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            onClick={() => setMode(value)}
            className={
              "rounded-full px-3 py-1.5 font-medium transition-colors " +
              (mode === value ? "bg-signal text-white" : "text-muted hover:text-ink")
            }
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "find-rpm" ? (
        <div>
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField id="rpm-earnings" label="Monthly ad earnings" prefix="$" value={earnings} onChange={setEarnings} />
            <NumberField id="rpm-pageviews-1" label="Monthly pageviews" value={pageviews} onChange={setPageviews} />
          </div>
          {rpmResult !== null && (
            <div className="mt-6 rounded-2xl border border-line bg-surface p-5 sm:p-6">
              <p className="text-xs text-muted">Your page RPM</p>
              <p className="mt-1 font-display text-4xl font-bold tracking-tight text-ink tabular-nums">
                {formatMoney(rpmResult)}
              </p>
              <p className="mt-2 text-sm text-muted">Earnings per 1,000 pageviews.</p>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField id="rpm-pageviews-2" label="Monthly pageviews" value={pageviews} onChange={setPageviews} />
            <NumberField id="rpm-target" label="Target RPM" prefix="$" value={rpm} onChange={setRpm} />
          </div>
          {earningsResult && (
            <div className="mt-6">
              <ResultTable rows={[{ label: "Ad earnings", figures: earningsResult, money: true }]} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
