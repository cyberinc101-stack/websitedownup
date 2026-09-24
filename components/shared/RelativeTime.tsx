"use client";

/**
 * Shows a timestamp as "just now" / "4 min ago" / "2 h ago" and keeps it
 * updated. Renders a neutral word on the server and fills in the real
 * value in the browser, so there's no hydration mismatch.
 * Contains no data or security logic.
 */

import { useEffect, useState } from "react";

function describe(iso: string): string {
  const then = new Date(iso).getTime();
  if (isNaN(then)) return "recently";
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return minutes + " min ago";
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours + " h ago";
  return Math.round(hours / 24) + " d ago";
}

export default function RelativeTime({ iso }: { iso: string }) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setText(describe(iso));
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [iso]);

  return <time dateTime={iso}>{text ?? "recently"}</time>;
}
