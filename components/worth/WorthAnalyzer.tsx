"use client";

/**
 * The Website Worth tool: domain form plus the live report.
 *
 * The box takes a site name ("netflix") or an address, with suggestions
 * (components/shared/SiteSearchBox.tsx).
 * The domain lives in the URL (/worth?domain=example.com), so every report
 * is shareable and the back button works. On a new domain it requests the
 * site facts (/api/worth) and the slower speed test (/api/worth/speed) in
 * parallel, and rebuilds the report in the browser when the speed test
 * lands.
 *
 * CLIENT-ONLY. Contains no secrets.
 */

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isLikelyValidDomain, normalizeDomain } from "@/lib/checkSite";
import { resolveSiteInput, SITE_INPUT_MESSAGE } from "@/lib/siteSuggest";
import SiteSearchBox, { SiteAddressTip } from "@/components/shared/SiteSearchBox";
import { buildReport } from "@/lib/worth/engine/buildReport";
import WorthReportView from "./WorthReportView";
import type { SpeedStatus } from "./SiteFacts";
import type { SpeedResult, WorthSignals } from "@/lib/worth/types";

type LoadStatus = "idle" | "loading" | "done" | "error";

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const json: unknown = await res.json();
    if (json && typeof json === "object" && "error" in json && typeof (json as { error: unknown }).error === "string") {
      return (json as { error: string }).error;
    }
  } catch {
    // fall through
  }
  return fallback;
}

function ReportSkeleton() {
  return (
    <div className="mt-6 animate-pulse" aria-hidden="true">
      <div className="rounded-2xl border border-line bg-surface p-5 sm:p-7 space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-line" />
          <div className="space-y-2">
            <div className="h-4 w-40 rounded bg-line" />
            <div className="h-3 w-28 rounded bg-line" />
          </div>
        </div>
        <div className="h-14 w-64 rounded bg-line" />
        <div className="h-2 w-full rounded-full bg-line" />
        <div className="h-3 w-3/4 rounded bg-line" />
      </div>
      <div className="mt-8 h-40 rounded-xl bg-line" />
    </div>
  );
}

export default function WorthAnalyzer() {
  const router = useRouter();
  const params = useSearchParams();
  const queryDomain = normalizeDomain(params.get("domain") || "");

  const [input, setInput] = useState(queryDomain);
  const [inputError, setInputError] = useState<string | null>(null);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [signals, setSignals] = useState<WorthSignals | null>(null);
  const [speed, setSpeed] = useState<SpeedResult | null>(null);
  const [speedStatus, setSpeedStatus] = useState<SpeedStatus>("loading");

  useEffect(() => {
    setInput(queryDomain);
    setSignals(null);
    setSpeed(null);
    setError(null);
    if (!queryDomain || !isLikelyValidDomain(queryDomain)) {
      setStatus("idle");
      return;
    }

    const controller = new AbortController();
    const q = "?domain=" + encodeURIComponent(queryDomain);
    setStatus("loading");
    setSpeedStatus("loading");

    fetch("/api/worth" + q, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(await readError(res, "The check didn't finish. Try again in a moment."));
        const json = (await res.json()) as WorthSignals;
        setSignals(json);
        setStatus("done");
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "The check didn't finish. Try again in a moment.");
        setStatus("error");
      });

    fetch("/api/worth/speed" + q, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("speed");
        const json = (await res.json()) as SpeedResult;
        setSpeed(json);
        setSpeedStatus(json.ok ? "done" : "failed");
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setSpeedStatus("failed");
      });

    return () => controller.abort();
  }, [queryDomain]);

  const report = useMemo(
    () => (signals ? buildReport(signals, speedStatus === "done" ? speed : null) : null),
    [signals, speed, speedStatus]
  );

  function openDomain(domain: string) {
    setInputError(null);
    setInput(domain);
    if (domain !== queryDomain) {
      router.push("/worth?domain=" + encodeURIComponent(domain), { scroll: false });
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Accepts an address, a known site's name ("Wells Fargo") or one word ("netflix" -> netflix.com).
    const domain = resolveSiteInput(input);
    if (!domain) {
      setInputError(SITE_INPUT_MESSAGE);
      return;
    }
    openDomain(domain);
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row" noValidate>
        <SiteSearchBox
          id="worth-domain"
          value={input}
          onChange={(v) => {
            setInput(v);
            if (inputError) setInputError(null);
          }}
          onPickDomain={openDomain}
          currentDomain={queryDomain || null}
          invalid={inputError !== null}
          describedBy={inputError ? "worth-domain-error" : undefined}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-xl bg-signal px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
        >
          {status === "loading" ? "Checking\u2026" : "Check worth"}
        </button>
      </form>
      <SiteAddressTip />
      {inputError && (
        <p id="worth-domain-error" className="mt-2 text-sm text-ink" role="alert">
          {inputError}
        </p>
      )}

      <div aria-live="polite">
        {status === "loading" && <ReportSkeleton />}
        {status === "error" && error && (
          <div className="mt-6 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink" role="alert">
            {error}
          </div>
        )}
        {status === "done" && signals && !signals.reachable && signals.rank.current === null && (
          <div className="mt-6 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink" role="alert">
            We couldn&apos;t reach {signals.domain}. {signals.error} Check the address and try again.
          </div>
        )}
        {status === "done" && report && signals && (signals.reachable || signals.rank.current !== null) && (
          <WorthReportView report={report} signals={signals} speed={speed} speedStatus={speedStatus} />
        )}
      </div>
    </div>
  );
}

