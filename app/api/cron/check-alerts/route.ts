import { NextResponse } from "next/server";
import { checkDomain } from "@/lib/checkSite";
import {
  getWatchedDomains,
  getSubscriptionsForDomain,
  getLastStatuses,
  setLastStatus,
  pruneSubscription,
} from "@/lib/push/subscriptions";
import { getWebPush, isPushConfigured } from "@/lib/push/webPush";
import { isRedisConfigured } from "@/lib/db/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_DOMAINS_PER_TICK = 60;
const CHECK_CONCURRENCY = 10;

function siteName(domain: string): string {
  return domain.replace(/^www\./, "");
}

async function checkAll(domains: string[]): Promise<Map<string, "up" | "down" | null>> {
  const results = new Map<string, "up" | "down" | null>();
  for (let i = 0; i < domains.length; i += CHECK_CONCURRENCY) {
    const chunk = domains.slice(i, i + CHECK_CONCURRENCY);
    const settled = await Promise.all(
      chunk.map(async (domain) => {
        try {
          const r = await checkDomain(domain);
          return [domain, r.status] as const;
        } catch {
          return [domain, null] as const;
        }
      })
    );
    for (const [domain, status] of settled) results.set(domain, status);
  }
  return results;
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== "Bearer " + secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isRedisConfigured() || !isPushConfigured()) {
    return NextResponse.json({ skipped: "Redis or VAPID keys not configured" });
  }

  const domains = (await getWatchedDomains()).slice(0, MAX_DOMAINS_PER_TICK);
  if (domains.length === 0) return NextResponse.json({ checked: 0, notified: 0 });

  const [current, previous] = await Promise.all([checkAll(domains), getLastStatuses(domains)]);
  const webpush = getWebPush();
  let notified = 0;

  for (const domain of domains) {
    const status = current.get(domain);
    if (!status) continue;

    const prevStatus = previous.get(domain);
    await setLastStatus(domain, status);

    if (!prevStatus || prevStatus === status) continue;

    const subs = await getSubscriptionsForDomain(domain);
    if (subs.length === 0) continue;

    const payload = JSON.stringify({
      title: siteName(domain) + (status === "down" ? " is down" : " is back up"),
      body: status === "down" ? "We could not reach " + domain + "." : domain + " is responding again.",
      icon: "https://" + domain + "/favicon.ico",
      url: "/site/" + domain,
    });

    await Promise.all(
      subs.map(async ({ id, sub }) => {
        try {
          await webpush.sendNotification(sub, payload);
          notified++;
        } catch (err: unknown) {
          const statusCode = (err as { statusCode?: number })?.statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await pruneSubscription(domain, id);
          }
        }
      })
    );
  }

  return NextResponse.json({ checked: domains.length, notified });
}