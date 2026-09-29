/**
 * Per-domain live comment feed made of preset comments only (see
 * lib/comments/commentPresets.ts). Each domain has one Redis list holding
 * the newest 100 entries (LPUSH + LTRIM, so the oldest drops off by itself)
 * with a 24-hour expiry as a safety net.
 * Problem presets also add to the existing 15-minute problem count
 * (lib/server/problemReports.ts). "Working well" presets never do.
 * SERVER-ONLY. Fails soft to an empty feed if Redis isn't configured or is
 * unreachable. Contains no secrets and stores no visitor identity.
 */

import "server-only";
import { redisPipeline, isRedisConfigured } from "@/lib/db/redis";
import { addProblemReport } from "@/lib/server/problemReports";
import {
  COMMENT_PRESETS,
  EMPTY_SNAPSHOT,
  getCommentPreset,
  type CommentItem,
  type CommentPreset,
  type CommentsSnapshot,
} from "@/lib/comments/commentPresets";

const MAX_ITEMS = 100;
const LIST_TTL_SECONDS = 86400;
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const SUMMARY_WINDOW_MS = 15 * 60 * 1000;
const RECOVERY_WINDOW_MS = 60 * 60 * 1000;
/** Comments (both types together) allowed per domain per day. */
const DAILY_CAP = 500;
const DAILY_KEY_TTL_SECONDS = 90000;

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
    const p = (parsed as { p?: unknown }).p;
    const t = Number((parsed as { t?: unknown }).t);
    const preset = getCommentPreset(p);
    if (!preset || !Number.isFinite(t) || now - t > MAX_AGE_MS) return null;
    return { id: preset.id, label: preset.label, kind: preset.kind, at: t };
  } catch {
    return null;
  }
}

/** The current feed plus the summary numbers for this domain. */
export async function getComments(domain: string): Promise<CommentsSnapshot> {
  if (!isRedisConfigured()) return { ...EMPTY_SNAPSHOT, enabled: false };
  const result = await redisPipeline([["LRANGE", listKey(domain), 0, MAX_ITEMS - 1]]);
  const rows = result && Array.isArray(result[0]) ? (result[0] as unknown[]) : [];
  const now = Date.now();
  const items: CommentItem[] = [];
  for (const row of rows) {
    const item = parseEntry(row, now);
    if (item) items.push(item);
  }

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

/**
 * Adds one comment. The caller has already checked the same-origin guard,
 * the per-visitor cooldown and the daily caps. Problem presets also bump
 * the existing 15-minute problem count.
 */
export async function addComment(domain: string, preset: CommentPreset): Promise<void> {
  const entry = JSON.stringify({ p: preset.id, t: Date.now() });
  await redisPipeline([
    ["LPUSH", listKey(domain), entry],
    ["LTRIM", listKey(domain), 0, MAX_ITEMS - 1],
    ["EXPIRE", listKey(domain), LIST_TTL_SECONDS],
    ["INCR", dailyKey(domain)],
    ["EXPIRE", dailyKey(domain), DAILY_KEY_TTL_SECONDS],
  ]);
  if (preset.kind === "problem") {
    await addProblemReport(domain);
  }
}
