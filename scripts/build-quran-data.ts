/*
 * Build the bundled Quran dataset.
 *
 * Source: quran.com / QUL API v4 (https://api.quran.com/api/v4).
 *   - `text_uthmani` is the Tanzil Uthmani script (with pause marks) — matches the
 *     Amiri Quran font. Copied VERBATIM into `t` (zero normalisation).
 *   - page/juz/hizb/ruku/sajda indices come from the same QUL data.
 *
 * Byte-faithfulness guarantee: the derived text is pinned by the committed sha256
 * in quran.checksum.json, and structural invariants (6236 ayahs, 114 surahs,
 * per-surah counts, 15 sajdas) are asserted before anything is written. If the API
 * ever drifts, `npm run test` (integrity) fails because the committed checksum no
 * longer matches. Re-running this script rewrites the data; review the git diff.
 *
 * Raw API responses are cached under scripts/.cache (gitignored) so re-runs are
 * fast and work offline once primed.
 *
 * Run: npm run data
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalize } from '../src/lib/normalize.ts';
import type { Ayah, SurahFile, SurahMeta, QuranChecksum } from '../src/data/types.ts';

const API = 'https://api.quran.com/api/v4';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'src', 'data');
const SURAH_DIR = join(DATA, 'surah');
const CACHE = join(ROOT, 'scripts', '.cache');

// The 15 canonical places of sajdat at-tilawah (verse keys). Fixed, well-known
// ayah references (not sacred text). Used instead of the API's sajdah_number,
// which under-marks the disputed Ṣād 38:24.
const SAJDA_KEYS = new Set([
  '7:206', '13:15', '16:50', '17:109', '19:58',
  '22:18', '22:77', '25:60', '27:26', '32:15',
  '38:24', '41:38', '53:62', '84:21', '96:19',
]);

const pad3 = (n: number) => String(n).padStart(3, '0');
const sha256 = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');

async function getJSON<T>(url: string, cacheKey: string): Promise<T> {
  const cacheFile = join(CACHE, `${cacheKey}.json`);
  if (existsSync(cacheFile)) {
    return JSON.parse(await readFile(cacheFile, 'utf8')) as T;
  }
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      const text = await res.text();
      await writeFile(cacheFile, text);
      return JSON.parse(text) as T;
    } catch (err) {
      if (attempt === 4) throw err;
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
  throw new Error('unreachable');
}

interface ApiChapter {
  id: number;
  name_arabic: string;
  name_simple: string;
  revelation_place: 'makkah' | 'madinah';
  verses_count: number;
  bismillah_pre: boolean;
}
interface ApiVerse {
  verse_key: string; // "s:a"
  verse_number: number;
  text_uthmani: string;
  page_number: number;
  juz_number: number;
  hizb_number: number;
  ruku_number: number;
  sajdah_number: number | null;
}

async function fetchChapters(): Promise<ApiChapter[]> {
  const { chapters } = await getJSON<{ chapters: ApiChapter[] }>(
    `${API}/chapters?language=ar`,
    'chapters',
  );
  return chapters;
}

async function fetchVerses(surah: number, count: number): Promise<ApiVerse[]> {
  const fields = 'text_uthmani,page_number,juz_number,hizb_number,ruku_number,sajdah_number';
  const perPage = 50; // API max
  const pages = Math.ceil(count / perPage);
  const all: ApiVerse[] = [];
  for (let p = 1; p <= pages; p++) {
    const { verses } = await getJSON<{ verses: ApiVerse[] }>(
      `${API}/verses/by_chapter/${surah}?fields=${fields}&per_page=${perPage}&page=${p}`,
      `surah-${pad3(surah)}-p${p}`,
    );
    all.push(...verses);
  }
  return all;
}

function assert(cond: boolean, msg: string): asserts cond {
  if (!cond) throw new Error(`INVARIANT FAILED: ${msg}`);
}

async function main() {
  await mkdir(CACHE, { recursive: true });
  await mkdir(SURAH_DIR, { recursive: true });

  console.log('Fetching chapter metadata…');
  const chapters = await fetchChapters();
  assert(chapters.length === 114, `expected 114 chapters, got ${chapters.length}`);

  const metaList: SurahMeta[] = [];
  const searchIndex: { s: number; a: number; n: string }[] = [];
  const perSurahHash: Record<string, string> = {};
  let totalAyahs = 0;
  let sajdaCount = 0;
  const canonicalParts: string[] = [];
  let basmala = '';

  for (const ch of chapters) {
    process.stdout.write(`Surah ${pad3(ch.id)} ${ch.name_arabic}… `);
    const verses = await fetchVerses(ch.id, ch.verses_count);
    assert(
      verses.length === ch.verses_count,
      `surah ${ch.id}: expected ${ch.verses_count} ayahs, got ${verses.length}`,
    );

    const ayahs: Ayah[] = verses.map((v) => {
      const [s, a] = v.verse_key.split(':').map(Number);
      const ayah: Ayah = {
        s,
        a,
        t: v.text_uthmani, // VERBATIM — do not touch
        p: v.page_number,
        j: v.juz_number,
        h: v.hizb_number,
        r: v.ruku_number,
      };
      if (SAJDA_KEYS.has(v.verse_key)) {
        ayah.sajda = true;
        sajdaCount++;
      }
      return ayah;
    });

    // per-ayah checks: ayah numbers are 1..count in order
    ayahs.forEach((ay, i) => assert(ay.a === i + 1, `surah ${ch.id} ayah order broken at ${ay.a}`));

    const meta: SurahMeta = {
      n: ch.id,
      name: ch.name_arabic,
      nameLatin: ch.name_simple,
      ayahCount: ch.verses_count,
      revelation: ch.revelation_place === 'makkah' ? 'meccan' : 'medinan',
      bismillah: ch.bismillah_pre,
    };
    metaList.push(meta);

    const file: SurahFile = { meta, ayahs };
    await writeFile(join(SURAH_DIR, `${pad3(ch.id)}.json`), JSON.stringify(file));

    const surahText = ayahs.map((ay) => ay.t).join('');
    perSurahHash[String(ch.id)] = sha256(surahText);
    canonicalParts.push(surahText);
    ayahs.forEach((ay) => searchIndex.push({ s: ay.s, a: ay.a, n: normalize(ay.t) }));
    totalAyahs += ayahs.length;

    if (ch.id === 1) basmala = ayahs[0].t; // byte-faithful basmala for header display
    console.log(`${ayahs.length} ayahs ✓`);
  }

  // Global invariants — sacred-text guardrails.
  assert(totalAyahs === 6236, `expected 6236 ayahs total, got ${totalAyahs}`);
  assert(sajdaCount === 15, `expected 15 sajdas, got ${sajdaCount}`);
  assert(basmala.length > 0, 'basmala not captured');

  const textHash = sha256(canonicalParts.join(''));
  const checksum: QuranChecksum = {
    algo: 'sha256',
    ayahCount: totalAyahs,
    textHash,
    perSurah: perSurahHash,
  };

  await writeFile(join(DATA, 'surah-meta.json'), JSON.stringify(metaList));
  await writeFile(join(DATA, 'search-index.json'), JSON.stringify(searchIndex));
  await writeFile(join(DATA, 'quran.checksum.json'), JSON.stringify(checksum, null, 2));
  await writeFile(join(DATA, 'basmala.json'), JSON.stringify({ t: basmala }));

  console.log('\nDone.');
  console.log(`  ayahs: ${totalAyahs}  sajdas: ${sajdaCount}`);
  console.log(`  textHash: ${textHash}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
