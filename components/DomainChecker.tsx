"use client";

/**
 * The domain search box. Runs a quick check through /api/check (no
 * diagnostics, so it's fast) and links to the full report page.
 * Takes a site name ("netflix") or an address, with suggestions
 * (components/shared/SiteSearchBox.tsx).
 * SECURITY: the API route applies the SSRF guard; nothing to do here.
 */

import { useState, FormEvent } from "react";
import Link from "next/link";
import { resolveSiteInput, SITE_INPUT_MESSAGE } from "@/lib/siteSuggest";
import SiteSearchBox, { SiteAddressTip } from "@/components/shared/SiteSearchBox";
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

  const [inputError, setInputError] = useState<string | null>(null);

  async function runCheck(domain: string) {
    setValue(domain);
    setInputError(null);
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/check?domain=" + encodeURIComponent(domain));
      const data: Result = await res.json();
      setResult(data);
      onChecked?.(domain, data.status);
    } catch {
      setResult({
        domain,
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

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    // Accepts an address, a known site's name ("Wells Fargo") or one word ("netflix" -> netflix.com).
    const domain = resolveSiteInput(value);
    if (!domain) {
      setInputError(SITE_INPUT_MESSAGE);
      return;
    }
    runCheck(domain);
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <SiteSearchBox
          id="domain-check"
          value={value}
          onChange={(v) => {
            setValue(v);
            if (inputError) setInputError(null);
          }}
          onPickDomain={(domain) => {
            if (!loading) runCheck(domain);
          }}
          currentDomain={result ? result.domain : null}
          invalid={inputError !== null}
          describedBy={inputError ? "domain-check-error" : undefined}
          placeholder="Website name or address"
          inputClassName="w-full h-13 px-4 py-3.5 rounded-xl border border-line bg-white text-base text-ink placeholder:text-muted/70 focus:border-signal focus:ring-2 focus:ring-signal/20 outline-none transition-shadow"
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
      <SiteAddressTip />
      {inputError && (
        <p id="domain-check-error" className="mt-2 text-sm text-ink" role="alert">
          {inputError}
        </p>
      )}

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
