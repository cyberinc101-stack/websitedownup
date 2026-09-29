"use client";

/**
 * Remembers, in this browser only, which comments the visitor has voted on
 * (so the buttons show their choice) and when the vote ad last showed.
 * Vote entries are dropped after the comment lifetime (3 hours).
 * CLIENT-ONLY. Contains no secrets.
 */

export type MyVote = "up" | "down";

const VOTES_KEY = "isSiteUp:commentVotes:v1";
const AD_KEY = "isSiteUp:voteAdShownAt";
const LIFETIME_MS = 3 * 60 * 60 * 1000;
/** After the vote ad shows, the next one waits this long. */
const AD_INTERVAL_MS = 10 * 60 * 1000;

interface Stored {
  v: MyVote;
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
      const e = entry as { v?: unknown; t?: unknown };
      if ((e.v === "up" || e.v === "down") && typeof e.t === "number" && now - e.t <= LIFETIME_MS) {
        out[cid] = { v: e.v, t: e.t };
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function getMyVotes(): Record<string, MyVote> {
  if (typeof window === "undefined") return {};
  const all = readAll();
  const out: Record<string, MyVote> = {};
  for (const cid of Object.keys(all)) out[cid] = all[cid].v;
  return out;
}

/** Pass null to forget the vote. */
export function saveMyVote(cid: string, vote: MyVote | null): void {
  if (typeof window === "undefined") return;
  const all = readAll();
  if (vote) all[cid] = { v: vote, t: Date.now() };
  else delete all[cid];
  try {
    window.localStorage.setItem(VOTES_KEY, JSON.stringify(all));
  } catch {
    // storage blocked: the vote still counts on the server
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