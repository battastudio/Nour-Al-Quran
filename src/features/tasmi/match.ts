import { normalize } from '@/lib/normalize';

// Honest measurement: WORD MATCH ONLY. We compare the recognised words to the
// ayah's words (diacritic-insensitive) via LCS. No tajwīd, no timing, no ms.

export interface WordMatch {
  word: string; // original ayah word (byte-faithful, from the dataset)
  ok: boolean; // did the recognised recitation contain it, in order?
}
export interface MatchResult {
  words: WordMatch[];
  accuracy: number; // matched / total, 0..1
}

export function matchWords(target: string, heard: string): MatchResult {
  const tokens = target
    .split(/\s+/)
    .filter(Boolean)
    .map((orig) => ({ orig, norm: normalize(orig) }))
    .filter((x) => x.norm);
  const t = tokens.map((x) => x.norm);
  const h = normalize(heard).split(' ').filter(Boolean);

  const n = t.length;
  const m = h.length;
  // LCS length table
  const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = t[i] === h[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  // backtrack: mark matched target words
  const matched = new Array<boolean>(n).fill(false);
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (t[i] === h[j]) {
      matched[i] = true;
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i++;
    } else {
      j++;
    }
  }

  const okCount = matched.filter(Boolean).length;
  return {
    words: tokens.map((x, idx) => ({ word: x.orig, ok: matched[idx] })),
    accuracy: n ? okCount / n : 0,
  };
}
