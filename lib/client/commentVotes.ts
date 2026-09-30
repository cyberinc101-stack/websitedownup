"use client";

/**
 * Remembers, in this browser only, each comment's vote state (current
 * choice and how many of the 3 vote actions were used) so the buttons show
 * it and lock when the actions run out, plus when the vote ad last showed.
 * The server is the real limit; this only mirrors it. Entries are dropped
 * after the comment lifetime (3 hours).
 * CLIENT-ONLY. Contains no secrets.
 */

export type MyVote = "up" | "down";

export interface MyVoteState {
  vote: MyVote | null;
  used: number;
}

/** Vote actions per comment: vote, undo, vote again. Matches the server. */
export const MAX_VOTE_ACTIONS = 3;

const VOTES_KEY = "isSiteUp:commentVotes:v2";
const AD_KEY = "isSiteUp:voteAdShownAt";
const LIFETIME_MS = 3 * 60 * 60 * 1000;
/** After the vote ad shows, the next one waits this long. */
const AD_INTERVAL_MS = 10 * 60 * 1000;

interface Stored {
  v: MyVote | null;
  n: number;
  t: number;
}

function readAll(): Record<string, Stored> {
  try {
    const raw = window.localStorage.getItem(VOTES_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== "object") return {};
    const now = Date.now();
    const out: Record<string, Stored> = {};
    for (const [cid, entry] of Object.entries(parsed as Record<string, unknown>)) {
      const e = entry as { v?: unknown; n?: unknown; t?: unknown };
      const v = e.v === "up" || e.v === "down" ? e.v : null;
      if (typeof e.t === "number" && typeof e.n === "number" && now - e.t <= LIFETIME_MS) {
        out[cid] = { v, n: e.n, t: e.t };
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function getMyVotes(): Record<string, MyVoteState> {
  if (typeof window === "undefined") return {};
  const all = readAll();
  const out: Record<string, MyVoteState> = {};
  for (const cid of Object.keys(all)) out[cid] = { vote: all[cid].v, used: all[cid].n };
  return out;
}

/** Saves the visitor's current choice (null = none) and actions used. */
export function saveMyVote(cid: string, vote: MyVote | null, used: number): void {
  if (typeof window === "undefined") return;
  const all = readAll();
  all[cid] = { v: vote, n: used, t: Date.now() };
  try {
    window.localStorage.setItem(VOTES_KEY, JSON.stringify(all));
  } catch {
    // storage blocked: the server still enforces the limit
  }
}

/** True when the vote ad should show before the next vote. */
export function voteAdDue(): boolean {
  try {
    const last = Number(window.sessionStorage.getItem(AD_KEY) || "0");
    return !Number.isFinite(last) || Date.now() - last > AD_INTERVAL_MS;
  } catch {
    return true;
  }
}

export function markVoteAdShown(): void {
  try {
    window.sessionStorage.setItem(AD_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}