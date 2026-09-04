// Shapes for the bundled Quran dataset. `t` is SACRED — byte-faithful Uthmani text
// copied verbatim from the pinned source; never mutate, normalise, or regenerate it.
// Short keys keep the per-surah JSON small.

export interface Ayah {
  s: number; // surah 1..114
  a: number; // ayah number within surah
  t: string; // sacred Uthmani text — byte-faithful
  p: number; // mushaf page 1..604
  j: number; // juz 1..30
  h: number; // hizb quarter 1..240
  r: number; // ruku (cumulative)
  sajda?: boolean; // true on the 15 sajda ayahs (type left out — varies by school)
}

export type Revelation = 'meccan' | 'medinan';

export interface SurahMeta {
  n: number; // surah number 1..114
  name: string; // Arabic name, e.g. الفاتحة
  nameLatin: string; // transliteration, e.g. Al-Fatihah
  ayahCount: number;
  revelation: Revelation;
  bismillah: boolean; // whether a leading basmala is shown (false for At-Tawbah)
}

export interface SurahFile {
  meta: SurahMeta;
  ayahs: Ayah[];
}

export interface QuranChecksum {
  algo: 'sha256';
  ayahCount: number;
  textHash: string; // sha256 of all `t` concatenated in canonical surah/ayah order
  perSurah: Record<string, string>;
}
