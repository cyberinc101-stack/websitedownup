"use client";

/**
 * The App Worth tool (App Store apps only): two modes.
 *  - Look up an app: type its name (matches come from /api/app-search as
 *    you type) or paste an App Store link. The app lives in the URL
 *    (/app-worth?app=<id>&name=<name>), so every report is shareable and
 *    the back button works. `name` is carried along purely so the page's
 *    share-card (app/app-worth/page.tsx's generateMetadata) can show the
 *    app's real name without an extra lookup; the actual report data
 *    still comes from /api/app-worth by id.
 *    Facts come from /api/app-worth; the report is built in the browser
 *    (lib/apps/engine). Google Play links get a clear message.
 *  - Use your own numbers: for owners who know their real revenue.
 * CLIENT-ONLY. Contains no secrets.
 */

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { parseAppInput, ANDROID_MESSAGE, INPUT_MESSAGE } from "@/lib/apps/parseAppInput";
import { estimateApp } from "@/lib/apps/engine/estimateApp";
import AppReportView from "./AppReportView";
import OwnNumbersCalculator from "./OwnNumbersCalculator";
import SuggestInput, { type Suggestion } from "@/components/shared/SuggestInput";
import { formatCount } from "@/lib/worth/engine/format";
import type { AppSearchResponse, AppSearchResult, AppSignals, AppLookupResponse } from "@/lib/apps/types";

type Mode = "lookup" | "own";
type Status = "idle" | "loading" | "done" | "error";

const SEARCH_DELAY_MS = 350;
const MIN_TERM = 2;

function isLookupResponse(v: unknown): v is AppLookupResponse {
  return typeof v === "object" && v !== null && "ok" in v;
}

function isSearchResponse(v: unknown): v is AppSearchResponse {
  return typeof v === "object" && v !== null && "ok" in v;
}

function toSuggestion(a: AppSearchResult): Suggestion {
  const bits: string[] = [];
  if (a.developer) bits.push(a.developer);
  if (a.rating !== null && a.ratingCount) bits.push(a.rating.toFixed(1) + " ★ (" + formatCount(a.ratingCount) + ")");
  bits.push(a.price > 0 ? "$" + a.price.toFixed(2) : "Free");
  return { key: a.id, title: a.name, subtitle: bits.join(" · "), iconUrl: a.iconUrl };
}

/** Text that should be searched by name (not a link, id or Android package). */
function isNameSearch(text: string): boolean {
  const t = text.trim();
  return t.length >= MIN_TERM && parseAppInput(t) === null;
}

function FindLinkTip() {
  return (
    <details className="mt-2 text-xs text-muted">
      <summary className="cursor-pointer select-none hover:text-ink">
        App Store apps only (iPhone and iPad). <span className="text-signal">How do I find the link?</span>
      </summary>
      <div className="mt-2 space-y-2 rounded-xl border border-line bg-surface px-4 py-3 leading-relaxed">
        <p>
          <span className="font-medium text-ink">Easiest:</span> just type the app&apos;s name above and pick it from the list.
        </p>
        <p>
          <span className="font-medium text-ink">On iPhone or iPad:</span> open the App Store, go to the app, tap the Share
          button (the square with an arrow), tap <span className="text-ink">Copy Link</span>, then paste it here.
        </p>
        <p>
          <span className="font-medium text-ink">On a computer:</span> find the app on apps.apple.com and copy the address
          from your browser&apos;s address bar.
        </p>
        <p>Works for iPhone and iPad apps on the App Store only. Android apps aren&apos;t supported.</p>
      </div>
    </details>
  );
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
  /** Name of the app on screen, shown in the box instead of its id. */
  const [loadedName, setLoadedName] = useState<string | null>(null);

  const [results, setResults] = useState<AppSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchedTerm, setSearchedTerm] = useState("");
  const [searchFailed, setSearchFailed] = useState(false);
  const searchCache = useRef(new Map<string, AppSearchResult[]>());

  useEffect(() => {
    setInput(queryApp);
    setSignals(null);
    setLoadedName(null);
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
          setLoadedName(json.signals.listing.name);
          setInput(json.signals.listing.name);
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

  // Name search: wait until typing pauses, reuse earlier answers.
  const term = input.trim().toLowerCase();
  const wantsSearch = isNameSearch(input) && input !== loadedName;
  useEffect(() => {
    if (!wantsSearch) {
      setResults([]);
      setSearching(false);
      return;
    }
    const cached = searchCache.current.get(term);
    if (cached) {
      setResults(cached);
      setSearchFailed(false);
      setSearchedTerm(term);
      setSearching(false);
      return;
    }
    setSearching(true);
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      fetch("/api/app-search?q=" + encodeURIComponent(term), { signal: controller.signal })
        .then(async (res) => {
          const json: unknown = await res.json().catch(() => null);
          if (isSearchResponse(json) && json.ok) {
            searchCache.current.set(term, json.results);
            setResults(json.results);
            setSearchFailed(false);
          } else {
            setResults([]);
            setSearchFailed(true);
          }
          setSearchedTerm(term);
          setSearching(false);
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setResults([]);
          setSearchFailed(true);
          setSearchedTerm(term);
          setSearching(false);
        });
    }, SEARCH_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [term, wantsSearch]);

  const report = useMemo(() => (signals ? estimateApp(signals) : null), [signals]);
  const suggestions = useMemo(() => (wantsSearch ? results.map(toSuggestion) : []), [results, wantsSearch]);

  /**
   * `name` is carried in the URL purely for the share card (see the file
   * comment above) â€” the lookup itself only ever uses `id`.
   */
  function openApp(id: string, name: string | null) {
    setInputError(null);
    if (name) setInput(name);
    if (id !== queryApp) {
      const query = "/app-worth?app=" + encodeURIComponent(id) + (name ? "&name=" + encodeURIComponent(name) : "");
      router.push(query, { scroll: false });
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = input.trim();
    if (text && text === loadedName) return;
    const parsed = parseAppInput(text);
    if (parsed && parsed.kind === "google") {
      setInputError(ANDROID_MESSAGE);
      return;
    }
    if (parsed && parsed.kind === "apple") {
      openApp(parsed.id, null);
      return;
    }
    if (!isNameSearch(text)) {
      setInputError("Type an app name or paste an App Store link.");
      return;
    }
    // Typed a name and pressed Enter: open the best match.
    let matches = searchedTerm === term ? results : searchCache.current.get(term);
    if (!matches) {
      setSearching(true);
      try {
        const res = await fetch("/api/app-search?q=" + encodeURIComponent(term));
        const json: unknown = await res.json().catch(() => null);
        matches = isSearchResponse(json) && json.ok ? json.results : [];
        if (isSearchResponse(json) && !json.ok) {
          setInputError(json.error);
          setSearching(false);
          return;
        }
        searchCache.current.set(term, matches);
      } catch {
        matches = [];
      }
      setSearching(false);
    }
    if (matches.length === 0) {
      setInputError("No App Store apps match “" + text + "”. Check the spelling or paste the App Store link.");
      return;
    }
    openApp(matches[0].id, matches[0].name);
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
            <SuggestInput
              id="app-input"
              label="App name or App Store link"
              value={input}
              onChange={(v) => {
                setInput(v);
                if (inputError) setInputError(null);
              }}
              onPick={(sug) => openApp(sug.key, sug.title)}
              suggestions={suggestions}
              loading={wantsSearch && searching}
              emptyText={
                wantsSearch && searchedTerm === term
                  ? searchFailed
                    ? "Search isn't answering right now. Paste the App Store link instead."
                    : "No matching App Store apps."
                  : null
              }
              placeholder="App name or App Store link"
              invalid={inputError !== null}
              describedBy={inputError ? "app-input-error" : undefined}
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="rounded-xl bg-signal px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90"
            >
              {status === "loading" ? "Checking…" : "Check worth"}
            </button>
          </form>
          <FindLinkTip />
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
