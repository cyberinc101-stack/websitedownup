"use client";

/**
 * The App Worth tool (App Store apps only): two modes.
 *  - Look up an app: paste an App Store link. The app lives in the URL
 *    (/app-worth?app=...), so every report is shareable and the back button
 *    works. Facts come from /api/app-worth; the report is built in the
 *    browser (lib/apps/engine). Google Play links get a clear message.
 *  - Use your own numbers: for owners who know their real revenue.
 * CLIENT-ONLY. Contains no secrets.
 */

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { parseAppInput, ANDROID_MESSAGE, INPUT_MESSAGE } from "@/lib/apps/parseAppInput";
import { estimateApp } from "@/lib/apps/engine/estimateApp";
import AppReportView from "./AppReportView";
import OwnNumbersCalculator from "./OwnNumbersCalculator";
import type { AppSignals, AppLookupResponse } from "@/lib/apps/types";

type Mode = "lookup" | "own";
type Status = "idle" | "loading" | "done" | "error";

function isLookupResponse(v: unknown): v is AppLookupResponse {
  return typeof v === "object" && v !== null && "ok" in v;
}

function Skeleton() {
  return (
    <div className="mt-6 animate-pulse" aria-hidden="true">
      <div className="rounded-2xl border border-line bg-surface p-5 sm:p-7 space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-line" />
          <div className="space-y-2">
            <div className="h-4 w-40 rounded bg-line" />
            <div className="h-3 w-28 rounded bg-line" />
          </div>
        </div>
        <div className="h-14 w-64 rounded bg-line" />
        <div className="h-3 w-3/4 rounded bg-line" />
      </div>
      <div className="mt-8 h-32 rounded-xl bg-line" />
    </div>
  );
}

export default function AppWorthTool() {
  const router = useRouter();
  const params = useSearchParams();
  const queryApp = (params.get("app") || "").trim();

  const [mode, setMode] = useState<Mode>("lookup");
  const [input, setInput] = useState(queryApp);
  const [inputError, setInputError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [signals, setSignals] = useState<AppSignals | null>(null);

  useEffect(() => {
    setInput(queryApp);
    setSignals(null);
    setError(null);
    const parsed = queryApp ? parseAppInput(queryApp) : null;
    if (!parsed) {
      setStatus("idle");
      return;
    }
    if (parsed.kind === "google") {
      setError(ANDROID_MESSAGE);
      setStatus("error");
      return;
    }
    const controller = new AbortController();
    setStatus("loading");
    fetch("/api/app-worth?app=" + encodeURIComponent(queryApp), { signal: controller.signal })
      .then(async (res) => {
        const json: unknown = await res.json().catch(() => null);
        if (!isLookupResponse(json)) throw new Error("The lookup didn't finish. Try again in a moment.");
        if (json.ok) {
          setSignals(json.signals);
          setStatus("done");
        } else {
          throw new Error(json.error);
        }
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "The lookup didn't finish. Try again in a moment.");
        setStatus("error");
      });
    return () => controller.abort();
  }, [queryApp]);

  const report = useMemo(() => (signals ? estimateApp(signals) : null), [signals]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = parseAppInput(input);
    if (!parsed) {
      setInputError(INPUT_MESSAGE);
      return;
    }
    if (parsed.kind === "google") {
      setInputError(ANDROID_MESSAGE);
      return;
    }
    setInputError(null);
    if (input.trim() !== queryApp) router.push("/app-worth?app=" + encodeURIComponent(input.trim()), { scroll: false });
  }

  const tab = (value: Mode, label: string) => (
    <button
      type="button"
      aria-pressed={mode === value}
      onClick={() => setMode(value)}
      className={
        "rounded-full px-3 py-1.5 font-medium transition-colors " +
        (mode === value ? "bg-signal text-white" : "text-muted hover:text-ink")
      }
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="mb-4 inline-flex rounded-full border border-line bg-surface p-1 text-sm" role="group" aria-label="Mode">
        {tab("lookup", "Look up an app")}
        {tab("own", "Use your own numbers")}
      </div>

      {mode === "own" ? (
        <OwnNumbersCalculator />
      ) : (
        <>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row" noValidate>
            <label htmlFor="app-input" className="sr-only">
              App Store link
            </label>
            <input
              id="app-input"
              type="text"
              inputMode="url"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder="Paste an App Store link, e.g. apps.apple.com/app/id284882215"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-invalid={inputError !== null}
              aria-describedby={inputError ? "app-input-error" : undefined}
              className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-4 py-3 text-ink placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-signal"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="rounded-xl bg-signal px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {status === "loading" ? "Checking…" : "Check worth"}
            </button>
          </form>
          <p className="mt-2 text-xs text-muted">
            Works for iPhone and iPad apps on the App Store only. Android apps aren&apos;t supported.
          </p>
          {inputError && (
            <p id="app-input-error" className="mt-2 text-sm text-ink" role="alert">
              {inputError}
            </p>
          )}

          <div aria-live="polite">
            {status === "loading" && <Skeleton />}
            {status === "error" && error && (
              <div className="mt-6 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink" role="alert">
                {error}
              </div>
            )}
            {report && status === "done" && <AppReportView report={report} />}
          </div>
        </>
      )}
    </div>
  );
}
