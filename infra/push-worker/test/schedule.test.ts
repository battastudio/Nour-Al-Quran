import { describe, test, expect } from 'vitest';
import { CalculationMethod, Coordinates, PrayerTimes } from 'adhan';
import { computeDue, type Sub } from '../src/schedule';

const doha: Sub = {
  subscription: { endpoint: 'https://push.example/x', keys: { p256dh: '', auth: '' } },
  lat: 25.2854, lng: 51.531, method: 'UmmAlQura', madhab: 'shafi', tz: 'Asia/Qatar',
  prayers: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
  wirdTime: null, fridayKahf: false, ramadan: false,
};

const dohaDhuhr = () =>
  new PrayerTimes(new Coordinates(25.2854, 51.531), new Date(Date.UTC(2026, 2, 1, 12)), CalculationMethod.UmmAlQura()).dhuhr;

describe('computeDue (tz-explicit, runner-tz-independent)', () => {
  test('fires an adhan when now sits at a prayer instant', () => {
    const due = computeDue(doha, dohaDhuhr(), 60_000);
    expect(due.some((n) => n.tag.startsWith('adhan-dhuhr'))).toBe(true);
  });

  test('nothing due in a quiet minute (03:00 Doha, pre-Fajr)', () => {
    const now = new Date(Date.UTC(2026, 2, 1, 0, 0)); // 03:00 Asia/Qatar
    expect(computeDue(doha, now, 60_000)).toHaveLength(0);
  });

  test('wird fires at the local wall-clock time', () => {
    const now = new Date(Date.UTC(2026, 2, 1, 2, 30)); // 05:30 Asia/Qatar
    const due = computeDue({ ...doha, wirdTime: '05:30' }, now, 60_000);
    expect(due.some((n) => n.tag.startsWith('wird'))).toBe(true);
  });

  test('respects a disabled prayer', () => {
    const due = computeDue({ ...doha, prayers: { ...doha.prayers, dhuhr: false } }, dohaDhuhr(), 60_000);
    expect(due.some((n) => n.tag.startsWith('adhan-dhuhr'))).toBe(false);
  });

  test('Friday Kahf fires at 09:00 local on Fridays only', () => {
    // 2026-03-06 is a Friday. 09:00 Asia/Qatar = 06:00 UTC.
    const fri = new Date(Date.UTC(2026, 2, 6, 6, 0));
    expect(computeDue({ ...doha, fridayKahf: true }, fri, 60_000).some((n) => n.tag.startsWith('kahf'))).toBe(true);
    const notFri = new Date(Date.UTC(2026, 2, 5, 6, 0)); // Thursday
    expect(computeDue({ ...doha, fridayKahf: true }, notFri, 60_000).some((n) => n.tag.startsWith('kahf'))).toBe(false);
  });
});
