# نور القرآن (Nour Al Quran) — engineering rules

Arabic-first, RTL, offline-first Quran app. PWA + Capacitor (Android now, iOS later).
Free forever, no ads, no paywall, no backend in Phase 1.

## Hard rules (override everything)
- **Quranic text is sacred & byte-faithful.** It comes ONLY from the bundled dataset
  (`src/data/surah/*.json`, built by `scripts/build-quran-data.ts` from Tanzil Uthmani via
  the QUL/quran.com API, pinned by sha256 in `quran.checksum.json`). Never type, generate,
  "fix", or normalise it on display. **`AyahText` + `Tajweed` are the ONLY components that
  render ayah text** — enforced by `tests/quran-integrity.test.ts` (all 6236 ayahs, both
  render paths, + a guard that `data-ayah-text` lives in one file). Search normalisation is a
  SEPARATE index (`src/lib/normalize.ts` → `search-index.json`).
- **Offline-first.** Everything works in airplane mode after first load (except downloads/sync).
- **Reverence.** No leaderboards/points on worship, no fire/streak emoji (use «الاستمرار»),
  calm copy on lapses.
- **Honesty.** Tasmi' measures WORD MATCH ONLY — no «تجويد»/«مخارج»/ms gauges/«إجازة»/«سند»/
  certificates. Whisper labelled «التعرّف الصوتي على الجهاز» with real accuracy.
- **No AI portraits of real reciters/scholars** — `<Avatar name=… />` (initials) only.
- Riwāyāt: **Hafs only** for now; other riwāyāt shown as «قريباً» disabled.

## Stack
Vite + React 18 + TS + Tailwind 3 + Capacitor 6. react-router v6 `createHashRouter`
(GH Pages deep links). Zustand + persist→idb-keyval. `idb`/idb-keyval for stores.
framer-motion. adhan (prayer/qibla). Intl umalqura (Hijri). @huggingface/transformers
(whisper-tiny, in a Web Worker) for Tasmi'. vite-plugin-pwa (Workbox). Vitest + Playwright.
`base: '/Nour-Al-Quran/'`, dev/preview port 5183.

## Design system
Tokens are extracted from the Stitch export (`design/stitch/`) into `tailwind.config.ts`.
Colours resolve through CSS variables (`src/styles/theme.css`) so the same token names theme
via `[data-theme=day|night|emerald|royal]`. Fonts self-hosted (`scripts/fetch-fonts.sh` →
`src/assets/fonts/`), no runtime Google Fonts. Bottom nav (RTL): الرئيسية · المصحف ·
[التسميع mic FAB] · الحفظ · الإعدادات.

## Layout
`src/app` (router + layouts), `src/components` (primitives; AyahText/Tajweed = sacred),
`src/features/*` (per feature), `src/data` (loader + generated JSON), `src/store` (zustand),
`src/notifications` (engine/native/webpush/ics/inApp), `scripts`, `tests`, `infra/push-worker`.

## Commands
`npm run dev` · `npm run check` (typecheck + tests) · `npm run build` · `npm run e2e` ·
`npm run data` (rebuild Quran dataset) · `npm run fonts` (fetch fonts).

## Working agreement
- Commit messages in English, UI strings in Arabic, comments in English.
- Apply §6 honesty/reverence corrections without asking; note them in commits.
- Ask before deviating from Stitch visuals.
- Never install a paid service; propose the free alternative.
- The full original brief lives in the approved plan; per-screen behavioural assumptions
  (no `docs/REDESIGN_SPEC.md` was provided) are noted in code comments.
