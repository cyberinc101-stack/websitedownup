/**
 * Accurate / not accurate votes on live comments.
 * Redis keys, all deleted at exactly the moment their comment expires
 * (comment time + COMMENT_LIFETIME_MS), whether or not anyone votes again:
 *  - pc:vc:<cid>  hash { up, down } running totals
 *  - pc:vv:<cid>  hash { <hashed IP>: "up" | "down" } the visitor's current vote
 *  - pc:va:<cid>  hash { <hashed IP>: number } how many vote actions the
 *                 visitor has used on this comment
 * VOTE RULE: each visitor gets MAX_VOTE_ACTIONS actions per comment (vote,
 * undo, vote again). After that the vote is locked. Switching straight from
 * one choice to the other is not allowed: undo first, then vote.
 * The comment id is a hash of domain + timestamp + preset, so existing
 * comments get ids without changing how they are stored.
 * SERVER-ONLY. Fails soft. Stores only hashed, truncated IPs (never raw).
 */

import "server-only";
import { createHash } from "node:crypto";
import { redisPipeline, type RedisCommand } from "@/lib/db/redis";
import type { VoteChoice } from "@/lib/comments/votes";

/** How long a comment (and its votes) lives. Single source of truth. */
export const COMMENT_LIFETIME_MS = 3 * 60 * 60 * 1000;
/** Vote actions (add, undo, add again) each visitor gets per comment. */
export const MAX_VOTE_ACTIONS = 3;
const MAX_ITEMS = 100;

export function commentId(domain: string, at: number, presetId: string): string {
  return createHash("sha1").update(domain + "|" + at + "|" + presetId).digest("hex").slice(0, 16);
}

function countKey(cid: string): string {
  return "pc:vc:" + cid;
}

function voterKey(cid: string): string {
  return "pc:vv:" + cid;
}

function actionsKey(cid: string): string {
  return "pc:va:" + cid;
}

function toCount(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Redis commands that delete the vote data for these comments. */
export function voteCleanupCommands(cids: string[]): RedisCommand[] {
  return cids.map((cid) => ["DEL", countKey(cid), voterKey(cid), actionsKey(cid)] as RedisCommand);
}

/** Fills in up/down on each item that has a cid, in one Redis round trip. */
export async function attachVotes(items: Array<{ cid?: string; up?: number; down?: number }>): Promise<void> {
  const withId = items.filter((i) => typeof i.cid === "string");
  if (withId.length === 0) return;
  const result = await redisPipeline(withId.map((i) => ["HMGET", countKey(i.cid as string), "up", "down"]));
  if (!result) return;
  withId.forEach((item, idx) => {
    const row = result[idx];
    if (Array.isArray(row)) {
      item.up = toCount(row[0]);
      item.down = toCount(row[1]);
    }
  });
}

/**
 * The timestamp (ms) of this comment if it is currently in that domain's feed
 * and still within its lifetime, otherwise null.
 */
export async function findCommentTime(domain: string, cid: string): Promise<number | null> {
  const result = await redisPipeline([["LRANGE", "pc:comments:" + domain, 0, MAX_ITEMS - 1]]);
  const rows = result && Array.isArray(result[0]) ? (result[0] as unknown[]) : [];
  const now = Date.now();
  for (const raw of rows) {
    if (typeof raw !== "string") continue;
    try {
      const rec = JSON.parse(raw) as { p?: unknown; t?: unknown; d?: unknown };
      if (rec.d !== domain || typeof rec.p !== "string") continue;
      const t = Number(rec.t);
      if (!Number.isFinite(t) || commentId(domain, t, rec.p) !== cid) continue;
      return now - t <= COMMENT_LIFETIME_MS ? t : null;
    } catch {
      // skip malformed entry
    }
  }
  return null;
}

export type VoteOutcome =
  | { ok: true; up: number; down: number; mine: VoteChoice | null; used: number }
  | { ok: false; reason: "locked" | "switch"; mine: VoteChoice | null; used: number };

/**
 * Applies one vote action for this visitor and returns the new totals, or a
 * refusal ("locked" once all actions are used, "switch" for a direct change).
 * Sending the state the visitor is already in changes nothing and uses no
 * action, so a double tap can't burn their limit or double count.
 * The vote keys are set to expire when the comment itself expires.
 */
export async function castVote(
  cid: string,
  clientKey: string,
  vote: VoteChoice | "none",
  commentAt: number
): Promise<VoteOutcome | null> {
  const prior = await redisPipeline([
    ["HGET", voterKey(cid), clientKey],
    ["HGET", actionsKey(cid), clientKey],
  ]);
  if (!prior) return null;
  const before: VoteChoice | null = prior[0] === "up" || prior[0] === "down" ? prior[0] : null;
  const usedBefore = Math.floor(toCount(prior[1]));
  const after: VoteChoice | null = vote === "none" ? null : vote;
  const expireAt = Math.floor((commentAt + COMMENT_LIFETIME_MS) / 1000);

  const cmds: RedisCommand[] = [];
  let used = usedBefore;

  if (before !== after) {
    if (usedBefore >= MAX_VOTE_ACTIONS) {
      return { ok: false, reason: "locked", mine: before, used: usedBefore };
    }
    if (before !== null && after !== null) {
      return { ok: false, reason: "switch", mine: before, used: usedBefore };
    }
    if (after !== null) {
      cmds.push(["HINCRBY", countKey(cid), after, 1]);
      cmds.push(["HSET", voterKey(cid), clientKey, after]);
    } else if (before !== null) {
      cmds.push(["HINCRBY", countKey(cid), before, -1]);
      cmds.push(["HDEL", voterKey(cid), clientKey]);
    }
    cmds.push(["HINCRBY", actionsKey(cid), clientKey, 1]);
    used = usedBefore + 1;
  }

  cmds.push(["EXPIREAT", countKey(cid), expireAt]);
  cmds.push(["EXPIREAT", voterKey(cid), expireAt]);
  cmds.push(["EXPIREAT", actionsKey(cid), expireAt]);
  cmds.push(["HMGET", countKey(cid), "up", "down"]);

  const result = await redisPipeline(cmds);
  if (!result) return null;
  const counts = result[result.length - 1];
  if (!Array.isArray(counts)) return null;
  return { ok: true, up: toCount(counts[0]), down: toCount(counts[1]), mine: after, used };
}