"use client";

/**
 * "Embed your worth badge" — bottom of the Website Worth report.
 *
 * Lets the site owner pick an estimated-value or health-score badge, shows
 * a live preview and gives copy-paste HTML / Markdown. Every embed links
 * back to this domain's full report (an earned backlink, and the place where
 * visitors can see how the figure was worked out). Link text is just the
 * domain — no keyword-stuffed anchors.
 *
 * The badges are served by /badge/worth/{domain} and /badge/health/{domain}
 * and update themselves, so the figure rises or falls as the site changes.
 * CLIENT-ONLY. Contains no secrets.
 */

import { useState } from "react";
import { CopyBlock } from "@/components/report/EmbedBadge";
import { SITE_NAME, SITE_URL } from "@/lib/config/site";

type Metric = "worth" | "health";

const OPTIONS: { id: Metric; label: string; hint: string }[] = [
  { id: "worth", label: "Est. value", hint: "Shows the estimated website value." },
  { id: "health", label: "Site health", hint: "Shows the 0–100 health score." },
];

export default function WorthBadgeEmbed({ domain }: { domain: string }) {
  const [metric, setMetric] = useState<Metric>("worth");
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});

  const badgeUrl = SITE_URL + "/badge/" + metric + "/" + domain;
  const reportUrl = SITE_URL + "/worth?domain=" + encodeURIComponent(domain);
  const altText = metric === "worth" ? domain + " estimated website value" : domain + " site health score";
  const titleText =
    metric === "worth"
      ? "Automated estimate by " + SITE_NAME + " — not an appraisal"
      : "Site health score by " + SITE_NAME;

  const htmlSnippet =
    '<a href="' + reportUrl + '" target="_blank" rel="noopener" title="' + titleText + '">' +
    '<img src="' + badgeUrl + '" alt="' + altText + '" height="20" /></a>';
  const markdownSnippet = "[![" + altText + "](" + badgeUrl + ")](" + reportUrl + ")";

  return (
    <section className="mt-8 rounded-lg border border-line bg-white/70 p-4" aria-labelledby="worth-badge-title">
      <h2 id="worth-badge-title" className="font-display text-sm font-bold text-ink mb-1">
        Embed your worth badge
      </h2>
      <p className="text-xs text-muted leading-relaxed mb-3">
        Own {domain}? Show its estimated value or health score on your site, a sale listing or your media kit. The badge
        links back to this full report, so anyone can see how the figure was worked out.
      </p>

      <div className="flex flex-wrap gap-2 mb-3" role="radiogroup" aria-label="Badge type">
        {OPTIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={metric === o.id}
            title={o.hint}
            onClick={() => setMetric(o.id)}
            className={
              "rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors " +
              (metric === o.id
                ? "border-signal bg-signal-light text-signal-dark"
                : "border-line bg-white text-ink hover:border-signal/50")
            }
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="mb-3 flex items-center gap-2 min-h-[20px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={badgeUrl}
          src={badgeUrl}
          alt={altText}
          className="h-5"
          onLoad={() => setLoaded((l) => ({ ...l, [badgeUrl]: true }))}
        />
        {!loaded[badgeUrl] && <span className="text-[11px] text-muted">Loading badge…</span>}
      </div>

      <div className="space-y-3">
        <CopyBlock label="HTML" value={htmlSnippet} />
        <CopyBlock label="Markdown" value={markdownSnippet} />
      </div>

      <div className="mt-4 rounded-md border border-line bg-bg px-3 py-2.5 text-[11px] text-muted leading-relaxed space-y-1.5">
        <p>
          <span className="font-semibold text-ink">Keep it honest.</span> The value is an automated estimate from public
          signals — popularity rank, what&apos;s on the homepage and typical ad earnings for this kind of site. It isn&apos;t
          an appraisal, an offer or a guarantee of what the site would sell for, which is why the badge says
          &ldquo;est.&rdquo;
        </p>
        <p>
          <span className="font-semibold text-ink">It updates itself.</span> The badge is refreshed at least once a day,
          so it rises or falls as the site changes — there&apos;s no need to re-copy the code, and no limit on how high the
          figure can go.
        </p>
        <p>
          <span className="font-semibold text-ink">Keep the link.</span> Please leave the link to this report in place so
          visitors can check the method.
        </p>
      </div>
    </section>
  );
}
