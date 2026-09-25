"use client";

/**
 * The Website Worth tool: domain form plus the live report.
 *
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const domain = normalizeDomain(input);
    if (!isLikelyValidDomain(domain)) {
      setInputError("Enter a website address like example.com.");
      return;
    }
    setInputError(null);
    if (domain !== queryDomain) {
      router.push("/worth?domain=" + encodeURIComponent(domain), { scroll: false });
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row" noValidate>
        <label htmlFor="worth-domain" className="sr-only">
          Website address
        </label>
        <input
          id="worth-domain"
          type="text"
          inputMode="url"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="example.com"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          aria-invalid={inputError !== null}
          aria-describedby={inputError ? "worth-domain-error" : undefined}
          className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-4 py-3 text-ink placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-signal"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-xl bg-signal px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
        >
          {status === "loading" ? "Checking\u2026" : "Check worth"}
        </button>
      </form>
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
