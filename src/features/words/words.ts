import { get as idbGet, set as idbSet } from 'idb-keyval';

// Word-by-word breakdown (text from the same Tanzil/QUL Uthmani source + gloss +
// transliteration), fetched on demand and cached in IndexedDB. Root/grammar
// morphology is not exposed by this API — shown as «قريباً» in the UI.
const API = 'https://api.quran.com/api/v4';

export interface WordInfo {
  text: string; // Uthmani word (same source as the bundled dataset)
  translation: string; // English gloss (labelled honestly in the UI)
  translit: string;
}

interface ApiWord {
  char_type_name?: string;
  text_uthmani?: string;
  translation?: { text?: string };
  transliteration?: { text?: string };
}

export async function fetchWords(verseKey: string): Promise<WordInfo[]> {
  const cacheKey = `words:${verseKey}`;
  const cached = await idbGet<WordInfo[]>(cacheKey);
  if (cached) return cached;

  const url = `${API}/verses/by_key/${verseKey}?words=true&word_fields=text_uthmani,transliteration&word_translation_language=en`;
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`words ${verseKey}: HTTP ${res.status}`);
  const data = (await res.json()) as { verse?: { words?: ApiWord[] } };

  const words: WordInfo[] = (data.verse?.words ?? [])
    .filter((w) => w.char_type_name === 'word' && w.text_uthmani)
    .map((w) => ({
      text: w.text_uthmani ?? '',
      translation: w.translation?.text ?? '',
      translit: w.transliteration?.text ?? '',
    }));
  await idbSet(cacheKey, words);
  return words;
}
