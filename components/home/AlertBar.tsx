"use client";

/**
 * Outage alert strip at the top of the homepage. Appears only when one or
 * more of the top 50 popular sites is down, with each site's icon.
 * Sites marked `unverified` (failing, but not seen working in the last 48
 * hours, so almost certainly blocking automated checks) never trigger it.
 * Updates live (every 30s) from PopularStatusProvider, so it appears and
 * clears without a page reload.
 * Pure presentation, no security logic.
 */

import Link from "next/link";
import SiteLogo from "@/components/shared/SiteLogo";
import { usePopularSnapshot } from "./PopularStatusProvider";

const ALERT_TOP_N = 50;
const MAX_NAMED = 6;

export default function AlertBar() {
  const { sites } = usePopularSnapshot();
  const down = sites.filter((s) => s.rank <= ALERT_TOP_N && s.state === "down" && s.unverified !== true);
  if (down.length === 0) return null;

  const named = down.slice(0, MAX_NAMED);
  const extra = down.length - named.length;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-down-line bg-down-bg px-4 py-2.5 text-sm"
    >
      <span className="inline-flex items-center gap-1.5 font-semibold text-down">
        <span className="h-2 w-2 rounded-full bg-down animate-pulseDot" aria-hidden="true" />
        Outage alert
      </span>
      <span className="text-ink">
        {down.length === 1 ? "1 top site is" : down.length + " top sites are"} having problems:
      </span>
      {named.map((s) => (
        <Link
          key={s.domain}
          href={"/site/" + s.domain}
          className="inline-flex items-center gap-1.5 rounded-md bg-white/80 border border-down-line px-2 py-0.5 font-semibold text-ink hover:border-down transition-colors"
        >
          <SiteLogo domain={s.domain} className="h-4 w-4 rounded-sm" />
          {s.name}
        </Link>
      ))}
      {extra > 0 && (
        <a href="#down" className="text-down font-semibold hover:underline">
          +{extra} more
        </a>
      )}
    </div>
  );
}
