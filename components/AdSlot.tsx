/**
 * Ad container used across the site.
 *
 * Renders NOTHING until ads are live (publisher ID + ad slot ID both set —
 * see ADS_LIVE in lib/config/site.ts), so no empty "Ad slot" placeholders
 * show on the live site while AdSense is reviewing it. Once live, it shows a
 * responsive AdSense unit (components/AdUnit.tsx), labelled "Advertisement"
 * per AdSense policy (ads must be clearly distinguishable from content).
 */

import AdUnit from "@/components/AdUnit";
import { ADS_LIVE } from "@/lib/config/site";

export default function AdSlot({
  className = "",
  label = "Advertisement",
}: {
  className?: string;
  label?: string;
}) {
  if (!ADS_LIVE) return null;
  return (
    <div className={"flex flex-col items-center " + className}>
      <span className="text-[10px] uppercase tracking-wider text-muted/70 mb-1.5 shrink-0">{label}</span>
      <div className="flex-1 w-full min-h-[100px]">
        <AdUnit />
      </div>
    </div>
  );
}
