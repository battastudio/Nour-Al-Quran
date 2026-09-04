import { computeDue, type Sub } from './schedule';
import { sendPush, type Vapid } from './webpush';

// Cloudflare Worker: stores push subscriptions in KV and, every minute (cron), sends the
// due prayer/wird/Kahf/Ramadan notifications. Free tier, no card. See README.md.

export interface Env {
  SUBS: KVNamespace;
  VAPID_PUBLIC: string;
  VAPID_PRIVATE: string;
  VAPID_SUBJECT: string; // "mailto:you@example.com"
  ALLOW_ORIGIN?: string; // e.g. "https://battastudio.github.io"
}

const KEY = 'sub:';
async function endpointId(endpoint: string): Promise<string> {
  const data = new TextEncoder().encode(endpoint) as unknown as BufferSource;
  const h = await crypto.subtle.digest('SHA-256', data);
  return KEY + [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

function cors(env: Env): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': env.ALLOW_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
  };
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors(env) });
    const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json', ...cors(env) } });

    if (req.method === 'POST' && url.pathname === '/subscribe') {
      const sub = (await req.json()) as Sub;
      if (!sub?.subscription?.endpoint) return json({ error: 'bad subscription' }, 400);
      await env.SUBS.put(await endpointId(sub.subscription.endpoint), JSON.stringify(sub));
      return json({ ok: true });
    }
    if (req.method === 'POST' && url.pathname === '/unsubscribe') {
      const { endpoint } = (await req.json()) as { endpoint?: string };
      if (endpoint) await env.SUBS.delete(await endpointId(endpoint));
      return json({ ok: true });
    }
    if (url.pathname === '/health') return json({ ok: true, service: 'nour-push' });
    return json({ error: 'not found' }, 404);
  },

  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(sweep(env, new Date()));
  },
};

/** One cron tick: send everything due in the next 60s, prune dead subscriptions. */
export async function sweep(env: Env, now: Date): Promise<void> {
  const vapid: Vapid = { publicKey: env.VAPID_PUBLIC, privateKey: env.VAPID_PRIVATE, subject: env.VAPID_SUBJECT };
  let cursor: string | undefined;
  do {
    const list = await env.SUBS.list({ prefix: KEY, cursor });
    cursor = list.list_complete ? undefined : list.cursor;
    for (const k of list.keys) {
      const raw = await env.SUBS.get(k.name);
      if (!raw) continue;
      const sub = JSON.parse(raw) as Sub;
      const due = computeDue(sub, now);
      for (const n of due) {
        try {
          const res = await sendPush(sub.subscription, JSON.stringify({ title: n.title, body: n.body, url: n.url, tag: n.tag }), vapid);
          if (res.status === 404 || res.status === 410) await env.SUBS.delete(k.name); // gone
        } catch { /* transient — retry next tick */ }
      }
    }
  } while (cursor);
}
