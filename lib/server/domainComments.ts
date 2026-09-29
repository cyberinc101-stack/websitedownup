/**
 * Live preset-comment feeds made of preset comments only (see
 * lib/comments/commentPresets.ts). Two Redis lists, each holding the newest
 * 100 entries (LPUSH + LTRIM, so the oldest drops off by itself):
 *  - one per domain (shown on that domain's report page)
 *  - one site-wide (shown on the home page, with the domain on each row)
 * Comments live COMMENT_LIFETIME_MS (3 hours). They stop showing at that
 * age AND are deleted from Redis (both lists) the next time a feed is read,
 * together with their vote data. A list with no new comments also expires
 * on its own 3 hours after its last comment.
 * Problem presets also add to the existing 15-minute problem count
 * (lib/server/problemReports.ts). "Working well" presets never do.
 * Each item also carries a comment id (cid) and accurate / not accurate
 * vote totals (lib/server/commentVotes.ts). Heavily downvoted comments are
 * left out of the feed and of every count built from it.
 * SERVER-ONLY. Fails soft to an empty feed if Redis isn't configured or is
 * unreachable. Contains no secrets and stores no visitor identity.
 */

import "server-only";
import { redisPipeline, isRedisConfigured, type RedisCommand } from "@/lib/db/redis";
import { addProblemReport } from "@/lib/server/problemReports";
import { attachVotes, commentId, voteCleanupCommands, COMMENT_LIFETIME_MS } from "@/lib/server/commentVotes";
import { isHidden, type VotableItem } from "@/lib/comments/votes";
import {
  COMMENT_PRESETS,
  EMPTY_SNAPSHOT,
  getCommentPreset,
  type CommentItem,
  type CommentPreset,
  type CommentsSnapshot,
} from "@/lib/comments/commentPresets";

const MAX_ITEMS = 100;
const LIST_TTL_SECONDS = Math.floor(COMMENT_LIFETIME_MS / 1000);
const MAX_AGE_MS = COMMENT_LIFETIME_MS;
const SUMMARY_WINDOW_MS = 15 * 60 * 1000;
const RECOVERY_WINDOW_MS = 60 * 60 * 1000;
/** Comments (both types together) allowed per domain per day. */
const DAILY_CAP = 500;
const DAILY_KEY_TTL_SECONDS = 90000;
const GLOBAL_KEY = "pc:comments:__all";
const SAFE_DOMAIN = /^[a-z0-9.-]{1,253}$/i;

function listKey(domain: string): string {
  return "pc:comments:" + domain;
}

function dailyKey(domain: string): string {
  return "pc:comments:daily:" + domain + ":" + new Date().toISOString().slice(0, 10);
}

/** True once a domain has hit the daily cap for comments of either type. */
export async function commentsCapReached(domain: string): Promise<boolean> {
  const result = await redisPipeline([["GET", dailyKey(domain)]]);
  if (!result) return false;
  const n = Number(result[0]);
  return Number.isFinite(n) && n >= DAILY_CAP;
}

function parseEntry(raw: unknown, now: number): CommentItem | null {
  if (typeof raw !== "string") return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const rec = parsed as { p?: unknown; t?: unknown; d?: unknown };
    const t = Number(rec.t);
    const preset = getCommentPreset(rec.p);
    if (!preset || !Number.isFinite(t) || now - t > MAX_AGE_MS) return null;
    const item: CommentItem = { id: preset.id, label: preset.label, kind: preset.kind, at: t };
    if (typeof rec.d === "string" && SAFE_DOMAIN.test(rec.d)) item.domain = rec.d;
    return item;
  } catch {
    return null;
  }
}

/**
 * Deletes every entry older than the lifetime from the list that was just
 * read, from its domain's own list, and deletes their vote data. Uses LREM
 * on the exact entry so a comment posted at the same moment is never lost.
 */
async function pruneExpired(key: string, rows: unknown[]): Promise<void> {
  const now = Date.now();
  const cmds: RedisCommand[] = [];
  const staleIds: string[] = [];
  for (const raw of rows) {
    if (typeof raw !== "string") continue;
    try {
      const rec = JSON.parse(raw) as { p?: unknown; t?: unknown; d?: unknown };
      const t = Number(rec.t);
      if (!Number.isFinite(t) || now - t <= MAX_AGE_MS) continue;
      cmds.push(["LREM", key, 0, raw]);
      if (typeof rec.d === "string" && SAFE_DOMAIN.test(rec.d)) {
        if (listKey(rec.d) !== key) cmds.push(["LREM", listKey(rec.d), 0, raw]);
        if (typeof rec.p === "string") staleIds.push(commentId(rec.d, t, rec.p));
      }
    } catch {
      // malformed entry: leave it, the list expiry will clear it
    }
  }
  if (cmds.length === 0) return;
  await redisPipeline([...cmds, ...voteCleanupCommands(staleIds)]);
}

async function buildSnapshot(rows: unknown[], needDomain: boolean): Promise<CommentsSnapshot> {
  const now = Date.now();
  const all: VotableItem[] = [];
  for (const row of rows) {
    const parsed = parseEntry(row, now);
    if (!parsed) continue;
    if (needDomain && !parsed.domain) continue;
    const item: VotableItem = parsed;
    // The comment id needs the domain, so it is made before the domain is
    // removed from per-domain feed items.
    if (item.domain) item.cid = commentId(item.domain, item.at, item.id);
    if (!needDomain) delete item.domain;
    all.push(item);
  }

  await attachVotes(all);
  const items = all.filter((i) => !isHidden(i.up ?? 0, i.down ?? 0));

  let problems = 0;
  let good = 0;
  let problemsLastHour = false;
  const byPreset = new Map<string, number>();
  for (const item of items) {
    const age = now - item.at;
    if (item.kind === "problem" && age <= RECOVERY_WINDOW_MS) problemsLastHour = true;
    if (age > SUMMARY_WINDOW_MS) continue;
    if (item.kind === "problem") {
      problems++;
      byPreset.set(item.id, (byPreset.get(item.id) || 0) + 1);
    } else {
      good++;
    }
  }

  const top = [...byPreset.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id, count]) => {
      const preset = COMMENT_PRESETS.find((p) => p.id === id);
      return { short: preset ? preset.short : id, count };
    });

  return { enabled: true, items, summary: { problems, good, top }, problemsLastHour };
}

/** The current feed plus the summary numbers for one domain. */
export async function getComments(domain: string): Promise<CommentsSnapshot> {
  if (!isRedisConfigured()) return { ...EMPTY_SNAPSHOT, enabled: false };
  const key = listKey(domain);
  const result = await redisPipeline([["LRANGE", key, 0, MAX_ITEMS - 1]]);
  const rows = result && Array.isArray(result[0]) ? (result[0] as unknown[]) : [];
  const [snapshot] = await Promise.all([buildSnapshot(rows, false), pruneExpired(key, rows)]);
  return snapshot;
}

/** The site-wide feed (every domain), each item carrying its domain. */
export async function getGlobalComments(): Promise<CommentsSnapshot> {
  if (!isRedisConfigured()) return { ...EMPTY_SNAPSHOT, enabled: false };
  const result = await redisPipeline([["LRANGE", GLOBAL_KEY, 0, MAX_ITEMS - 1]]);
  const rows = result && Array.isArray(result[0]) ? (result[0] as unknown[]) : [];
  const [snapshot] = await Promise.all([buildSnapshot(rows, true), pruneExpired(GLOBAL_KEY, rows)]);
  return snapshot;
}

/**
 * Adds one comment to the domain feed and the site-wide feed. The caller has
 * already checked the same-origin guard, the per-visitor cooldown and the
 * daily caps. Problem presets also bump the existing 15-minute problem count.
 */
export async function addComment(domain: string, preset: CommentPreset): Promise<void> {
  const entry = JSON.stringify({ p: preset.id, t: Date.now(), d: domain });
  await redisPipeline([
    ["LPUSH", listKey(domain), entry],
    ["LTRIM", listKey(domain), 0, MAX_ITEMS - 1],
    ["EXPIRE", listKey(domain), LIST_TTL_SECONDS],
    ["LPUSH", GLOBAL_KEY, entry],
    ["LTRIM", GLOBAL_KEY, 0, MAX_ITEMS - 1],
    ["EXPIRE", GLOBAL_KEY, LIST_TTL_SECONDS],
    ["INCR", dailyKey(domain)],
    ["EXPIRE", dailyKey(domain), DAILY_KEY_TTL_SECONDS],
  ]);
  if (preset.kind === "problem") {
    await addProblemReport(domain);
  }
}