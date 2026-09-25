/**
 * POST /api/push/subscribe: register a browser's push subscription as an
 * alert watcher for one domain. DELETE: unregister it. Called from
 * lib/client/pushAlerts.ts when the user flips the alert toggle.
 * Contains no secrets. SERVER-ONLY.
 */
import { NextResponse } from "next/server";
import { isLikelyValidDomain, normalizeDomain } from "@/lib/checkSite";
import { isFeedSafeDomain } from "@/lib/security/feedFilter";
import { addSubscription, removeSubscription } from "@/lib/push/subscriptions";
import { isRedisConfigured } from "@/lib/db/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  domain: string;
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
}

function validate(body: unknown): Body | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (typeof b.domain !== "string") return null;
  const sub = b.subscription as Record<string, unknown> | undefined;
  if (!sub || typeof sub.endpoint !== "string") return null;
  const keys = sub.keys as Record<string, unknown> | undefined;
  if (!keys || typeof keys.p256dh !== "string" || typeof keys.auth !== "string") return null;
  return {
    domain: b.domain,
    subscription: { endpoint: sub.endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } },
  };
}

export async function POST(req: Request) {
  if (!isRedisConfigured()) {
    return NextResponse.json({ error: "Background alerts need Redis connected in Vercel." }, { status: 503 });
  }
  const parsed = validate(await req.json().catch(() => null));
  if (!parsed) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const domain = normalizeDomain(parsed.domain);
  if (!isLikelyValidDomain(domain) || !isFeedSafeDomain(domain)) {
    return NextResponse.json({ error: "Invalid domain" }, { status: 400 });
  }

  const ok = await addSubscription(domain, parsed.subscription);
  return NextResponse.json({ ok });
}

export async function DELETE(req: Request) {
  const parsed = validate(await req.json().catch(() => null));
  if (!parsed) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const domain = normalizeDomain(parsed.domain);
  await removeSubscription(domain, parsed.subscription.endpoint);
  return NextResponse.json({ ok: true });
}
