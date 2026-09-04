/*
 * Build the mutashābihāt (similar verses) index from the bundled Quran itself:
 * two ayahs are "similar" if they share a 4-word normalised shingle. Ranked by
 * the number of shared shingles. No external dataset — derived from the sacred
 * text via the SAME normaliser used for search.
 * Run: npx tsx scripts/build-mutashabihat.ts
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalize } from '../src/lib/normalize.ts';
import type { SurahFile } from '../src/data/types.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SURAH_DIR = join(ROOT, 'src', 'data', 'surah');
const OUT = join(ROOT, 'src', 'data', 'mutashabihat.json');

const SHINGLE = 4; // consecutive words
const MAX_MATCHES = 12;
const MAX_GROUP = 60; // ignore ultra-formulaic shingles shared by more ayahs than this

const pad3 = (n: number) => String(n).padStart(3, '0');

async function main() {
  // shingle -> set of ayah keys
  const groups = new Map<string, Set<string>>();

  for (let n = 1; n <= 114; n++) {
    const file = JSON.parse(await readFile(join(SURAH_DIR, `${pad3(n)}.json`), 'utf8')) as SurahFile;
    for (const ay of file.ayahs) {
      const words = normalize(ay.t).split(' ').filter(Boolean);
      const key = `${ay.s}:${ay.a}`;
      const seen = new Set<string>();
      for (let i = 0; i + SHINGLE <= words.length; i++) {
        const sh = words.slice(i, i + SHINGLE).join(' ');
        if (seen.has(sh)) continue; // count a shingle once per ayah
        seen.add(sh);
        let g = groups.get(sh);
        if (!g) groups.set(sh, (g = new Set()));
        g.add(key);
      }
    }
  }

  // co-occurrence counts
  const counts = new Map<string, Map<string, number>>();
  const bump = (a: string, b: string) => {
    let m = counts.get(a);
    if (!m) counts.set(a, (m = new Map()));
    m.set(b, (m.get(b) ?? 0) + 1);
  };

  for (const g of groups.values()) {
    if (g.size < 2 || g.size > MAX_GROUP) continue;
    const arr = [...g];
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        bump(arr[i], arr[j]);
        bump(arr[j], arr[i]);
      }
    }
  }

  const out: Record<string, string[]> = {};
  for (const [key, m] of counts) {
    const ranked = [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_MATCHES)
      .map(([k]) => k);
    if (ranked.length) out[key] = ranked;
  }

  await writeFile(OUT, JSON.stringify(out));
  console.log(`Mutashabihat: ${Object.keys(out).length} ayahs with matches`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
