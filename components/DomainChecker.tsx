"use client";

/**
 * The domain search box. Runs a quick check through /api/check (no
 * diagnostics, so it's fast) and links to the full report page.
 * SECURITY: the API route applies the SSRF guard; nothing to do here.
 */

import { useState, FormEvent } from "react";
import Link from "next/link";
import { normalizeDomain } from "@/lib/checkSite";
import StatusBadge from "./StatusBadge";

interface Result {
  domain: string;
  status: "up" | "down";
  statusCode: number | null;
  responseTimeMs: number | null;
  checkedAt: string;
  error?: string;
}

export default function DomainChecker({
  onChecked,
}: {
  onChecked?: (domain: string, status: "up" | "down") => void;
}) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/check?domain=" + encodeURIComponent(trimmed));
      const data: Result = await res.json();
      setResult(data);
      onChecked?.(normalizeDomain(trimmed), data.status);
    } catch {
      setResult({
        domain: normalizeDomain(trimmed),
        status: "down",
        statusCode: null,
        responseTimeMs: null,
        checkedAt: new Date().toISOString(),
        error: "Something went wrong running the check.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter a domain, e.g. facebook.com"
          className="flex-1 h-13 px-4 py-3.5 rounded-xl border border-line bg-white text-base text-ink placeholder:text-muted/70 focus:border-signal focus:ring-2 focus:ring-signal/20 outline-none transition-shadow"
          aria-label="Domain to check"
        />
        <button
          type="submit"
          disabled={loading}
          className="h-13 px-6 py-3.5 rounded-xl bg-signal text-white font-semibold hover:bg-signal-dark active:scale-[0.98] disabled:opacity-60 transition-all whitespace-nowrap"
        >
          {loading ? "Checking\u2026" : "Check"}
        </button>
      </form>

      {/* signature sweep line: a live "ping" indicator while a check is in flight */}
      <div className="mt-3 h-0.5 w-full overflow-hidden rounded-full bg-line/60 relative">
        {loading && (
          <span className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-signal animate-sweep" />
        )}
      </div>

      {result && (
        <div
          className={
            "mt-5 rounded-xl border p-5 flex items-center justify-between gap-4 flex-wrap " +
            (result.status === "up" ? "bg-up-bg border-up-line" : "bg-down-bg border-down-line")
          }
        >
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <StatusBadge state={result.status} />
              <span className="font-display font-bold text-ink">{result.domain}</span>
            </div>
            <p className="text-sm text-muted">
              {result.status === "up"
                ? "We were able to reach this site just now."
                : result.error ?? "We could not reach this site just now."}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right font-mono text-sm text-muted tabular">
              {result.responseTimeMs !== null && <div>{result.responseTimeMs} ms</div>}
              {result.statusCode !== null && <div>HTTP {result.statusCode}</div>}
            </div>
            {!result.error?.startsWith("That doesn't look like") && (
              <Link
                href={"/site/" + result.domain}
                className="rounded-lg bg-white border border-line px-3 py-2 text-sm font-semibold text-ink hover:border-signal/50 transition-colors whitespace-nowrap"
              >
                Full report
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
