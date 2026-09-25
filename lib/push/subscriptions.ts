/**
 * Redis-backed store for Web Push subscriptions, scoped per domain.
 * SERVER-ONLY. Contains no secrets (subscription keys are per-browser
 * push auth tokens, not credentials to anything of ours).
 *
 * Schema (all under the pc:v1:push: prefix):
 *   sub:<id>      -> JSON {endpoint, keys} for one browser subscription
 *   domain:<d>    -> Set of subscription ids watching domain d
 *   status:<d>    -> last known "up" | "down" for domain d (for diffing)
 *   watched       -> Set of every domain with >=1 subscriber
 * Subscriptions expire after 45 days if never refreshed (toggling the
 * alert back on refreshes it), so stale entries clean themselves up.
 */
import "server-only";
import { createHash } from "node:crypto";
import { redisPipeline } from "@/lib/db/redis";

const PREFIX = "pc:v1:push:";
const SUB_TTL_SECONDS = 45 * 86400;
const STATUS_TTL_SECONDS = 30 * 86400;
const WATCHED_KEY = PREFIX + "watched";

export interface PushSubscriptionData {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

function subId(endpoint: string): string {
  return createHash("sha256").update(endpoint).digest("hex").slice(0, 24);
}
function subKey(id: string) {
  return PREFIX + "sub:" + id;
}
function domainKey(domain: string) {
  return PREFIX + "domain:" + domain;
}
function statusKey(domain: string) {
  return PREFIX + "status:" + domain;
}

export async function addSubscription(domain: string, sub: PushSubscriptionData): Promise<boolean> {
  const id = subId(sub.endpoint);
  const result = await redisPipeline([
    ["SET", subKey(id), JSON.stringify(sub), "EX", SUB_TTL_SECONDS],
    ["SADD", domainKey(domain), id],
    ["EXPIRE", domainKey(domain), SUB_TTL_SECONDS],
    ["SADD", WATCHED_KEY, domain],
  ]);
  return result !== null;
}

async function pruneIfEmpty(domain: string): Promise<void> {
  const card = await redisPipeline([["SCARD", domainKey(domain)]]);
  if (card && Number(card[0]) === 0) {
    await redisPipeline([["SREM", WATCHED_KEY, domain]]);
  }
}

export async function removeSubscription(domain: string, endpoint: string): Promise<void> {
  const id = subId(endpoint);
  await redisPipeline([
    ["SREM", domainKey(domain), id],
    ["DEL", subKey(id)],
  ]);
  await pruneIfEmpty(domain);
}

export async function pruneSubscription(domain: string, id: string): Promise<void> {
  await redisPipeline([
    ["SREM", domainKey(domain), id],
    ["DEL", subKey(id)],
  ]);
  await pruneIfEmpty(domain);
}

export async function getWatchedDomains(): Promise<string[]> {
  const result = await redisPipeline([["SMEMBERS", WATCHED_KEY]]);
  return result && Array.isArray(result[0]) ? (result[0] as string[]) : [];
}

export async function getSubscriptionsForDomain(
  domain: string
): Promise<{ id: string; sub: PushSubscriptionData }[]> {
  const idsResult = await redisPipeline([["SMEMBERS", domainKey(domain)]]);
  const ids = idsResult && Array.isArray(idsResult[0]) ? (idsResult[0] as string[]) : [];
  if (ids.length === 0) return [];

  const values = await redisPipeline([["MGET", ...ids.map(subKey)]]);
  const raw = values && Array.isArray(values[0]) ? values[0] : [];
  const out: { id: string; sub: PushSubscriptionData }[] = [];
  ids.forEach((id, i) => {
    const v = raw[i];
    if (typeof v !== "string") return;
    try {
      out.push({ id, sub: JSON.parse(v) as PushSubscriptionData });
    } catch {
      // corrupt entry, skip it
    }
  });
  return out;
}

export async function getLastStatuses(domains: string[]): Promise<Map<string, "up" | "down">> {
  if (domains.length === 0) return new Map();
  const result = await redisPipeline([["MGET", ...domains.map(statusKey)]]);
  const raw = result && Array.isArray(result[0]) ? result[0] : [];
  const map = new Map<string, "up" | "down">();
  domains.forEach((d, i) => {
    if (raw[i] === "up" || raw[i] === "down") map.set(d, raw[i] as "up" | "down");
  });
  return map;
}

export async function setLastStatus(domain: string, status: "up" | "down"): Promise<void> {
  await redisPipeline([["SET", statusKey(domain), status, "EX", STATUS_TTL_SECONDS]]);
}
