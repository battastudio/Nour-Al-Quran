# Push notifications — how they work & how to turn them on

The app has **four notification tiers**; it auto-picks the best one available. You only need
the Cloudflare worker for the **web-push** tier (the one that makes **iOS** work).

| Tier | Where it works | Needs |
|---|---|---|
| A · Native (Capacitor `LocalNotifications`) | Android app build (iOS with an Apple Dev account) | the native wrapper |
| **B · Web Push** | **installed PWA — iOS ≥16.4 (home-screen), Android, desktop** | **the Cloudflare worker (below)** |
| C · Calendar (.ics) | any iPhone today, zero setup | nothing — user taps «تصدير للتقويم» |
| D · In-app | while the app is open | nothing |

## The iOS reality (important)
Real push delivered **when the app is closed** requires a server to send it — that's true on
every platform. iOS additionally requires the PWA to be **installed to the Home Screen** and
**iOS ≥16.4**. The app can't do closed-app push purely client-side (iOS has no background
scheduling API). That's why we add the small free worker in `infra/push-worker/`.

## Your steps (one-time, ~15 min, free, no credit card)
1. **VAPID keys:** `npx web-push generate-vapid-keys` → copy the **public** and **private**.
2. **Deploy the worker:** follow `infra/push-worker/README.md`
   (`wrangler login` → create KV → set 3 secrets → `wrangler deploy`). Note the worker URL.
3. **Tell the site about it:** repo → Settings → Secrets and variables → Actions → **Variables**:
   - `VITE_PUSH_WORKER_URL` = your worker URL
   - `VITE_VAPID_PUBLIC_KEY` = your VAPID **public** key
   Re-run the **Deploy PWA to GitHub Pages** action.
4. **On your iPhone (iOS ≥16.4):** open the site in Safari → Share → **Add to Home Screen** →
   open the installed app → Settings → notifications → **تفعيل** (grant permission) → set a
   wird time 1–2 minutes ahead (or wait for the next prayer) → lock the phone → the push
   should arrive.

## What gets pushed
Prayer times (per your saved location, method & madhab), your daily **wird**, **Friday
Kahf** (09:00 local), and a **Ramadan** nudge (20:00 local during Ramadan). Coordinates are
rounded before they reach the worker; it stores only what's needed to compute your times.

## If it doesn't arrive
- Confirm the app is the **home-screen** install (not a Safari tab) and iOS is **≥16.4**.
- Confirm the two `VITE_*` variables are set and the site was **re-deployed** after setting them.
- `curl https://<worker>/health` → `{ok:true}`; check the Worker's logs in the Cloudflare
  dashboard around a prayer minute.
- The encryption path follows the Web Push RFCs but is best confirmed on a real device —
  if a push never arrives, capture the Worker log line and we'll debug the send.
