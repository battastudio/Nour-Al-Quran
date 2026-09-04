# Data & asset licences

All sources are free. Record each source + licence here as it is added.

## Quran text (bundled — sacred, byte-faithful)
- **Uthmani Hafs text** + ayah/page/juz/hizb/ruku indices — fetched from the
  quran.com / QUL API v4 (`text_uthmani`), which serves the **Tanzil** Uthmani
  script. Tanzil text: free for non-commercial + free apps under the Tanzil terms
  (attribution, no modification). We do not modify the text.
  - Source: https://api.quran.com/api/v4 · https://tanzil.net
  - Pinned by committed sha256 in `src/data/quran.checksum.json`.
  - Sajda ayah references: fixed classical set of 15 (hardcoded in the build script).

## Tafsir (on-demand, cached)
- الميسّر، ابن كثير، السعدي، الطبري، البغوي، القرطبي — quran.com/QUL tafsir API.
  Open text; attribution to each author/compiler shown in the UI.

## Fonts (self-hosted WOFF2, in `src/assets/fonts/`)
- **Amiri** & **Amiri Quran** — SIL Open Font License 1.1 (github.com/aliftype/amiri).
- **IBM Plex Sans Arabic** — SIL OFL 1.1 (github.com/IBM/plex).
- **Material Symbols Outlined** — Apache License 2.0 (github.com/google/material-design-icons).
  Fetched via jsDelivr (@fontsource, marella/material-symbols) in `scripts/fetch-fonts.sh`.

## Reciter audio (streamed, cached on download)
- everyayah.com per-ayah recitations. Each reciter's recording is used under the
  terms published by everyayah.com. No reciter photos are used — initials avatars only.

## TODO (add before shipping the relevant feature)
- [ ] `public/sounds/adhan_makkah.mp3` — a public-domain / CC adhan recording (Tier A/D).
- [ ] Adhkar & du‘ā dataset (Hisn al-Muslim, open) — keep each item's source string.
- [ ] Offline cities list (simplemaps free world cities) for manual location.
- [ ] Word-by-word / roots (Quranic Arabic Corpus, CC BY / QUL).
