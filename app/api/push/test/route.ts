import { NextResponse } from "next/server";
import { getWebPush, isPushConfigured } from "@/lib/push/webPush";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
}

function validate(body: unknown): Body | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const sub = b.subscription as Record<string, unknown> | undefined;
  if (!sub || typeof sub.endpoint !== "string") return null;
  const keys = sub.keys as Record<string, unknown> | undefined;
  if (!keys || typeof keys.p256dh !== "string" || typeof keys.auth !== "string") return null;
  return { subscription: { endpoint: sub.endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } } };
}

export async function POST(req: Request) {
  if (!isPushConfigured()) {
    return NextResponse.json(
      { error: "Push notifications aren'"'"'t configured on the server." },
      { status: 503 }
    );
  }

  const parsed = validate(await req.json().catch(() => null));
  if (!parsed) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const webpush = getWebPush();
  try {
    await webpush.sendNotification(
      parsed.subscription,
      JSON.stringify({
        title: "Test alert",
        body: "This is what a down-site alert will look like.",
      })
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    const statusCode = (err as { statusCode?: number })?.statusCode;
    if (statusCode === 404 || statusCode === 410) {
      return NextResponse.json(
        { error: "This browser'"'"'s push subscription has expired. Turn an alert off and back on, then try again." },
        { status: 410 }
      );
    }
    return NextResponse.json({ error: "Couldn'"'"'t send the test notification." }, { status: 502 });
  }
}