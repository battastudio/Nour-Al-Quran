import { describe, test, expect } from 'vitest';
import { initCard, review, isDue } from '@/features/hifz/sm2';

const DAY = 86_400_000;

describe('SM-2 scheduler', () => {
  test('a new card is due immediately', () => {
    const now = 1_000_000_000_000;
    expect(isDue(initCard(now), now)).toBe(true);
  });

  test('successful reviews lengthen the interval (1 → 6 → >6)', () => {
    const now = 0;
    let c = initCard(now);
    c = review(c, 'good', now);
    expect(c.interval).toBe(1);
    c = review(c, 'good', now);
    expect(c.interval).toBe(6);
    c = review(c, 'good', now);
    expect(c.interval).toBeGreaterThan(6);
    expect(c.due).toBe(now + c.interval * DAY);
  });

  test('"again" resets reps and shortens interval to 1 day', () => {
    let c = initCard(0);
    c = review(c, 'good', 0);
    c = review(c, 'good', 0);
    c = review(c, 'again', 0);
    expect(c.reps).toBe(0);
    expect(c.interval).toBe(1);
  });

  test('ease factor never drops below 1.3', () => {
    let c = initCard(0);
    for (let i = 0; i < 10; i++) c = review(c, 'again', 0);
    expect(c.ef).toBeGreaterThanOrEqual(1.3);
  });
});
