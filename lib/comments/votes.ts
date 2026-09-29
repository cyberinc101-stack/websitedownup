/**
 * Shared (client + server) vote types and thresholds for live comments.
 * No Redis or server-only imports here, so components can use it too.
 */

import type { CommentItem } from "@/lib/comments/commentPresets";

export type VoteChoice = "up" | "down";

/** A comment plus its id and accurate / not accurate totals. */
export interface VotableItem extends CommentItem {
  cid?: string;
  up?: number;
  down?: number;
}

/** Hidden from every feed and count at this many downvotes... */
const HIDE_MIN_DOWN = 5;
/** ...as long as downvotes are more than this multiple of upvotes. */
const HIDE_RATIO = 2;
/** Shown dimmed with a "Disputed" label from here. */
const DISPUTE_MIN_DOWN = 3;

export function isHidden(up: number, down: number): boolean {
  return down >= HIDE_MIN_DOWN && down > up * HIDE_RATIO;
}

export function isDisputed(up: number, down: number): boolean {
  return down >= DISPUTE_MIN_DOWN && down > up;
}