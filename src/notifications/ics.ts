import { dayTimes, orderedTimes } from '@/features/prayer/times';
import { PRAYER_LABELS, type CalcMethod, type Madhab, type PrayerKey } from '@/store/location';

// Tier C notifications: a client-side .ics with a VALARM per prayer. Works on
// every iPhone today, zero infrastructure. Import once; regenerate on city change.

const PAD = (n: number) => String(n).padStart(2, '0');
const stampLocal = (d: Date) =>
  `${d.getFullYear()}${PAD(d.getMonth() + 1)}${PAD(d.getDate())}T${PAD(d.getHours())}${PAD(d.getMinutes())}00`;

interface IcsOptions {
  lat: number;
  lng: number;
  method: CalcMethod;
  madhab: Madhab;
  enabledPrayers: Record<PrayerKey, boolean>;
  wirdTime: string | null;
  days?: number;
}

export function generatePrayerICS(opts: IcsOptions): string {
  const { lat, lng, method, madhab, enabledPrayers, wirdTime, days = 365 } = opts;
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Nour Al Quran//Prayer Times//AR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:مواقيت الصلاة — نور القرآن',
  ];

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  for (let i = 0; i < days; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    const times = orderedTimes(dayTimes(day, lat, lng, method, madhab));
    for (const { key, time } of times) {
      if (key === 'sunrise') continue;
      if (!enabledPrayers[key as PrayerKey]) continue;
      lines.push(...vevent(`أذان ${PRAYER_LABELS[key as PrayerKey]}`, time, `${key}-${i}`));
    }
    if (wirdTime) {
      const [h, m] = wirdTime.split(':').map(Number);
      const w = new Date(day);
      w.setHours(h, m, 0, 0);
      lines.push(...vevent('وردك اليومي من القرآن', w, `wird-${i}`));
    }
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function vevent(summary: string, at: Date, uid: string): string[] {
  const end = new Date(at.getTime() + 10 * 60000);
  return [
    'BEGIN:VEVENT',
    `UID:${uid}-${stampLocal(at)}@nour-alquran`,
    `DTSTART:${stampLocal(at)}`,
    `DTEND:${stampLocal(end)}`,
    `SUMMARY:${summary}`,
    'BEGIN:VALARM',
    'TRIGGER:PT0M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${summary}`,
    'END:VALARM',
    'END:VEVENT',
  ];
}

export function downloadICS(content: string, name = 'nour-prayer-times.ics'): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
