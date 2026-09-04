// Search normalization ONLY. This never touches displayed ayah text — it feeds
// the separate search index (build-time) and normalizes user queries (runtime).
// Shared by scripts/build-quran-data.ts and the search feature so both agree.

// Tashkeel, Quranic annotation marks, tatweel, and the superscript alef.
const STRIP = /[ؐ-ًؚ-ٰٟۖ-ۜ۟-۪ۨ-ۭـ]/g;

/** Fold a string to its searchable form (diacritic-insensitive, alef/ya/hamza unified). */
export function normalize(input: string): string {
  return input
    .replace(STRIP, '')
    .replace(/[آأإٱ]/g, 'ا') // آ أ إ ٱ → ا
    .replace(/ى/g, 'ي') // ى → ي
    .replace(/ة/g, 'ه') // ة → ه
    .replace(/ؤ/g, 'و') // ؤ → و
    .replace(/ئ/g, 'ي') // ئ → ي
    .replace(/ء/g, '') // ء (standalone hamza) → drop
    .replace(/\s+/g, ' ')
    .trim();
}
