// Hijri date via the Umm al-Qura calendar (Intl, no dependency).
const fmt = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  weekday: 'long',
});

export function hijriDate(d: Date = new Date()): string {
  return fmt.format(d);
}

/** True when the given date is a Friday (for Surah Al-Kahf reminders). */
export function isFriday(d: Date = new Date()): boolean {
  return d.getDay() === 5;
}
