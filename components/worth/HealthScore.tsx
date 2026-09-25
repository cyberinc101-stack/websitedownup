/**
 * The Website Health Score: overall score, the biggest opportunity with
 * first steps, then all nine categories. Each category opens (native
 * <details>, works without JavaScript) to show exactly which checks passed.
 *
 * Colour follows the site's existing up/slow/down palette (scoreColor.ts),
 * the same one StatusBadge and the popular-sites grid use, so a "Strong"
 * score is the same green as an "Up" site elsewhere on the site.
 * No data or security logic. Contains no secrets.
 */

import { scoreTone, scoreWord, TONE_CLASS, UNCHECKED_CLASS } from "./scoreColor";
import type { WorthReport } from "@/lib/worth/types";

const RING_RADIUS = 34;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

export default function HealthScore({ report, speedPending }: { report: WorthReport; speedPending: boolean }) {
  const { overall, categories, opportunity } = report.health;
  const overallClass = TONE_CLASS[scoreTone(overall)];
  const sorted = categories.slice().sort((a, b) => b.weight - a.weight);

  return (
    <section className="mt-10">
      <h2 className="font-display text-lg font-bold text-ink">Website health</h2>

      <div className="mt-3 rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <div className="flex items-center gap-5">
          <svg
            width="84"
            height="84"
            viewBox="0 0 84 84"
            className={"shrink-0 " + overallClass}
            role="img"
            aria-label={"Health score " + overall + " out of 100"}
          >
            <circle cx="42" cy="42" r={RING_RADIUS} fill="none" stroke="currentColor" strokeWidth="8" className="text-line" />
            <circle
              cx="42"
              cy="42"
              r={RING_RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={RING_LENGTH}
              strokeDashoffset={RING_LENGTH * (1 - overall / 100)}
              transform="rotate(-90 42 42)"
            />
            <text x="42" y="48" textAnchor="middle" className="font-display" fontSize="22" fontWeight="700" fill="currentColor">
              {overall}
            </text>
          </svg>
          <div>
            <p className="font-display text-xl font-bold text-ink">
              <span className={overallClass}>{scoreWord(overall)}</span>{" "}
              <span className="text-muted font-normal text-base">{overall}/100</span>
            </p>
            <p className="text-sm text-muted">
              {!report.pageRead
                ? "Based only on the areas that could be checked, because the homepage couldn't be read."
                : speedPending
                  ? "Running the full mobile speed test. Scores will update when it finishes."
                  : "Weighted across nine areas that affect value."}
            </p>
          </div>
        </div>

        {opportunity && (
          <div className="mt-5 border-l-4 border-signal pl-4">
            <p className="font-display font-bold text-ink">Your biggest opportunity: {opportunity.label.toLowerCase()}</p>
            <p className="mt-1 text-sm text-muted leading-relaxed">{opportunity.summary}</p>
            {opportunity.steps.length > 0 && (
              <ol className="mt-2 list-decimal pl-5 space-y-1 text-sm text-ink">
                {opportunity.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            )}
          </div>
        )}
      </div>

      <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-surface">
        {sorted.map((cat) => {
          const toneClass = cat.checked ? TONE_CLASS[scoreTone(cat.score)] : UNCHECKED_CLASS;
          const pending = speedPending && cat.id === "performance";
          return (
            <li key={cat.id}>
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 sm:px-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal">
                  <span className="w-28 shrink-0 text-sm font-medium text-ink">{cat.label}</span>
                  <span className="relative h-1.5 flex-1 rounded-full bg-line" aria-hidden="true">
                    {cat.checked && (
                      <span
                        className={"absolute inset-y-0 left-0 rounded-full " + toneClass}
                        style={{ width: cat.score + "%", backgroundColor: "currentColor" }}
                      />
                    )}
                  </span>
                  <span className={"w-9 shrink-0 text-right text-sm font-semibold tabular-nums " + toneClass}>
                    {cat.checked ? cat.score : "\u2013"}
                  </span>
                  <svg className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4Z" />
                  </svg>
                </summary>
                <div className="px-4 pb-4 sm:px-5">
                  {!cat.checked && (
                    <p className="mb-2 text-xs text-muted">Couldn&apos;t check this area because the homepage couldn&apos;t be read.</p>
                  )}
                  {cat.checked && pending && <p className="mb-2 text-xs text-muted">Quick check shown. The full mobile speed test is still running.</p>}
                  {cat.checked && !pending && cat.id === "performance" && !cat.fromSpeedTest && (
                    <p className="mb-2 text-xs text-muted">Quick check shown. The full speed test wasn&apos;t available for this site.</p>
                  )}
                  {cat.checked && (
                    <ul className="space-y-1.5 text-sm">
                      {cat.checks.map((chk) => (
                        <li key={chk.label} className="flex gap-2">
                          <span aria-hidden="true" className={"w-4 shrink-0 font-bold " + (chk.pass ? "text-up" : "text-down")}>
                            {chk.pass ? "\u2713" : "\u2717"}
                          </span>
                          <span className={chk.pass ? "text-ink" : "text-muted"}>
                            <span className="sr-only">{chk.pass ? "Passed: " : "Needs work: "}</span>
                            {chk.label}
                            {!chk.pass && <span className="block text-xs text-muted">{chk.fix}</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </details>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
