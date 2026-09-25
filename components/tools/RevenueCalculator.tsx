"use client";

/**
 * Website Revenue Calculator: pageviews and niche -> estimated display-ad
 * revenue per day/week/month/year, using the same niche RPM data as the
 * domain analyzer (data/worth/niches.ts). No data or security logic.
 */

import { useMemo, useState } from "react";
import NumberField from "./NumberField";
import SelectField from "./SelectField";
import ResultTable from "./ResultTable";
import { periods } from "./periods";
import { NICHE_OPTIONS, nicheRpmRange } from "./nicheOptions";
import { formatMoney } from "@/lib/worth/engine/format";

export default function RevenueCalculator() {
  const [pageviews, setPageviews] = useState("50000");
  const [niche, setNiche] = useState("general");

  const result = useMemo(() => {
    const monthlyPageviews = parseFloat(pageviews);
    if (!Number.isFinite(monthlyPageviews) || monthlyPageviews <= 0) return null;
    const [low, high] = nicheRpmRange(niche);
    const mid = (low + high) / 2;
    return { rpmLow: low, rpmHigh: high, revenue: periods((monthlyPageviews / 1000) * mid) };
  }, [pageviews, niche]);

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          id="revenue-pageviews"
          label="Monthly pageviews"
          value={pageviews}
          onChange={setPageviews}
          help="Not sure? Pageviews are usually 2 to 3 times your visitor count."
        />
        <SelectField id="revenue-niche" label="Site niche" value={niche} onChange={setNiche} options={NICHE_OPTIONS} />
      </div>

      {result && (
        <div className="mt-6 space-y-3">
          <ResultTable rows={[{ label: "Ad revenue", figures: result.revenue, money: true }]} />
          <p className="text-xs text-muted">
            Based on a typical range of {formatMoney(result.rpmLow)} to {formatMoney(result.rpmHigh)} per 1,000
            pageviews for this niche.
          </p>
        </div>
      )}
    </div>
  );
}
