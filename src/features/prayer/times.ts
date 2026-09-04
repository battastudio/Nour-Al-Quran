import { CalculationMethod, Coordinates, PrayerTimes, Madhab, Qibla } from 'adhan';
import type { CalcMethod, Madhab as MadhabPref, PrayerKey } from '@/store/location';

export type PrayerColumn = PrayerKey | 'sunrise';

const METHODS: Record<CalcMethod, () => ReturnType<typeof CalculationMethod.UmmAlQura>> = {
  MuslimWorldLeague: CalculationMethod.MuslimWorldLeague,
  UmmAlQura: CalculationMethod.UmmAlQura,
  Egyptian: CalculationMethod.Egyptian,
  Karachi: CalculationMethod.Karachi,
  Dubai: CalculationMethod.Dubai,
  Qatar: CalculationMethod.Qatar,
  Kuwait: CalculationMethod.Kuwait,
  Singapore: CalculationMethod.Singapore,
  Turkey: CalculationMethod.Turkey,
  Tehran: CalculationMethod.Tehran,
  NorthAmerica: CalculationMethod.NorthAmerica,
  MoonsightingCommittee: CalculationMethod.MoonsightingCommittee,
};

export function dayTimes(
  date: Date,
  lat: number,
  lng: number,
  method: CalcMethod,
  madhab: MadhabPref,
): PrayerTimes {
  const params = METHODS[method]();
  params.madhab = madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  return new PrayerTimes(new Coordinates(lat, lng), date, params);
}

/** Ordered prayer instants for a given day (used by UI + notification engine). */
export function orderedTimes(pt: PrayerTimes): { key: PrayerColumn; time: Date }[] {
  return [
    { key: 'fajr', time: pt.fajr },
    { key: 'sunrise', time: pt.sunrise },
    { key: 'dhuhr', time: pt.dhuhr },
    { key: 'asr', time: pt.asr },
    { key: 'maghrib', time: pt.maghrib },
    { key: 'isha', time: pt.isha },
  ];
}

/** Next upcoming prayer at/after `now`, scanning today then tomorrow. */
export function nextPrayer(
  now: Date,
  lat: number,
  lng: number,
  method: CalcMethod,
  madhab: MadhabPref,
): { key: PrayerColumn; time: Date } {
  const today = orderedTimes(dayTimes(now, lat, lng, method, madhab));
  const upcoming = today.find((p) => p.time.getTime() > now.getTime());
  if (upcoming) return upcoming;
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return orderedTimes(dayTimes(tomorrow, lat, lng, method, madhab))[0]; // next Fajr
}

export function qiblaDirection(lat: number, lng: number): number {
  return Qibla(new Coordinates(lat, lng));
}
