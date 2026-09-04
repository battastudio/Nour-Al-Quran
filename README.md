# نور القرآن — Nour Al Quran

Arabic-first, RTL, **offline-first** Quran app: reading (scroll/mushaf/focus), tafsir, audio,
memorisation (SM-2), on-device Tasmi' (Whisper), prayer times/Qibla, and reliable adhan/wird
notifications. Free forever, no ads, no backend. PWA + Android (Capacitor); iOS later.

## Quick start
```bash
npm install
npm run fonts     # fetch self-hosted WOFF2 (one-time)
npm run data      # build the byte-faithful Quran dataset (one-time; committed)
npm run dev       # http://localhost:5183/Nour-Al-Quran/
```

## Checks
```bash
npm run check     # typecheck + unit tests (integrity over all 6236 ayahs)
npm run build     # PWA production build
npm run e2e       # Playwright RTL smoke (mobile 390px)
```

## Notifications (4 tiers, one engine)
`src/notifications/engine.ts` computes the schedule; delivered via **A** native
(Capacitor, Android), **B** web push (installed PWA + `infra/push-worker`), **C** `.ics`
calendar export (works on every iPhone today), **D** in-app foreground adhan.

See `CLAUDE.md` for the engineering rules (sacred-text integrity, reverence, honesty).
