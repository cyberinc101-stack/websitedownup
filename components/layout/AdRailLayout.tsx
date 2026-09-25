/**
 * Two-column page layout: main content on the left, a 300px right rail
 * (desktop only, lg and up). On mobile the rail is hidden and pages should
 * place in-content ads and any rail widgets between sections instead.
 *
 *  - `railTop`:    scrolls normally at the top of the rail (e.g. a live feed).
 *  - `rail`:       sticky below it (aria-label="Advertisement"), so the ad
 *                  stays in view while scrolling.
 *  - `railBottom`: scrolls normally after the sticky ad -- for widgets that
 *                  aren't ads (e.g. Having problems / Recently checked on
 *                  the site report page), so they aren't announced as part
 *                  of the ad region and simply follow it down the page.
 *
 * If your Header is sticky, raise `top-6` on the rail so it clears it.
 * Contains no data or security logic.
 */

import type { ReactNode } from "react";

export default function AdRailLayout({
  children,
  railTop,
  rail,
  railBottom,
}: {
  children: ReactNode;
  railTop?: ReactNode;
  rail?: ReactNode;
  railBottom?: ReactNode;
}) {
  const hasRail = Boolean(railTop || rail || railBottom);
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
          {railBottom && <div className="space-y-6">{railBottom}</div>}
        </aside>
      )}
    </div>
  );
}