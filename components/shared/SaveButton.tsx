"use client";

/**
 * Red star toggle used on every site card, the live feed, and the report
 * page. Works inside a <Link> (the card itself is often a link) by
 * preventing the click from bubbling into the anchor's navigation.
 */

import type { MouseEvent } from "react";
import { useSavedSites, MAX_SAVED } from "@/lib/client/savedSites";

export default function SaveButton({
  domain,
  className = "",
}: {
  domain: string;
  className?: string;
}) {
  const { isSaved, toggleSave, count } = useSavedSites();
  const saved = isSaved(domain);
  const atLimit = !saved && count >= MAX_SAVED;

  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (atLimit) return;
    toggleSave(domain);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={atLimit}
      aria-pressed={saved}
      aria-label={saved ? "Remove " + domain + " from saved sites" : "Save " + domain}
      title={atLimit ? "You can save up to " + MAX_SAVED + " sites" : saved ? "Remove from saved sites" : "Save this site"}
      className={"inline-flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed " + className}
    >
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        strokeWidth="1.6"
        strokeLinejoin="round"
        className={saved ? "fill-down stroke-down" : "fill-none stroke-muted"}
      >
        <path d="M12 2.5l2.9 6.2 6.7.7-5 4.6 1.4 6.7L12 17.6l-6 3.1 1.4-6.7-5-4.6 6.7-.7L12 2.5z" />
      </svg>
    </button>
  );
}