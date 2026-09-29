/**
 * Preset "comments" for the live feeds. Visitors never type free text: they
 * pick one of these, and only the id is sent to the server, which looks the
 * wording up here. Wording stays neutral and symptom-only (never "scam",
 * "hacked", etc.).
 * Shared by the client components and the server code, so it must not import
 * anything server-only. Contains no secrets.
 */

export type CommentKind = "problem" | "good";

export interface CommentPreset {
  id: string;
  label: string;
  /** Short form used in the summary line ("9 login, 5 won't load"). */
  short: string;
  kind: CommentKind;
  /** Only offered after an outage: needs recent problem comments. */
  recovery?: boolean;
}

export const COMMENT_PRESETS: readonly CommentPreset[] = [
  { id: "wont-load", label: "Website won't load", short: "won't load", kind: "problem" },
  { id: "login", label: "Login not working", short: "login", kind: "problem" },
  { id: "slow", label: "Slow or timing out", short: "slow", kind: "problem" },
  { id: "payments", label: "Payments or checkout failing", short: "payments", kind: "problem" },
  { id: "app", label: "App not working", short: "app", kind: "problem" },
  { id: "error", label: "Error message showing", short: "errors", kind: "problem" },
  { id: "working", label: "Working fine for me", short: "working", kind: "good" },
  { id: "fast", label: "Loading fast", short: "fast", kind: "good" },
  { id: "back-up", label: "Back up now", short: "back up", kind: "good", recovery: true },
  { id: "recovered", label: "Was down, now recovered", short: "recovered", kind: "good", recovery: true },
];

export function getCommentPreset(id: unknown): CommentPreset | null {
  if (typeof id !== "string") return null;
  return COMMENT_PRESETS.find((p) => p.id === id) || null;
}

export interface CommentItem {
  id: string;
  label: string;
  kind: CommentKind;
  /** Epoch ms. */
  at: number;
  /** Only set on the site-wide (home page) feed. */
  domain?: string;
}

export interface CommentsSnapshot {
  /** False when Redis isn't configured: the cards hide themselves. */
  enabled: boolean;
  /** Newest first, at most 100. */
  items: CommentItem[];
  summary: {
    /** Problem comments in the last 15 minutes. */
    problems: number;
    /** "Working well" comments in the last 15 minutes. */
    good: number;
    /** Problem comments in the last 15 minutes, grouped, biggest first. */
    top: { short: string; count: number }[];
  };
  /** True when there was a problem comment in the last hour. */
  problemsLastHour: boolean;
}

export const EMPTY_SNAPSHOT: CommentsSnapshot = {
  enabled: true,
  items: [],
  summary: { problems: 0, good: 0, top: [] },
  problemsLastHour: false,
};

/** Browser event the dropdown fires so a feed on the same page updates at once. */
export const COMMENTS_UPDATED_EVENT = "pc:comments-updated";

export interface CommentsUpdatedDetail {
  domain: string;
  snapshot: CommentsSnapshot;
}
