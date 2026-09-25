"use client";

/**
 * AdSense Revenue Calculator: works from the mechanics AdSense actually
 * bills on (ad units shown, click-through rate, cost per click) rather
 * than a niche RPM lookup, so it answers a different question to
 * RevenueCalculator: "given these ad settings, what would I earn". Also
 * shows the resulting RPM so it connects to RpmCalculator.
 * No data or security logic.
 */

import { useMemo, useState } from "react";
import NumberField from "./NumberField";
import ResultTable from "./ResultTable";
import { periods } from "./periods";
import { formatCount } from "@/lib/worth/engine/format";

export default function AdsenseCalculator() {
  const [pageviews, setPageviews] = useState("50000");
  const [unitsPerPage, setUnitsPerPage] = useState("2");
  const [ctr, setCtr] = useState("1.5");
  const [cpc, setCpc] = useState("0.30");

  const result = useMemo(() => {
    const mp = parseFloat(pageviews);
    const units = parseFloat(unitsPerPage);
    const ctrPct = parseFloat(ctr);
    const cpcValue = parseFloat(cpc);
    if (![mp, units, ctrPct, cpcValue].every((n) => Number.isFinite(n) && n >= 0) || mp <= 0) return null;

    const impressions = mp * units;
    const clicks = impressions * (ctrPct / 100);
    const earnings = clicks * cpcValue;
    const impliedRpm = mp > 0 ? (earnings / mp) * 1000 : 0;
    return { impressions, clicks, earnings: periods(earnings), impliedRpm };
  }, [pageviews, unitsPerPage, ctr, cpc]);

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField id="adsense-pageviews" label="Monthly pageviews" value={pageviews} onChange={setPageviews} />
        <NumberField
          id="adsense-units"
          label="Ad units per page"
          value={unitsPerPage}
          onChange={setUnitsPerPage}
          step="1"
          help="Most sites show 2 to 4 without hurting the reader experience."
        />
        <NumberField
          id="adsense-ctr"
          label="Estimated click-through rate"
          suffix="%"
          value={ctr}
          onChange={setCtr}
          help="Typical display-ad CTR is 0.5% to 2%."
        />
        <NumberField
          id="adsense-cpc"
          label="Estimated cost per click"
          prefix="$"
          value={cpc}
          onChange={setCpc}
          help="Varies widely by niche; finance and insurance sit much higher than entertainment."
        />
      </div>

      {result && (
        <div className="mt-6 space-y-3">
          <ResultTable rows={[{ label: "AdSense earnings", figures: result.earnings, money: true }]} />
          <p className="text-xs text-muted">
            About {formatCount(result.impressions)} monthly ad impressions and {formatCount(result.clicks)} clicks,
            for a page RPM near ${result.impliedRpm.toFixed(2)}.
          </p>
        </div>
      )}
    </div>
  );
}
