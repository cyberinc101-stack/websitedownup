"use client";

/**
 * Website Traffic Value Calculator: what your organic traffic would cost
 * if you had to buy it as paid search clicks instead. This is a different
 * question to the revenue calculators (which estimate ad earnings from
 * showing ads); it estimates the cost equivalent of ranking organically.
 * Selecting a niche fills in a suggested average cost-per-click, built from
 * the same niche data as the rest of the site, but the visitor can edit it
 * since real CPC varies a lot by exact keyword.
 * No data or security logic.
 */

import { useEffect, useMemo, useState } from "react";
import NumberField from "./NumberField";
import SelectField from "./SelectField";
import ResultTable from "./ResultTable";
import { periods } from "./periods";
import { NICHE_OPTIONS, nicheSearchCpcMid } from "./nicheOptions";

export default function TrafficValueCalculator() {
  const [visitors, setVisitors] = useState("20000");
  const [niche, setNiche] = useState("general");
  const [cpc, setCpc] = useState(() => nicheSearchCpcMid("general").toFixed(2));
  const [cpcTouched, setCpcTouched] = useState(false);

  useEffect(() => {
    if (!cpcTouched) setCpc(nicheSearchCpcMid(niche).toFixed(2));
  }, [niche, cpcTouched]);

  const result = useMemo(() => {
    const v = parseFloat(visitors);
    const c = parseFloat(cpc);
    if (!Number.isFinite(v) || v <= 0 || !Number.isFinite(c) || c < 0) return null;
    return periods(v * c);
  }, [visitors, cpc]);

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField id="traffic-visitors" label="Monthly organic visitors" value={visitors} onChange={setVisitors} />
        <SelectField
          id="traffic-niche"
          label="Site niche"
          value={niche}
          onChange={(v) => {
            setNiche(v);
            setCpcTouched(false);
          }}
          options={NICHE_OPTIONS}
        />
        <div className="sm:col-span-2">
          <NumberField
            id="traffic-cpc"
            label="Average cost per click for your keywords"
            prefix="$"
            value={cpc}
            onChange={(v) => {
              setCpc(v);
              setCpcTouched(true);
            }}
            help="Filled in from the selected niche; edit it if you know your actual keyword CPCs."
          />
        </div>
      </div>

      {result && (
        <div className="mt-6 space-y-3">
          <ResultTable rows={[{ label: "Traffic value", figures: result, money: true }]} />
          <p className="text-xs text-muted">
            What this traffic would cost per month if you paid for every visit through search ads instead of
            ranking organically for it.
          </p>
        </div>
      )}
    </div>
  );
}
