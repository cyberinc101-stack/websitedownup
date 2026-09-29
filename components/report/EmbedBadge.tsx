"use client";

/**
 * "Embed this status badge" section on each /site/[domain] report page:
 * a live preview of the /badge/[domain] SVG (live up/down) and the
 * /badge/uptime/[domain] SVG (real uptime history, no new storage --
 * see that route's file comment), each with copy-paste HTML and Markdown
 * snippets. Every embed elsewhere links back to this domain's report page
 * -- a real, earned backlink, not a link scheme.
 */

import { useState } from "react";
import { SITE_NAME, SITE_URL } from "@/lib/config/site";

export function CopyBlock({ label, value }: { label: string; value: string }) {
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

function snippetsFor(badgeUrl: string, pageUrl: string, altText: string) {
  return {
    html:
      '<a href="' + pageUrl + '" target="_blank" rel="noopener noreferrer">' +
      '<img src="' + badgeUrl + '" alt="' + altText + '" /></a>',
    markdown: "[![" + altText + "](" + badgeUrl + ")](" + pageUrl + ")",
  };
}

export default function EmbedBadge({ domain }: { domain: string }) {
  const pageUrl = SITE_URL + "/site/" + domain;

  const statusBadgeUrl = SITE_URL + "/badge/" + domain;
  const statusAlt = domain + " status";
  const statusSnippets = snippetsFor(statusBadgeUrl, pageUrl, statusAlt);

  const uptimeBadgeUrl = SITE_URL + "/badge/uptime/" + domain;
  const uptimeAlt = domain + " uptime";
  const uptimeSnippets = snippetsFor(uptimeBadgeUrl, pageUrl, uptimeAlt);

  return (
    <section className="mt-8 rounded-lg border border-line bg-white/70 p-4">
      <h2 className="font-display text-sm font-bold text-ink mb-1">
        Embed these status badges
      </h2>
      <p className="text-xs text-muted leading-relaxed mb-4">
        Live badges for {domain}, checked by {SITE_NAME}. Paste either one
        into your README, docs, or your own status page &mdash; they update
        automatically.
      </p>

      <div className="space-y-5">
        <div>
          <p className="text-xs font-semibold text-ink mb-2">Live status</p>
          <div className="mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={statusBadgeUrl} alt={statusAlt} className="h-5" />
          </div>
          <div className="space-y-3">
            <CopyBlock label="HTML" value={statusSnippets.html} />
            <CopyBlock label="Markdown" value={statusSnippets.markdown} />
          </div>
        </div>

        <div className="pt-1 border-t border-line">
          <p className="text-xs font-semibold text-ink mb-2 mt-4">Uptime history</p>
          <div className="mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={uptimeBadgeUrl} alt={uptimeAlt} className="h-5" />
          </div>
          <div className="space-y-3">
            <CopyBlock label="HTML" value={uptimeSnippets.html} />
            <CopyBlock label="Markdown" value={uptimeSnippets.markdown} />
          </div>
        </div>
      </div>
    </section>
  );
}
