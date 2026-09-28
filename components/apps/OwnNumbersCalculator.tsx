"use client";

/**
 * "Use your own numbers": the most accurate mode, for app owners who know
 * their real monthly revenue. Works the same for Apple and Android.
 * No data or security logic. Contains no secrets.
 */

import { useMemo, useState } from "react";
import NumberField from "@/components/tools/NumberField";
import SelectField from "@/components/tools/SelectField";
import ResultTable from "@/components/tools/ResultTable";
import { valueFromOwnNumbers } from "@/lib/apps/engine/ownNumbers";
import { formatMoney } from "@/lib/worth/engine/format";

const TREND_OPTIONS = [
  { value: "rising", label: "Growing" },
  { value: "steady", label: "Steady" },
  { value: "falling", label: "Declining" },
  { value: "new", label: "Too new to tell (under 6 months)" },
];

export default function OwnNumbersCalculator() {
  const [ads, setAds] = useState("300");
  const [subs, setSubs] = useState("500");
  const [iap, setIap] = useState("100");
  const [costs, setCosts] = useState("150");
  const [age, setAge] = useState("2");
  const [trend, setTrend] = useState("steady");

  const result = useMemo(
    () =>
      valueFromOwnNumbers({
        adRevenue: parseFloat(ads),
        subscriptionRevenue: parseFloat(subs),
        purchaseRevenue: parseFloat(iap),
        costs: parseFloat(costs),
        ageYears: age === "" ? null : Math.max(0, parseFloat(age) || 0),
        trend,
      }),
    [ads, subs, iap, costs, age, trend]
  );

  return (
    <div className="mt-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField id="own-ads" label="Monthly ad revenue" prefix="$" value={ads} onChange={setAds} />
        <NumberField id="own-subs" label="Monthly subscription revenue" prefix="$" value={subs} onChange={setSubs} help="After the store's cut." />
        <NumberField id="own-iap" label="Monthly in-app purchase revenue" prefix="$" value={iap} onChange={setIap} help="After the store's cut." />
        <NumberField id="own-costs" label="Monthly running costs" prefix="$" value={costs} onChange={setCosts} help="Servers, tools, marketing, contractors." />
        <NumberField id="own-age" label="App age (years)" value={age} onChange={setAge} step="0.5" />
        <SelectField id="own-trend" label="Revenue trend, last few months" value={trend} onChange={setTrend} options={TREND_OPTIONS} />
      </div>

      {result ? (
        <>
          <div className="mt-6 rounded-2xl border border-line bg-surface p-5 sm:p-6">
            <p className="text-xs text-muted">Estimated sale value</p>
            <p className="mt-1 font-display text-4xl font-bold tracking-tight text-ink tabular-nums">{formatMoney(result.value.mid)}</p>
            <p className="mt-3 text-sm text-muted">
              Likely between <span className="text-ink font-medium">{formatMoney(result.value.low)}</span> and{" "}
              <span className="text-ink font-medium">{formatMoney(result.value.high)}</span>, at{" "}
              <span className="text-ink font-medium">{result.multiple}&times;</span> monthly profit
              {result.subscriptionShare >= 0.25 ? ", higher because subscription revenue recurs." : "."}
            </p>
          </div>
          <div className="mt-6">
            <ResultTable
              rows={[
                { label: "Revenue", figures: result.revenue, money: true },
                { label: "Profit", figures: result.profit, money: true },
              ]}
            />
          </div>
        </>
      ) : (
        <p className="mt-6 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted">
          Enter revenue above your running costs to see a value. Apps that don&apos;t make a profit are usually valued on
          their users or technology instead.
        </p>
      )}
    </div>
  );
}
