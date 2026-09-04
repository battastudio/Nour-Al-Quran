import { CalculationMethod, Coordinates, PrayerTimes, Madhab } from 'adhan';

// Server-side mirror of the app's notification engine (src/notifications/engine.ts).
// Pure + timezone-explicit (uses the subscriber's IANA tz), so it's deterministic and
// unit-testable regardless of the Worker's own clock/zone.

export type CalcMethod =
  | 'MuslimWorldLeague' | 'UmmAlQura' | 'Egyptian' | 'Karachi' | 'Dubai' | 'Qatar'
  | 'Kuwait' | 'Singapore' | 'Turkey' | 'Tehran' | 'NorthAmerica' | 'MoonsightingCommittee';
export type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface Sub {
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
  lat: number;
  lng: number;
  method: CalcMethod;
  madhab: 'shafi' | 'hanafi';
  tz: string; // IANA, e.g. "Asia/Jakarta"
  prayers: Record<PrayerKey, boolean>;
  wirdTime: string | null; // "HH:MM" local
  fridayKahf?: boolean; // default true
  ramadan?: boolean; // default true
}

export interface Notif { title: string; body: string; url: string; tag: string }

const LABELS: Record<PrayerKey, string> = { fajr: 'الفجر', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' };
const METHODS: Record<CalcMethod, () => ReturnType<typeof CalculationMethod.UmmAlQura>> = {
  MuslimWorldLeague: CalculationMethod.MuslimWorldLeague, UmmAlQura: CalculationMethod.UmmAlQura,
  Egyptian: CalculationMethod.Egyptian, Karachi: CalculationMethod.Karachi, Dubai: CalculationMethod.Dubai,
  Qatar: CalculationMethod.Qatar, Kuwait: CalculationMethod.Kuwait, Singapore: CalculationMethod.Singapore,
  Turkey: CalculationMethod.Turkey, Tehran: CalculationMethod.Tehran, NorthAmerica: CalculationMethod.NorthAmerica,
  MoonsightingCommittee: CalculationMethod.MoonsightingCommittee,
};

/** Local calendar parts (in `tz`) for an instant. */
function parts(at: Date, tz: string) {
  const f = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short',
  }).formatToParts(at).reduce<Record<string, string>>((a, p) => ((a[p.type] = p.value), a), {});
  return { y: +f.year, m: +f.month, d: +f.day, hh: +f.hour, mm: +f.minute, ss: +f.second, wd: f.weekday };
}

/** Convert a wall-clock time in `tz` to an absolute instant. */
function zonedToUtc(y: number, m: number, d: number, hh: number, mm: number, tz: string): Date {
  const guess = Date.UTC(y, m - 1, d, hh, mm, 0);
  const p = parts(new Date(guess), tz);
  const asSeen = Date.UTC(p.y, p.m - 1, p.d, p.hh, p.mm, p.ss);
  return new Date(guess - (asSeen - guess)); // subtract the tz offset
}

/** adhan prayer instants for the civil date (y,m,d) at the coordinates. */
function prayerInstants(sub: Sub, y: number, m: number, d: number): { key: PrayerKey; time: Date }[] {
  const params = METHODS[sub.method]();
  params.madhab = sub.madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  const pt = new PrayerTimes(new Coordinates(sub.lat, sub.lng), new Date(Date.UTC(y, m - 1, d, 12)), params);
  return [
    { key: 'fajr' as const, time: pt.fajr },
    { key: 'dhuhr' as const, time: pt.dhuhr },
    { key: 'asr' as const, time: pt.asr },
    { key: 'maghrib' as const, time: pt.maghrib },
    { key: 'isha' as const, time: pt.isha },
  ];
}

/** Notifications whose instant falls in [now, now+windowMs). */
export function computeDue(sub: Sub, now: Date, windowMs = 60_000): Notif[] {
  const end = now.getTime() + windowMs;
  const inWin = (t: Date) => t.getTime() >= now.getTime() && t.getTime() < end;
  const out: Notif[] = [];

  // Cover today ± a day so prayers near local midnight aren't missed.
  const today = parts(now, sub.tz);
  const days = [-1, 0, 1].map((off) => {
    const base = zonedToUtc(today.y, today.m, today.d, 12, 0, sub.tz);
    const p = parts(new Date(base.getTime() + off * 86_400_000), sub.tz);
    return { y: p.y, m: p.m, d: p.d, wd: p.wd };
  });

  const seen = new Set<string>();
  for (const day of days) {
    for (const { key, time } of prayerInstants(sub, day.y, day.m, day.d)) {
      if (!sub.prayers[key]) continue;
      if (!inWin(time)) continue;
      const tag = `adhan-${key}-${day.y}${day.m}${day.d}`;
      if (seen.has(tag)) continue;
      seen.add(tag);
      out.push({ title: `حان وقت صلاة ${LABELS[key]}`, body: 'نور القرآن', url: '#/prayer', tag });
    }
    if (sub.wirdTime) {
      const [h, mnt] = sub.wirdTime.split(':').map(Number);
      const w = zonedToUtc(day.y, day.m, day.d, h, mnt, sub.tz);
      if (inWin(w)) out.push({ title: 'وردك اليومي من القرآن', body: 'خصّص وقتاً مع كتاب الله', url: '#/read', tag: `wird-${day.y}${day.m}${day.d}` });
    }
    if ((sub.fridayKahf ?? true) && day.wd === 'Fri') {
      const k = zonedToUtc(day.y, day.m, day.d, 9, 0, sub.tz);
      if (inWin(k)) out.push({ title: 'سورة الكهف', body: 'من قرأ سورة الكهف يوم الجمعة أضاء له من النور', url: '#/read/18/1', tag: `kahf-${day.y}${day.m}${day.d}` });
    }
    if ((sub.ramadan ?? true) && hijriMonth(day.y, day.m, day.d, sub.tz) === 9) {
      const r = zonedToUtc(day.y, day.m, day.d, 20, 0, sub.tz);
      if (inWin(r)) out.push({ title: 'رمضان مبارك', body: 'اجعل لك ورداً من القرآن الليلة', url: '#/read', tag: `ramadan-${day.y}${day.m}${day.d}` });
    }
  }
  return out;
}

/** Islamic (umalqura) month 1–12 for a civil date, via Intl. */
function hijriMonth(y: number, m: number, d: number, tz: string): number {
  const at = zonedToUtc(y, m, d, 12, 0, tz);
  const mo = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { timeZone: tz, month: 'numeric' }).format(at);
  return Number(mo);
}
