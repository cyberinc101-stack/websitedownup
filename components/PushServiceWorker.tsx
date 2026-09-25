"use client";

import { useEffect } from "react";
import { isPushSupported } from "@/lib/client/pushAlerts";

/**
 * Registers /sw.js once on mount so it'"'"'s ready before the user taps an
 * alert toggle. Renders nothing. Add <PushServiceWorker /> once near the
 * root of the app (e.g. app/layout.tsx, inside <body>).
 */
export default function PushServiceWorker() {
  useEffect(() => {
    if (isPushSupported()) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
