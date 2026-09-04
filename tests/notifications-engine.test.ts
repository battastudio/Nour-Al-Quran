import { describe, test, expect } from 'vitest';
import { computeSchedule, type ScheduleOptions } from '@/notifications/engine';
import { dayTimes, orderedTimes } from '@/features/prayer/times';

const CITIES = [
  { name: 'Doha', lat: 25.2854, lng: 51.531 },
  { name: 'Riyadh', lat: 24.7136, lng: 46.6753 },
  { name: 'London', lat: 51.5074, lng: -0.1278 },
  { name: 'Jakarta', lat: -6.2088, lng: 106.8456 },
];

function opts(lat: number, lng: number): ScheduleOptions {
  return {
    lat,
    lng,
    method: 'UmmAlQura',
    madhab: 'shafi',
    enabledPrayers: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
    wirdTime: null,
    fridayKahf: false,
  };
}

describe('notification engine', () => {
  test.each(CITIES)('$name: adhan times match adhan-js and skip sunrise/past', (city) => {
    const from = new Date('2026-03-01T00:00:00');
    const schedule = computeSchedule(opts(city.lat, city.lng), 1, from);
    const expected = orderedTimes(dayTimes(from, city.lat, city.lng, 'UmmAlQura', 'shafi'))
      .filter((t) => t.key !== 'sunrise')
      .map((t) => t.time.getTime());

    // 5 prayers on day 0 (all future because `from` is 00:00)
    expect(schedule.filter((n) => n.channel === 'adhan')).toHaveLength(5);
    expect(schedule.map((n) => n.at.getTime())).toEqual(expected);
  });

  test('7-day window stays within the iOS pending cap', () => {
    const all = computeSchedule(
      { ...opts(25.2854, 51.531), wirdTime: '05:30', fridayKahf: true },
      7,
      new Date('2026-03-01T00:00:00'),
    );
    expect(all.length).toBeLessThanOrEqual(64);
    // ids unique per batch (so cancel/replace is clean)
    expect(new Set(all.map((n) => n.id)).size).toBe(all.length);
  });

  test('nothing is scheduled in the past', () => {
    const from = new Date('2026-03-01T13:00:00'); // after dhuhr in Doha
    const schedule = computeSchedule(opts(25.2854, 51.531), 1, from);
    expect(schedule.every((n) => n.at.getTime() > from.getTime())).toBe(true);
  });

  test('DST boundary (London, late March) still yields 5 prayers/day', () => {
    const from = new Date('2026-03-29T00:00:00'); // UK clocks go forward
    const day0 = computeSchedule(opts(51.5074, -0.1278), 1, from);
    expect(day0.filter((n) => n.channel === 'adhan')).toHaveLength(5);
  });
});
