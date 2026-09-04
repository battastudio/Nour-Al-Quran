import data from '@/data/mutashabihat.json';
import type { AyahRef } from '@/features/audio/player';

// Similar-verse index (built from shared 4-word shingles in the sacred text).
// Named similarData.ts (not similar.ts) to avoid a case-only clash with Similar.tsx.
const map = data as Record<string, string[]>;

export function getSimilar(s: number, a: number): AyahRef[] {
  return (map[`${s}:${a}`] ?? []).map((k) => {
    const [ss, aa] = k.split(':').map(Number);
    return { s: ss, a: aa };
  });
}

export function hasSimilar(s: number, a: number): boolean {
  return !!map[`${s}:${a}`]?.length;
}
