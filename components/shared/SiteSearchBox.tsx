"use client";

/**
 * Website box shared by the status checker and Website Worth: type a
 * name ("netflix") or an address ("example.com") and pick from a dropdown
 * of well-known sites, plus "netflix.com" as a guess for a single word.
 * Suggestions come from our own lists (lib/siteSuggest.ts), no requests.
 *
 * Also exports SiteAddressTip, the "How do I find the address?" help.
 * CLIENT-ONLY. Contains no secrets.
 */

import { useMemo } from "react";
import SuggestInput, { type Suggestion } from "./SuggestInput";
import { guessedDomain, suggestSites } from "@/lib/siteSuggest";

export default function SiteSearchBox({
  id,
  value,
  onChange,
  onPickDomain,
  currentDomain = null,
  invalid = false,
  describedBy,
  placeholder = "Website name or address",
  inputClassName,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onPickDomain: (domain: string) => void;
  /** The site already on screen; no dropdown while the box still shows it. */
  currentDomain?: string | null;
  invalid?: boolean;
  describedBy?: string;
  placeholder?: string;
  /** Replaces the default input styling, to match the page's existing box. */
  inputClassName?: string;
}) {
  const suggestions = useMemo<Suggestion[]>(() => {
    const text = value.trim();
    if (!text || (currentDomain && text.toLowerCase() === currentDomain)) return [];
    const known = suggestSites(text, 6);
    const list: Suggestion[] = known.map((s) => ({ key: s.domain, title: s.name, subtitle: s.domain }));
    const guess = guessedDomain(text);
    if (guess && !known.some((s) => s.domain === guess)) {
      list.push({ key: guess, title: guess, subtitle: "Check this address" });
    }
    return list;
  }, [value, currentDomain]);

  return (
    <SuggestInput
      id={id}
      label="Website name or address"
      value={value}
      onChange={onChange}
      onPick={(s) => onPickDomain(s.key)}
      suggestions={suggestions}
      placeholder={placeholder}
      inputMode="url"
      invalid={invalid}
      describedBy={describedBy}
      inputClassName={inputClassName}
    />
  );
}

export function SiteAddressTip() {
  return (
    <details className="mt-2 text-xs text-muted">
      <summary className="cursor-pointer select-none hover:text-ink">
        Type a name like <span className="text-ink">netflix</span> or an address.{" "}
        <span className="text-signal">How do I find the address?</span>
      </summary>
      <div className="mt-2 space-y-2 rounded-xl border border-line bg-surface px-4 py-3 leading-relaxed">
        <p>
          <span className="font-medium text-ink">Easiest:</span> type the website&apos;s name and pick it from the list.
        </p>
        <p>
          <span className="font-medium text-ink">On a phone:</span> open the site in your browser, tap the address bar
          (at the bottom in Safari, the top in Chrome), tap Copy, then paste it here. The full link works too; we only
          use the site part.
        </p>
        <p>
          <span className="font-medium text-ink">On a computer:</span> click the address bar at the top of your browser,
          copy the address and paste it here.
        </p>
      </div>
    </details>
  );
}
