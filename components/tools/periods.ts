/** Shared day/week/month/year expansion for the calculator tools. CLIENT-SAFE. */
import { DAYS_PER_MONTH } from "@/lib/worth/engine/format";
import type { PeriodFigures } from "@/lib/worth/types";

export function periods(monthly: number): PeriodFigures {
  const safe = Number.isFinite(monthly) && monthly > 0 ? monthly : 0;
  return { daily: safe / DAYS_PER_MONTH, weekly: (safe * 7) / DAYS_PER_MONTH, monthly: safe, yearly: safe * 12 };
}
