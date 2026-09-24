/**
 * Two-column page layout: main content on the left, a 300px right rail
 * (desktop only, lg and up). On mobile the rail is hidden and pages should
 * place in-content ads and any rail widgets between sections instead.
 *
 *  - `railTop`: scrolls normally at the top of the rail (e.g. a live feed).
 *  - `rail`:    sticky below it, so the ad stays in view while scrolling.
 *
 * If your Header is sticky, raise `top-6` on the rail so it clears it.
 * Contains no data or security logic.
 */

import type { ReactNode } from "react";

export default function AdRailLayout({
  children,
  railTop,
  rail,
}: {
  children: ReactNode;
  railTop?: ReactNode;
  rail?: ReactNode;
}) {
  const hasRail = Boolean(railTop || rail);
  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8 py-8 sm:py-12 lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8">
      <div className="min-w-0">{children}</div>
      {hasRail && (
        <aside className="hidden lg:block space-y-6">
          {railTop}
          {rail && (
            <div className="sticky top-6 space-y-6" aria-label="Advertisement">
              {rail}
            </div>
          )}
        </aside>
      )}
    </div>
  );
}
