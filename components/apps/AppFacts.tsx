/**
 * The factual side of the App Worth report: everything the public listing
 * says, plus the developer's other apps (each links to its own report).
 *
 * UNTRUSTED DATA: all text comes from the store listing and is rendered as
 * plain text. developerUrl is https-only (checked server-side) and opens
 * with rel="nofollow ugc noopener noreferrer". Contains no secrets.
 */

import Link from "next/link";
import { formatAge, formatCount, formatDate, formatMoney } from "@/lib/worth/engine/format";
import { AppIcon } from "./AppValueHero";
import type { AppReport } from "@/lib/apps/types";

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink break-words">{children}</dd>
    </div>
  );
}

function sizeText(bytes: number | null): string {
  if (bytes === null) return "Not listed";
  const mb = bytes / 1048576;
  return mb >= 1024 ? (mb / 1024).toFixed(1) + " GB" : Math.round(mb) + " MB";
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function AppFacts({ report }: { report: AppReport }) {
  const l = report.signals.listing;
  const devApps = report.signals.developerApps;
  const updated = report.daysSinceUpdate;

  return (
    <>
      <section className="mt-10">
        <h2 className="font-display text-lg font-bold text-ink">App facts</h2>
        <dl className="mt-3 grid gap-x-8 rounded-2xl border border-line bg-surface px-4 sm:px-5 sm:grid-cols-2 divide-y divide-line sm:divide-y-0">
          <Fact label="Developer">
            {l.developer ?? "Not listed"}
            {l.developerUrl && (
              <>
                {" · "}
                <a href={l.developerUrl} target="_blank" rel="nofollow ugc noopener noreferrer" className="text-signal hover:underline">
                  {hostOf(l.developerUrl)}
                </a>
              </>
            )}
          </Fact>
          <Fact label="Category">
            {l.category ?? report.categoryLabel}
            {l.genres.length > 1 && <span className="text-muted"> · {l.genres.filter((g) => g !== l.category && g !== "Games").slice(0, 3).join(", ")}</span>}
          </Fact>
          <Fact label="Price">{l.price > 0 ? formatMoney(l.price) : "Free"}</Fact>
          <Fact label="Rating (current version)">
            {l.currentVersionRating !== null ? l.currentVersionRating.toFixed(1) + " stars" : "Not rated yet"}
            {l.currentVersionRatingCount ? <span className="text-muted"> from {formatCount(l.currentVersionRatingCount)} ratings</span> : null}
          </Fact>
          <Fact label="Released">
            {formatDate(l.releasedAt) ?? "Not listed"}
            {report.ageYears !== null && <span className="text-muted"> ({formatAge(report.ageYears)} ago)</span>}
          </Fact>
          <Fact label="Last updated">
            {formatDate(l.updatedAt) ?? "Not listed"}
            {updated !== null && (
              <span className="text-muted"> ({updated < 1 ? "today" : Math.round(updated) + (Math.round(updated) === 1 ? " day" : " days") + " ago"})</span>
            )}
          </Fact>
          <Fact label="Version">{l.version ?? "Not listed"}</Fact>
          <Fact label="Download size">{sizeText(l.fileSizeBytes)}</Fact>
          <Fact label="Requires">{l.minOsVersion ? "iOS " + l.minOsVersion + " or later" : "Not listed"}</Fact>
          <Fact label="Languages">{l.languageCount > 0 ? l.languageCount : "Not listed"}</Fact>
          <Fact label="Age rating">{l.contentRating ?? "Not listed"}</Fact>
          <Fact label="Screenshots">{l.screenshotCount}</Fact>
          <Fact label="iPad">{l.supportsIpad ? "Yes" : "iPhone only"}</Fact>
          <Fact label="Game Center">{l.gameCenter ? "Yes" : "No"}</Fact>
        </dl>
        {l.releaseNotes && (
          <div className="mt-4 rounded-2xl border border-line bg-surface px-4 py-3 sm:px-5">
            <p className="text-xs text-muted">What&apos;s new in the latest version</p>
            <p className="mt-1 text-sm text-ink whitespace-pre-line line-clamp-6">{l.releaseNotes}</p>
          </div>
        )}
      </section>

      {devApps.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-lg font-bold text-ink">More apps from {l.developer ?? "this developer"}</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {devApps.map((a) => (
              <li key={a.id}>
                <Link
                  href={"/app-worth?app=" + encodeURIComponent(a.id)}
                  className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5 hover:border-signal transition-colors"
                >
                  <AppIcon name={a.name} iconUrl={a.iconUrl} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{a.name}</span>
                    <span className="block text-xs text-muted">
                      {a.rating !== null ? a.rating.toFixed(1) + " ★" : "Not rated"}
                      {a.ratingCount ? " · " + formatCount(a.ratingCount) + " ratings" : ""}
                      {" · " + (a.price > 0 ? formatMoney(a.price) : "Free")}
                    </span>
                  </span>
                  <span className="text-xs font-medium text-signal shrink-0">Check worth</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
