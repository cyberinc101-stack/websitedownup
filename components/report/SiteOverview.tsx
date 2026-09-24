/**
 * Top block of the report: site logo, preview image and key facts
 * (name, URL checked, response time, HTTP status, last checked).
 *
 * UNTRUSTED DATA: page title/description/images come from the checked
 * site's HTML. Rendered as text and img src only.
 */

import type { ReactNode } from "react";
import FallbackImage from "@/components/shared/FallbackImage";
import SiteLogo from "@/components/shared/SiteLogo";
import { DASH, shortUrl } from "./format";
import type { PageMeta } from "@/lib/diagnostics/types";

export interface OverviewResult {
  domain: string;
  statusCode: number | null;
  responseTimeMs: number | null;
  checkedAt: string;
}

function FactRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-3 py-1.5 odd:bg-white/60">
      <dt className="text-muted shrink-0">{label}</dt>
      <dd className="text-ink text-right truncate min-w-0">{children}</dd>
    </div>
  );
}

export default function SiteOverview({
  result,
  page,
  finalUrl,
}: {
  result: OverviewResult;
  page: PageMeta | null;
  finalUrl: string | null;
}) {
  const name = page?.siteName ?? page?.title ?? result.domain;
  const checkedTime = new Date(result.checkedAt).toLocaleTimeString();
  const previewSources = [page?.imageUrl];

  return (
    <div className="grid gap-4 sm:grid-cols-[220px_minmax(0,1fr)]">
      {/* Preview: the site's own social preview image, or a large logo tile */}
      <div className="overflow-hidden rounded-lg border border-line bg-white aspect-[1.91/1]">
        <FallbackImage
          key={previewSources.join("|")}
          sources={previewSources}
          alt={"Preview of " + result.domain}
          className="h-full w-full object-cover"
          fallback={
            <div className="flex h-full w-full flex-col items-center justify-center gap-2">
              <SiteLogo domain={result.domain} iconUrl={page?.iconUrl} className="h-12 w-12 rounded-lg" />
              <span className="text-xs text-muted">{result.domain}</span>
            </div>
          }
        />
      </div>

      <div className="min-w-0">
        <dl className="rounded-lg border border-line overflow-hidden text-sm">
          <FactRow label="Website">{name}</FactRow>
          <FactRow label="URL checked">{finalUrl ? shortUrl(finalUrl) : result.domain}</FactRow>
          <FactRow label="Response time">
            <span className="font-mono tabular">
              {result.responseTimeMs !== null ? result.responseTimeMs + " ms" : DASH}
            </span>
          </FactRow>
          <FactRow label="HTTP status">
            <span className="font-mono tabular">{result.statusCode ?? DASH}</span>
          </FactRow>
          <FactRow label="Last checked">
            {/* Server renders UTC, browser renders local time; that difference is expected. */}
            <span className="font-mono tabular" suppressHydrationWarning>
              {checkedTime}
            </span>
          </FactRow>
        </dl>
        {page?.description && (
          <p className="mt-2 text-xs text-muted leading-snug line-clamp-2">{page.description}</p>
        )}
      </div>
    </div>
  );
}
