"use client";

/**
 * Browser Web Push wiring for the alert toggle. Free -- native Push API
 * talking only to our own /api/push/subscribe route, no SMS/email
 * provider involved. Silently no-ops if the browser doesn'"'"'t support push
 * or permission is denied, rather than throwing.
 */

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64Safe);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function isPushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;
  try {
    await navigator.serviceWorker.register("/sw.js");
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}

export async function subscribeToDomain(domain: string): Promise<boolean> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey || !isPushSupported()) return false;

  if (Notification.permission === "default") {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;
  }
  if (Notification.permission !== "granted") return false;

  const registration = await getRegistration();
  if (!registration) return false;

  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ||
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }));

  try {
    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain, subscription: subscription.toJSON() }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function unsubscribeFromDomain(domain: string): Promise<void> {
  if (!isPushSupported()) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;
    // The same browser subscription is shared across every domain the
    // user has alerts on, so we only tell the server to stop sending
    // this domain'"'"'s notifications to it -- we do NOT call
    // subscription.unsubscribe(), which would kill alerts for every
    // other saved site too.
    await fetch("/api/push/subscribe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain, subscription: subscription.toJSON() }),
    });
  } catch {
    // best-effort; the local alert flag is already off either way
  }
}
