"use client";

/**
 * The full site report shown on /site/[domain].
 * Layout (top to bottom): status header (with save star), overview (logo,
 * preview, key facts), load timing bar, four diagnostic cards, collapsible
 * detail tabs. The individual pieces live in components/report/.
 *
 * Data comes from lib/server/siteReport.ts (first render) and
 * /api/check?diagnostics=1 ("Check again"). Checks are recorded for the
 * public live feed server-side. No security logic here.
 */

import { useState } from "react";
import StatusBadge from "./StatusBadge";
import SiteOverview from "./report/SiteOverview";
import SiteLogo from "./shared/SiteLogo";
import SaveButton from "./shared/SaveButton";
import TimingBar from "./report/TimingBar";
import DiagnosticCards from "./report/DiagnosticCards";
import DetailTabs from "./report/DetailTabs";
import type { Diagnostics } from "@/lib/diagnostics/types";
import { SITE_NAME } from "@/lib/config/site";

interface Result {
  domain: string;
  status: "up" | "down";
  statusCode: number | null;
  responseTimeMs: number | null;
  checkedAt: string;
  error?: string;
  diagnostics?: Diagnostics | null;
}

export default function SiteStatusPanel({ initial }: { initial: Result }) {
  const [result, setResult] = useState<Result>(initial);
  const [loading, setLoading] = useState(false);

  async function recheck() {
    setLoading(true);
    try {
      const res = await fetch(
        "/api/check?domain=" + encodeURIComponent(result.domain) + "&diagnostics=1"
      );
      const data: Result = await res.json();
      setResult(data);
    } finally {
      setLoading(false);
    }
  }

  const d = result.diagnostics ?? null;
  const page = d?.http.page ?? null;

  return (
    <div
      className={
        "rounded-2xl border p-4 sm:p-6 space-y-4 " +
        (result.status === "up" ? "bg-up-bg border-up-line" : "bg-down-bg border-down-line")
      }
    >
      {/* Status header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <SiteLogo domain={result.domain} iconUrl={page?.iconUrl} className="h-11 w-11 rounded-lg shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl sm:text-2xl font-bold text-ink truncate">
                {result.domain}
              </h1>
              <StatusBadge state={loading ? "checking" : result.status} />
              <SaveButton domain={result.domain} className="scale-125" />
            </div>
            <p className="text-sm text-muted truncate">
              {result.status === "up"
                ? SITE_NAME + " reached this site successfully."
                : result.error ?? SITE_NAME + " could not reach this site."}
            </p>
          </div>
        </div>
        <button
          onClick={recheck}
          disabled={loading}
          className="rounded-lg bg-white border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-signal/50 disabled:opacity-60 transition-colors shrink-0"
        >
          {loading ? "Checking\u2026" : "Check again"}
        </button>
      </div>

      <SiteOverview result={result} page={page} finalUrl={d?.http.finalUrl ?? null} />

      {d?.http.timing && <TimingBar timing={d.http.timing} />}

      {d && <DiagnosticCards d={d} />}

      {d && <DetailTabs d={d} />}
    </div>
  );
}