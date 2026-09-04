import type { SurahFile, SurahMeta } from './types';
import meta from './surah-meta.json';
import basmalaData from './basmala.json';
import { fmt } from '@/lib/fmt';

// Per-surah JSON is code-split; Vite + Workbox precache each chunk → offline.
const modules = import.meta.glob<{ default: SurahFile }>('./surah/*.json');

export const surahMeta = meta as SurahMeta[];
/** Byte-faithful basmala (derived from Al-Fatihah 1) for surah headers. */
export const basmala: string = (basmalaData as { t: string }).t;

const cache = new Map<number, SurahFile>();

export async function loadSurah(n: number): Promise<SurahFile> {
  const hit = cache.get(n);
  if (hit) return hit;
  const key = `./surah/${fmt.pad3(n)}.json`;
  const loader = modules[key];
  if (!loader) throw new Error(`surah ${n} not found`);
  const file = (await loader()).default;
  cache.set(n, file);
  return file;
}

export function getSurahMeta(n: number): SurahMeta | undefined {
  return surahMeta.find((m) => m.n === n);
}
