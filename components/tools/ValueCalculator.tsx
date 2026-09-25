"use client";

/**
 * Website Value Calculator: the site owner enters their own monthly profit
 * (more accurate than any outside estimate), and this works out a sale
 * value using the same multiple logic as the domain analyzer
 * (lib/worth/engine/multiple.ts), so the two tools never disagree.
 * No data or security logic.
 */

import { useMemo, useState } from "react";
import NumberField from "./NumberField";
import SelectField from "./SelectField";
import { estimateMultiple, NEUTRAL_HEALTH } from "@/lib/worth/engine/multiple";
import { formatMoney, roundSig } from "@/lib/worth/engine/format";

const TREND_OPTIONS = [
  { value: "rising", label: "Growing" },
  { value: "steady", label: "Steady" },
  { value: "falling", label: "Declining" },
  { value: "new", label: "Too new to tell (under 6 months)" },
];

export default function ValueCalculator() {
  const [profit, setProfit] = useState("1000");
  const [age, setAge] = useState("3");
  const [trend, setTrend] = useState("steady");

  const result = useMemo(() => {
    const monthlyProfit = parseFloat(profit);
    if (!Number.isFinite(monthlyProfit) || monthlyProfit <= 0) return null;
    const ageYears = age === "" ? null : Math.max(0, parseFloat(age) || 0);
    const multiple = estimateMultiple(ageYears, NEUTRAL_HEALTH, trend, false);
    const mid = roundSig(monthlyProfit * multiple, 3);
    return {
      multiple,
      low: roundSig(mid * 0.7, 2),
      mid,
      high: roundSig(mid * 1.3, 2),
      annualProfit: monthlyProfit * 12,
    };
  }, [profit, age, trend]);

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          id="value-profit"
          label="Average monthly profit"
          prefix="$"
          value={profit}
          onChange={setProfit}
          help="Revenue minus hosting, tools, content and any other running costs."
        />
        <NumberField id="value-age" label="Site age (years)" value={age} onChange={setAge} step="0.5" />
        <div className="sm:col-span-2">
          <SelectField id="value-trend" label="Traffic trend, last few months" value={trend} onChange={setTrend} options={TREND_OPTIONS} />
        </div>
      </div>

      {result && (
        <div className="mt-6 rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <p className="text-xs text-muted">Estimated sale value</p>
          <p className="mt-1 font-display text-4xl font-bold tracking-tight text-ink tabular-nums">
            {formatMoney(result.mid)}
          </p>
          <p className="mt-3 text-sm text-muted">
            Likely between <span className="text-ink font-medium">{formatMoney(result.low)}</span> and{" "}
            <span className="text-ink font-medium">{formatMoney(result.high)}</span>, at{" "}
            <span className="text-ink font-medium">{result.multiple}&times;</span> monthly profit (
            {formatMoney(result.annualProfit)} a year).
          </p>
        </div>
      )}
    </div>
  );
}
