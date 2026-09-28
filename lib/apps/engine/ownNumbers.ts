/**
 * "Use your own numbers" valuation for app owners: real monthly revenue by
 * source, minus costs, times a multiple. Subscription revenue earns a
 * higher multiple because it recurs.
 * CLIENT-SAFE, pure. Contains no secrets.
 */

import { estimateMultiple, MAX_MULTIPLE, MIN_MULTIPLE, NEUTRAL_HEALTH } from "@/lib/worth/engine/multiple";
import { roundSig } from "@/lib/worth/engine/format";
import { periods } from "@/components/tools/periods";
import type { PeriodFigures } from "@/lib/worth/types";

export interface OwnNumbersInput {
  adRevenue: number;
  subscriptionRevenue: number;
  purchaseRevenue: number;
  costs: number;
  ageYears: number | null;
  trend: string;
}

export interface OwnNumbersResult {
  revenue: PeriodFigures;
  profit: PeriodFigures;
  multiple: number;
  subscriptionShare: number;
  value: { low: number; mid: number; high: number };
}

function clean(n: number): number {
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function valueFromOwnNumbers(input: OwnNumbersInput): OwnNumbersResult | null {
  const ads = clean(input.adRevenue);
  const subs = clean(input.subscriptionRevenue);
  const iap = clean(input.purchaseRevenue);
  const revenue = ads + subs + iap;
  const profit = revenue - clean(input.costs);
  if (revenue <= 0 || profit <= 0) return null;

  const subscriptionShare = subs / revenue;
  const bonus = subscriptionShare >= 0.5 ? 4 : subscriptionShare >= 0.25 ? 2 : 0;
  const base = estimateMultiple(input.ageYears, NEUTRAL_HEALTH, input.trend, false);
  const multiple = Math.max(MIN_MULTIPLE, Math.min(MAX_MULTIPLE, base + bonus));
  const mid = roundSig(profit * multiple, 3);

  return {
    revenue: periods(revenue),
    profit: periods(profit),
    multiple,
    subscriptionShare,
    value: { low: roundSig(mid * 0.7, 2), mid, high: roundSig(mid * 1.3, 2) },
  };
}
