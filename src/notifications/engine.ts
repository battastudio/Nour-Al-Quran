import { dayTimes, orderedTimes } from '@/features/prayer/times';
import { PRAYER_LABELS, type CalcMethod, type Madhab, type PrayerKey } from '@/store/location';

// The one scheduling brain shared by every notification tier. Pure function →
// unit-tested against adhan-js. Tiers A (native) and B (web push) both consume it.

export interface ScheduleOptions {
  lat: number;
  lng: number;
  method: CalcMethod;
  madhab: Madhab;
  enabledPrayers: Record<PrayerKey, boolean>;
  wirdTime: string | null; // "HH:MM"
  fridayKahf: boolean;
  city?: string;
}

export interface ScheduledNotif {
  id: number;
  at: Date;
  title: string;
  body: string;
  channel: 'adhan' | 'wird';
  url: string;
  prayer?: PrayerKey;
}

const PRAYER_CODE: Record<PrayerKey, number> = { fajr: 1, dhuhr: 2, asr: 3, maghrib: 4, isha: 5 };

/**
 * Compute the next `days` of notifications from `from`.
 * Deterministic and side-effect free. iOS pending cap is 64; a 7-day window is
 * ≤ 5×7 prayers + 7 wird + 1 kahf ≈ 43.
 */
export function computeSchedule(
  opts: ScheduleOptions,
  days = 7,
  from: Date = new Date(),
): ScheduledNotif[] {
  const out: ScheduledNotif[] = [];
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);

  for (let d = 0; d < days; d++) {
    const day = new Date(start);
    day.setDate(start.getDate() + d);

    const times = orderedTimes(dayTimes(day, opts.lat, opts.lng, opts.method, opts.madhab));
    for (const { key, time } of times) {
      if (key === 'sunrise') continue;
      const pk = key as PrayerKey;
      if (!opts.enabledPrayers[pk]) continue;
      if (time.getTime() <= from.getTime()) continue; // don't schedule the past
      out.push({
        id: d * 100 + PRAYER_CODE[pk],
        at: time,
        title: `حان وقت صلاة ${PRAYER_LABELS[pk]}`,
        body: opts.city ? `${opts.city}` : 'نور القرآن',
        channel: 'adhan',
        url: '#/prayer',
        prayer: pk,
      });
    }

    if (opts.wirdTime) {
      const [h, m] = opts.wirdTime.split(':').map(Number);
      const w = new Date(day);
      w.setHours(h, m, 0, 0);
      if (w.getTime() > from.getTime()) {
        out.push({
          id: d * 100 + 50,
          at: w,
          title: 'وردك اليومي من القرآن',
          body: 'خصّص وقتاً مع كتاب الله',
          channel: 'wird',
          url: '#/read',
        });
      }
    }

    if (opts.fridayKahf && day.getDay() === 5) {
      const k = new Date(day);
      k.setHours(9, 0, 0, 0);
      if (k.getTime() > from.getTime()) {
        out.push({
          id: d * 100 + 60,
          at: k,
          title: 'سورة الكهف',
          body: 'من قرأ سورة الكهف يوم الجمعة أضاء له من النور',
          channel: 'wird',
          url: '#/read/18/1',
        });
      }
    }
  }

  return out.sort((a, b) => a.at.getTime() - b.at.getTime());
}
