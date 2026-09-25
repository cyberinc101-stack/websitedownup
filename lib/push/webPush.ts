/**
 * Configures the `web-push` library from VAPID env vars. VAPID keys are
 * how the browser verifies our server is allowed to push to it -- they
 * are free to generate (npx web-push generate-vapid-keys) and cost
 * nothing to use; there is no push-sending fee from any party here.
 * SERVER-ONLY.
 */
import "server-only";
import webpush from "web-push";

let configured = false;

export function isPushConfigured(): boolean {
  return Boolean(
    (process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) &&
      process.env.VAPID_PRIVATE_KEY
  );
}

export function getWebPush(): typeof webpush {
  if (!configured && isPushConfigured()) {
    const publicKey = (process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) as string;
    const privateKey = process.env.VAPID_PRIVATE_KEY as string;
    const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";
    webpush.setVapidDetails(subject, publicKey, privateKey);
    configured = true;
  }
  return webpush;
}
