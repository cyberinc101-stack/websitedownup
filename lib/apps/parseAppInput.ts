/**
 * Turns whatever the visitor pasted (an App Store link, "id123456" or a
 * bare numeric id) into an App Store app id. Google Play links and package
 * names are recognised only so the tool can explain it's App Store only.
 *
 * SECURITY: the id is digits only; the server only ever puts it into
 * requests to fixed Apple hosts.
 * CLIENT-SAFE, pure. Contains no secrets.
 */

const APPLE_ID = /^\d{5,12}$/;
const PACKAGE_NAME = /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z0-9_]+)+$/;
const MAX_INPUT = 500;

export type ParsedAppInput = { kind: "apple"; id: string } | { kind: "google" } | null;

export function parseAppInput(raw: string): ParsedAppInput {
  const input = raw.trim().slice(0, MAX_INPUT);
  if (!input) return null;

  let url: URL | null = null;
  try {
    url = new URL(/^https?:\/\//i.test(input) ? input : "https://" + input);
  } catch {
    url = null;
  }
  if (url) {
    const host = url.hostname.toLowerCase();
    if (host === "apps.apple.com" || host === "itunes.apple.com") {
      const m = url.pathname.match(/\/id(\d{5,12})(?:\/|$)/);
      if (m) return { kind: "apple", id: m[1] };
    }
    if (host === "play.google.com") return { kind: "google" };
  }

  const bare = input.replace(/^id/i, "");
  if (APPLE_ID.test(bare)) return { kind: "apple", id: bare };
  if (PACKAGE_NAME.test(input) && /^(com|org|net|io|app|co|de|me)\./i.test(input)) return { kind: "google" };
  return null;
}

export function appleAppId(raw: string): string | null {
  const p = parseAppInput(raw);
  return p && p.kind === "apple" ? p.id : null;
}

export const ANDROID_MESSAGE =
  "App worth works for iPhone and iPad apps from the App Store. Google Play apps aren't supported yet.";
export const INPUT_MESSAGE = "Paste an App Store link, like apps.apple.com/us/app/name/id123456789.";
