"use client";

/**
 * "Save this site and get alerts" card shown near the top of a site report.
 * The wording changes with the current status: a down site is the moment
 * someone most wants to be told when it comes back. The actual saving is
 * done by the existing SaveButton; alerts are switched on from /saved.
 * Pure presentation, no security logic.
 */

import Link from "next/link";
import SaveButton from "@/components/shared/SaveButton";

export default function SaveAlertPrompt({
  domain,
  status,
}: {
  domain: string;
  status: "up" | "down";
}) {
  const heading =
    status === "down"
      ? "Get notified when " + domain + " is back"
      : "Get notified if " + domain + " goes down";

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white/70 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">{heading}</p>
        <p className="text-xs text-muted">
          Tap the star to save it, then turn on free alerts from your{" "}
          <Link href="/saved" className="text-signal hover:underline">
            saved sites
          </Link>{" "}
          page.
        </p>
      </div>
      <SaveButton domain={domain} className="scale-125 shrink-0" />
    </div>
  );
}