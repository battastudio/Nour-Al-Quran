# nour-push — Web Push worker (Cloudflare, free)

Sends prayer / wird / Friday-Kahf / Ramadan push notifications to installed PWAs
(iOS ≥16.4 home-screen, Android, desktop). Free tier, no credit card.

- `src/schedule.ts` — server mirror of the app's notification engine (adhan, tz-explicit,
  unit-tested).
- `src/webpush.ts` — RFC 8291 (aes128gcm) + RFC 8292 (VAPID) via Web Crypto.
- `src/worker.ts` — `POST /subscribe`, `POST /unsubscribe`, `/health`, and a **cron every
  minute** that pushes what's due in the next 60 s and prunes dead subscriptions.

## Deploy (once)
```sh
cd infra/push-worker && npm install
npm i -g wrangler && wrangler login

# 1) VAPID keys (keep both):
npx web-push generate-vapid-keys

# 2) KV store — paste the printed id into wrangler.toml (kv_namespaces.id):
wrangler kv namespace create SUBS

# 3) Secrets:
wrangler secret put VAPID_PUBLIC     # the base64url public key
wrangler secret put VAPID_PRIVATE    # the base64url private key
wrangler secret put VAPID_SUBJECT    # e.g. mailto:you@example.com

# 4) Ship it:
wrangler deploy
```
Note the deployed URL (e.g. `https://nour-push.<you>.workers.dev`).

## Wire the app
In the **site repo** → Settings → Secrets and variables → Actions → **Variables**:
- `VITE_PUSH_WORKER_URL` = the worker URL
- `VITE_VAPID_PUBLIC_KEY` = the same public key

Re-run the Pages deploy. `canWebPush()` in `src/notifications/webpush.ts` then activates the
"تفعيل الإشعارات" button for installed users.

## Verify
```sh
npm test                                   # schedule "due" windows across TZ
wrangler dev                               # local; POST /subscribe then a forced tick
curl -XPOST localhost:8787/health          # {ok:true}
```
On device (iPhone ≥16.4): Add to Home Screen → open → enable notifications → set a wird time
1–2 min out (or wait for a prayer) → confirm it arrives with the app closed.

## Cost / scale
KV free tier: 100k reads/day, 1k writes/day. The cron reads all subs each minute
(1440 × N reads/day); fine for a few hundred subscribers. For more, shard by minute-of-day
or move to a Durable Object alarm per subscriber.
