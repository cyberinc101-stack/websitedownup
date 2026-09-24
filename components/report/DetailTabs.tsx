"use client";

/**
 * Collapsible detail tabs under the cards: Redirects, Headers, DNS records.
 * Closed by default to keep the report compact; click a tab to open it,
 * click it again to close.
 * UNTRUSTED DATA: header values and DNS records come from third parties
 * and are rendered as plain text.
 */

import { useState, type ReactNode } from "react";
import type { Diagnostics } from "@/lib/diagnostics/types";
import { DASH } from "./format";

type TabId = "redirects" | "headers" | "dns";

function Rows({ rows }: { rows: Array<[string, ReactNode]> }) {
  return (
    <dl className="space-y-1.5">
      {rows.map(([label, value]) => (
        <div key={label} className="flex flex-col sm:flex-row sm:gap-3">
          <dt className="text-muted sm:w-44 shrink-0">{label}</dt>
          <dd className="text-ink break-all">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function list(values: string[]): ReactNode {
  if (values.length === 0) return DASH;
  return values.map((v) => <div key={v}>{v}</div>);
}

export default function DetailTabs({ d }: { d: Diagnostics }) {
  const [open, setOpen] = useState<TabId | null>(null);
  const { http, dns } = d;
  const redirectCount = Math.max(http.hops.length - 1, 0);

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: "redirects", label: "Redirects (" + redirectCount + ")" },
    { id: "headers", label: "Headers (" + http.headers.length + ")" },
    { id: "dns", label: "DNS records" },
  ];

  return (
    <div className="rounded-lg border border-line bg-white/70">
      <div className="flex flex-wrap gap-1 p-1.5" role="tablist">
        {tabs.map((t) => {
          const active = open === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setOpen(active ? null : t.id)}
              className={
                "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors " +
                (active ? "bg-signal text-white" : "text-muted hover:text-ink hover:bg-white")
              }
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {open && (
        <div className="border-t border-line p-3 font-mono text-xs" role="tabpanel">
          {open === "redirects" &&
            (redirectCount === 0 ? (
              <p className="font-sans text-muted">No redirects. The address loaded directly.</p>
            ) : (
              <ol className="space-y-1.5">
                {http.hops.map((hop, i) => (
                  <li key={i + "-" + hop.url} className="flex gap-3">
                    <span className="text-muted tabular shrink-0">{hop.statusCode}</span>
                    <span className="text-ink break-all">{hop.url}</span>
                  </li>
                ))}
              </ol>
            ))}

          {open === "headers" &&
            (http.headers.length === 0 ? (
              <p className="font-sans text-muted">No response headers were captured.</p>
            ) : (
              <Rows rows={http.headers.map((h) => [h.name, h.value])} />
            ))}

          {open === "dns" && (
            <Rows
              rows={[
                ["A (IPv4)", list(dns.ipv4)],
                ["AAAA (IPv6)", list(dns.ipv6)],
                ["MX (mail)", list(dns.mx)],
                ["NS (name servers)", list(dns.ns)],
                ["SPF", dns.spf ?? "Not set"],
                ["DMARC policy", dns.dmarcPolicy ?? "Not set"],
                ["HSTS", http.hsts ? "Enabled" : "Not set"],
              ]}
            />
          )}
        </div>
      )}
    </div>
  );
}
