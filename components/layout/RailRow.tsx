/**
 * One row of a two-column section: main content left, 300px rail right.
 * Stack several RailRows to line rail boxes up with specific main-column
 * content (e.g. the homepage puts "Having problems" level with the site
 * cards). On mobile the rail simply stacks under the main content.
 * Use inside a max-w-6xl page container. No data or security logic.
 */

import { isValidElement, type ReactNode } from "react";
import AdSlot from "@/components/AdSlot";
import { ADS_LIVE } from "@/lib/config/site";

export default function RailRow({
  main,
  rail,
  className = "",
}: {
  main: ReactNode;
  rail?: ReactNode;
  className?: string;
}) {
  // A rail that is just an <AdSlot /> is dropped until ads are live, so the
  // row doesn't reserve an empty 300px column. Other rail content stays.
  const railIsOnlyAd = isValidElement(rail) && rail.type === AdSlot;
  const shownRail = railIsOnlyAd && !ADS_LIVE ? null : rail;
  return (
    <div className={(shownRail ? "lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8 " : "") + className}>
      <div className="min-w-0">{main}</div>
      {shownRail && <aside className="mt-6 space-y-6 lg:mt-0">{shownRail}</aside>}
    </div>
  );
}
