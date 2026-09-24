/**
 * One row of a two-column section: main content left, 300px rail right.
 * Stack several RailRows to line rail boxes up with specific main-column
 * content (e.g. the homepage puts "Having problems" level with the site
 * cards). On mobile the rail simply stacks under the main content.
 * Use inside a max-w-6xl page container. No data or security logic.
 */

import type { ReactNode } from "react";

export default function RailRow({
  main,
  rail,
  className = "",
}: {
  main: ReactNode;
  rail?: ReactNode;
  className?: string;
}) {
  return (
    <div className={"lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8 " + className}>
      <div className="min-w-0">{main}</div>
      {rail && <aside className="mt-6 space-y-6 lg:mt-0">{rail}</aside>}
    </div>
  );
}
