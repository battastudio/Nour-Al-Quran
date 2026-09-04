import { get as idbGet, set as idbSet } from 'idb-keyval';

// Tafsir (Arabic commentary — NOT sacred text) fetched on demand from the
// quran.com/QUL API and cached in IndexedDB so it works offline afterwards.
const API = 'https://api.quran.com/api/v4';

export interface TafsirSource {
  id: number;
  name: string;
  author: string;
}

// Curated Arabic tafsirs (quran.com resource ids). If an id ever changes the
// fetch fails gracefully and the user can pick another source.
export const TAFSIR_SOURCES: TafsirSource[] = [
  { id: 16, name: 'الميسّر', author: 'مجمع الملك فهد' },
  { id: 14, name: 'ابن كثير', author: 'ابن كثير' },
  { id: 91, name: 'السعدي', author: 'عبد الرحمن السعدي' },
  { id: 15, name: 'الطبري', author: 'ابن جرير الطبري' },
  { id: 90, name: 'البغوي', author: 'البغوي' },
  { id: 93, name: 'القرطبي', author: 'القرطبي' },
];

export async function fetchTafsir(sourceId: number, verseKey: string): Promise<string> {
  const cacheKey = `tafsir:${sourceId}:${verseKey}`;
  const cached = await idbGet<string>(cacheKey);
  if (cached != null) return cached;

  const res = await fetch(`${API}/tafsirs/${sourceId}/by_ayah/${verseKey}`, {
    headers: { accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`tafsir ${sourceId} ${verseKey}: HTTP ${res.status}`);
  const data = (await res.json()) as { tafsir?: { text?: string } };
  const text = data.tafsir?.text ?? '';
  await idbSet(cacheKey, text);
  return text;
}
