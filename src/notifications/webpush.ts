import type { ScheduleOptions } from './engine';

// Tier B — Web Push for INSTALLED PWAs (iOS ≥16.4 home-screen, Android, desktop).
// Free: a Cloudflare Worker (infra/push-worker) recomputes each minute and pushes.
// Inert until VITE_PUSH_WORKER_URL + VITE_VAPID_PUBLIC_KEY are configured.
// TODO(device/deploy): deploy the worker, then verify iOS PWA push within ±1 min.

const WORKER_URL = import.meta.env.VITE_PUSH_WORKER_URL as string | undefined;
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

export function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function canWebPush(): boolean {
  return (
    !!WORKER_URL &&
    !!VAPID_PUBLIC_KEY &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    isStandalone()
  );
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export async function subscribeWebPush(opts: ScheduleOptions): Promise<boolean> {
  if (!canWebPush()) return false;
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return false;

  const reg = await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!) as unknown as BufferSource,
    }));

  // Round coordinates for privacy; the worker recomputes times itself.
  const res = await fetch(`${WORKER_URL}/subscribe`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      subscription: sub,
      lat: Math.round(opts.lat * 10) / 10,
      lng: Math.round(opts.lng * 10) / 10,
      method: opts.method,
      madhab: opts.madhab,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      prayers: opts.enabledPrayers,
      wirdTime: opts.wirdTime,
    }),
  });
  return res.ok;
}

export async function unsubscribeWebPush(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  if (WORKER_URL) {
    await fetch(`${WORKER_URL}/unsubscribe`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    }).catch(() => {});
  }
  await sub.unsubscribe();
}
