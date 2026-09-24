/**
 * Load timing graph: one stacked horizontal bar splitting the page load into
 * redirects, DNS, connect, TLS, server wait and download.
 * Pure presentation (a plain CSS bar, no chart library), no data or security logic.
 */

import type { TimingInfo } from "@/lib/diagnostics/types";

// Class names are written out in full so Tailwind can find them.
const SEGMENTS: ReadonlyArray<{ key: keyof TimingInfo; label: string; color: string }> = [
  { key: "redirectMs", label: "Redirects", color: "bg-ink/30" },
  { key: "dnsMs", label: "DNS", color: "bg-signal/35" },
  { key: "connectMs", label: "Connect", color: "bg-signal/55" },
  { key: "tlsMs", label: "TLS", color: "bg-signal/75" },
  { key: "waitMs", label: "Server", color: "bg-signal" },
  { key: "downloadMs", label: "Download", color: "bg-up" },
];

export default function TimingBar({ timing }: { timing: TimingInfo }) {
  const parts = SEGMENTS.map((s) => ({ ...s, value: timing[s.key] })).filter((p) => p.value > 0);
  const total = parts.reduce((sum, p) => sum + p.value, 0);
  if (total === 0) return null;

  return (
    <div className="rounded-lg border border-line bg-white/70 p-3">
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span className="font-semibold text-ink">Load timing</span>
        <span className="text-muted">
          Total <span className="font-mono tabular text-ink">{total} ms</span> from our server
        </span>
      </div>

      <div
        className="mt-2 flex h-3 w-full overflow-hidden rounded-full bg-line/60"
        role="img"
        aria-label={parts.map((p) => p.label + " " + p.value + " ms").join(", ")}
      >
        {parts.map((p) => (
          <div
            key={p.key}
            className={p.color}
            style={{ width: Math.max((p.value / total) * 100, 1.5) + "%" }}
            title={p.label + ": " + p.value + " ms"}
          />
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {parts.map((p) => (
          <span key={p.key} className="inline-flex items-center gap-1.5">
            <span className={"h-2 w-2 rounded-sm " + p.color} aria-hidden="true" />
            {p.label}
            <span className="font-mono tabular text-ink">{p.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
