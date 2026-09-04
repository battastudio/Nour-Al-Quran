// SM-2 spaced repetition. Pure functions — unit-tested in sm2.test.ts.

export interface SM2 {
  ef: number; // ease factor
  interval: number; // days until next review
  reps: number; // consecutive successful reviews
  due: number; // epoch ms
}

export type Grade = 'again' | 'hard' | 'good' | 'easy';
const QUALITY: Record<Grade, number> = { again: 2, hard: 3, good: 4, easy: 5 };
const DAY = 86_400_000;

export function initCard(now = Date.now()): SM2 {
  return { ef: 2.5, interval: 0, reps: 0, due: now };
}

export function review(card: SM2, grade: Grade, now = Date.now()): SM2 {
  const q = QUALITY[grade];
  let { ef, interval, reps } = card;

  if (q < 3) {
    reps = 0;
    interval = 1;
  } else {
    reps += 1;
    if (reps === 1) interval = 1;
    else if (reps === 2) interval = 6;
    else interval = Math.round(interval * ef);
  }

  ef = Math.max(1.3, ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  return { ef, interval, reps, due: now + interval * DAY };
}

export function isDue(card: SM2, now = Date.now()): boolean {
  return card.due <= now;
}
