/**
 * A website's logo/icon with graceful fallbacks:
 * the icon found on the page -> the site's /favicon.ico -> a lettered tile.
 * Used in the report header, the report preview and the homepage lists.
 *
 * UNTRUSTED DATA: icon URLs point at third-party sites. See FallbackImage
 * for how they're loaded safely.
 */

import FallbackImage from "./FallbackImage";

function LetterTile({ domain, className }: { domain: string; className: string }) {
  return (
    <div
      className={
        "flex items-center justify-center bg-white border border-line font-display font-bold text-signal " +
        className
      }
      aria-hidden="true"
    >
      {domain.charAt(0).toUpperCase()}
    </div>
  );
}

export default function SiteLogo({
  domain,
  iconUrl,
  className,
}: {
  domain: string;
  iconUrl?: string | null;
  className: string;
}) {
  const sources = [iconUrl, "https://" + domain + "/favicon.ico"];
  return (
    <FallbackImage
      key={sources.join("|")}
      sources={sources}
      alt={domain + " logo"}
      className={"bg-white border border-line object-contain p-0.5 " + className}
      fallback={<LetterTile domain={domain} className={className} />}
    />
  );
}
