"use client";

/**
 * Homepage checker. Every check is recorded server-side for the public
 * "Recently checked" feed (see app/api/check/route.ts), so nothing extra
 * is needed here.
 * No security logic here.
 */

import DomainChecker from "./DomainChecker";

export default function HomeChecker() {
  return <DomainChecker />;
}
