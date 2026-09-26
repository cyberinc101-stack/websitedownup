"use client";

/**
 * "Embed this status badge" section on each /site/[domain] report page:
 * a live preview of the /badge/[domain] SVG plus copy-paste HTML and
 * Markdown snippets. Every embed elsewhere links back to this domain's
 * report page -- a real, earned backlink, not a link scheme.
 */

import { useState } from "react";
import { SITE_NAME, SITE_URL } from "@/lib/config/site";

function CopyBlock({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable; the text is still selectable manually.
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-ink">{label}</span>
        <button
          type="button"
          onClick={copy}
          className="rounded-md border border-line bg-white px-2.5 py-1 text-[11px] font-semibold text-ink hover:border-signal/50 transition-colors"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="rounded-lg border border-line bg-white/70 p-3 text-[11px] text-muted overflow-x-auto">
        <code>{value}</code>
      </pre>
    </div>
  );
}

export default function EmbedBadge({ domain }: { domain: string }) {
  const badgeUrl = SITE_URL + "/badge/" + domain;
  const pageUrl = SITE_URL + "/site/" + domain;
  const altText = domain + " status";

  const htmlSnippet =
    '<a href="' + pageUrl + '" target="_blank" rel="noopener noreferrer">' +
    '<img src="' + badgeUrl + '" alt="' + altText + '" /></a>';

  const markdownSnippet = "[![" + altText + "](" + badgeUrl + ")](" + pageUrl + ")";

  return (
    <section className="mt-8 rounded-lg border border-line bg-white/70 p-4">
      <h2 className="font-display text-sm font-bold text-ink mb-1">
        Embed this status badge
      </h2>
      <p className="text-xs text-muted leading-relaxed mb-3">
        A live status badge for {domain}, checked by {SITE_NAME}. Paste it
        into your README, docs, or your own status page &mdash; it updates
        automatically.
      </p>
      <div className="mb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={badgeUrl} alt={altText} className="h-5" />
      </div>
      <div className="space-y-3">
        <CopyBlock label="HTML" value={htmlSnippet} />
        <CopyBlock label="Markdown" value={markdownSnippet} />
      </div>
    </section>
  );
}
