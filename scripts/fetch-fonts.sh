#!/usr/bin/env bash
# Fetch self-hosted WOFF2 fonts into src/assets/fonts/ (Arabic subsets).
# No runtime Google Fonts — these are bundled by Vite and precached by Workbox.
set -euo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)/src/assets/fonts"
mkdir -p "$DIR"

FS="https://cdn.jsdelivr.net/npm/@fontsource"

dl() { # url  outfile
  echo "→ $2"
  curl -fsSL "$1" -o "$DIR/$2"
}

# Amiri Quran (ayah text) — 400 only, Arabic subset
dl "$FS/amiri-quran/files/amiri-quran-arabic-400-normal.woff2" "amiri-quran.woff2"

# Amiri (surah titles) — 400 + 700
dl "$FS/amiri/files/amiri-arabic-400-normal.woff2" "amiri-regular.woff2"
dl "$FS/amiri/files/amiri-arabic-700-normal.woff2" "amiri-bold.woff2"

# IBM Plex Sans Arabic (UI) — 400/500/600/700
for w in 400 500 600 700; do
  dl "$FS/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-$w-normal.woff2" \
     "ibm-plex-sans-arabic-$w.woff2"
done

# Material Symbols Outlined (icons) — variable woff2 from marella/material-symbols
dl "https://cdn.jsdelivr.net/npm/material-symbols/material-symbols-outlined.woff2" \
   "material-symbols-outlined.woff2"

echo "Fonts fetched into $DIR"
ls -la "$DIR"
