"use client";

/**
 * <img> that walks through a list of candidate URLs and shows `fallback`
 * if none of them load. Used for site logos and preview images across the site.
 *
 * UNTRUSTED DATA: `sources` point at third-party sites. They are only ever
 * used as an img src (never as HTML), are https-only (enforced in
 * lib/diagnostics/pageMeta.ts), and are loaded with no-referrer so the
 * checked site can't see which PulseCheck page the visitor was on.
 * Images are loaded directly by the visitor's browser, NOT proxied through
 * our server, so there's no SSRF surface and no bandwidth cost for us.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";

export default function FallbackImage({
  sources,
  alt,
  className,
  fallback,
}: {
  sources: Array<string | null | undefined>;
  alt: string;
  className?: string;
  fallback: ReactNode;
}) {
  const list = sources.filter(
    (s, i, arr): s is string => typeof s === "string" && s.length > 0 && arr.indexOf(s) === i
  );
  const [index, setIndex] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const src = list[index];

  // An image can fail before React hydrates, in which case onError never
  // fires. Catch that case after mount.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) {
      setIndex((i) => i + 1);
    }
  }, [src]);

  if (!src) return <>{fallback}</>;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      loading="lazy"
      decoding="async"
      onError={() => setIndex((i) => i + 1)}
    />
  );
}
