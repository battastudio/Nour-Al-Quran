import { describe, test, expect } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { createElement } from 'react';
import { createHash } from 'node:crypto';
import { AyahText } from '@/components/AyahText';
import { Tajweed, splitByRanges, type TajweedRange } from '@/components/Tajweed';
import type { Ayah, SurahFile, QuranChecksum } from '@/data/types';
import checksum from '@/data/quran.checksum.json';

// Eagerly load every surah so we test all 6236 ayahs.
const files = import.meta.glob<{ default: SurahFile }>('@/data/surah/*.json', { eager: true });
const allAyahs: Ayah[] = Object.values(files)
  .map((m) => m.default)
  .sort((a, b) => a.meta.n - b.meta.n)
  .flatMap((f) => f.ayahs);

const sha256 = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');

// A synthetic 3-way contiguous partition — exercises the tajwīd slice path.
function partition(text: string): TajweedRange[] {
  const n = text.length;
  if (n < 3) return [];
  const a = Math.floor(n / 3);
  const b = Math.floor((2 * n) / 3);
  return [
    { start: 0, end: a, rule: 'ghunnah' },
    { start: a, end: b, rule: 'madd' },
    { start: b, end: n, rule: 'qalqalah' },
  ];
}

describe('Quran integrity — sacred text is byte-faithful on every render path', () => {
  test('dataset has exactly 6236 ayahs and 15 sajdas', () => {
    expect(allAyahs.length).toBe(6236);
    expect(allAyahs.filter((a) => a.sajda === true).length).toBe(15);
  });

  test('all 6236 ayahs render byte-faithful through AyahText (plain path)', () => {
    const bad: string[] = [];
    for (const ay of allAyahs) {
      const { container } = render(createElement(AyahText, { ayah: ay, showNumber: true }));
      const node = container.querySelector('[data-ayah-text]');
      if (node?.textContent !== ay.t) bad.push(`${ay.s}:${ay.a}`);
      cleanup();
    }
    expect(bad).toEqual([]);
  });

  test('all 6236 ayahs render byte-faithful through AyahText (tajwīd slice path)', () => {
    const bad: string[] = [];
    for (const ay of allAyahs) {
      const { container } = render(
        createElement(AyahText, { ayah: ay, tajweed: true, ranges: partition(ay.t), showNumber: false }),
      );
      const node = container.querySelector('[data-ayah-text]');
      if (node?.textContent !== ay.t) bad.push(`${ay.s}:${ay.a}`);
      cleanup();
    }
    expect(bad).toEqual([]);
  });

  test('splitByRanges never adds/drops a character (all ayahs, covering + gapped)', () => {
    for (const ay of allAyahs) {
      // covering partition
      expect(splitByRanges(ay.t, partition(ay.t)).map((s) => s.text).join('')).toBe(ay.t);
      // single gapped range in the middle
      const n = ay.t.length;
      if (n >= 4) {
        const mid: TajweedRange[] = [{ start: 1, end: n - 1, rule: 'madd' }];
        expect(splitByRanges(ay.t, mid).map((s) => s.text).join('')).toBe(ay.t);
      }
      // overlapping ranges are dropped safely, text still whole
      const overlap: TajweedRange[] = [
        { start: 0, end: n, rule: 'a' },
        { start: 2, end: 3, rule: 'b' },
      ];
      expect(splitByRanges(ay.t, overlap).map((s) => s.text).join('')).toBe(ay.t);
    }
  });

  test('Tajweed component DOM concatenates to the exact source string', () => {
    const sample = [allAyahs[0], allAyahs[285], allAyahs[6235]]; // Fatiha:1, Baqarah:286, Nas:6
    for (const ay of sample) {
      const { container } = render(createElement(Tajweed, { text: ay.t, ranges: partition(ay.t) }));
      expect(container.textContent).toBe(ay.t);
      cleanup();
    }
  });

  test('ayah number ornament never contaminates the sacred node', () => {
    const ay = allAyahs[6]; // Fatiha:7 — longest Fatiha ayah, has a number
    const { container } = render(createElement(AyahText, { ayah: ay, showNumber: true }));
    expect(container.querySelector('[data-ayah-text]')?.textContent).toBe(ay.t);
    // the visible container includes the ornament, so it is strictly longer
    expect(container.textContent!.length).toBeGreaterThan(ay.t.length);
  });

  test('committed checksum matches the committed data', () => {
    const cs = checksum as QuranChecksum;
    expect(cs.ayahCount).toBe(6236);
    const bySurah = new Map<number, string[]>();
    for (const ay of allAyahs) {
      const arr = bySurah.get(ay.s) ?? [];
      arr.push(ay.t);
      bySurah.set(ay.s, arr);
    }
    const canonical = allAyahs.map((a) => a.t).join('');
    expect(sha256(canonical)).toBe(cs.textHash);
    for (const [n, texts] of bySurah) {
      expect(sha256(texts.join(''))).toBe(cs.perSurah[String(n)]);
    }
  });
});

describe('Quran integrity — only AyahText/Tajweed may render sacred text', () => {
  const sources = import.meta.glob('@/**/*.{ts,tsx}', {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>;

  test('the [data-ayah-text] marker exists in exactly one file (AyahText.tsx)', () => {
    const carriers = Object.keys(sources).filter((p) => sources[p].includes('data-ayah-text'));
    expect(carriers.map((p) => p.split('/').pop())).toEqual(['AyahText.tsx']);
  });

  test('the Tajweed component is imported only by AyahText and tests', () => {
    const importers = Object.entries(sources)
      .filter(([, src]) => /from ['"].*\/Tajweed['"]/.test(src) || /from ['"]\.\/Tajweed['"]/.test(src))
      .map(([p]) => p.split('/').pop()!);
    for (const f of importers) expect(['AyahText.tsx']).toContain(f);
  });
});
