import { ayahAudioUrl } from '@/features/audio/player';
import { getSurahMeta } from '@/data/loader';

// Pre-fetch a surah's per-ayah mp3s into the Workbox 'audio' runtime cache so
// the reciter plays fully offline. Same Cache Storage bucket the service worker
// fills lazily on play (CacheFirst, everyayah.com) — so a downloaded surah is
// indistinguishable from one cached by listening.
const AUDIO_CACHE = 'audio';
const CONCURRENCY = 4;

export async function downloadSurah(
  reciter: string,
  surah: number,
  onProgress: (done: number, total: number) => void,
): Promise<void> {
  const cache = await caches.open(AUDIO_CACHE);
  const total = getSurahMeta(surah)?.ayahCount ?? 0;
  let done = 0;
  let next = 1;

  // Small worker pool: keep a few requests in flight without hammering the CDN.
  const worker = async (): Promise<void> => {
    while (next <= total) {
      const a = next++;
      const url = ayahAudioUrl(reciter, surah, a);
      try {
        const res = await fetch(url);
        if (res.ok) await cache.put(url, res.clone());
      } catch {
        // Swallow individual failures; the ayah stays uncached and can be
        // re-fetched on play. Still counted so progress reaches 100%.
      }
      done++;
      onProgress(done, total);
    }
  };

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, total) }, worker));
}

export async function deleteSurah(reciter: string, surah: number): Promise<void> {
  const cache = await caches.open(AUDIO_CACHE);
  const total = getSurahMeta(surah)?.ayahCount ?? 0;
  for (let a = 1; a <= total; a++) {
    await cache.delete(ayahAudioUrl(reciter, surah, a));
  }
}

// Cheap proxy: the first ayah being cached implies the surah was downloaded.
export async function isSurahDownloaded(reciter: string, surah: number): Promise<boolean> {
  const cache = await caches.open(AUDIO_CACHE);
  return Boolean(await cache.match(ayahAudioUrl(reciter, surah, 1)));
}
