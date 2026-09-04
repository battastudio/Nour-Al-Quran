// Numeral + small i18n helpers. `fmt.n` is a pure function (explicit flag →
// trivially testable). Components use `useNum()` (src/store/settings) for the
// reactive, settings-aware version. Numerals are UI chrome — never inside AyahText.

const arNum = new Intl.NumberFormat('ar-EG'); // Eastern Arabic ٠١٢٣…

export const fmt = {
  /** Format a number; Arabic-Indic digits by default. */
  n(v: number, arabic = true): string {
    return arabic ? arNum.format(v) : String(v);
  },
  /** Zero-pad a surah number for file paths: 5 → "005". */
  pad3(v: number): string {
    return String(v).padStart(3, '0');
  },
  /** Clock time HH:MM in Arabic-Indic (or Latin) digits. */
  time(d: Date, arabic = true): string {
    return new Intl.DateTimeFormat(arabic ? 'ar-EG' : 'en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(d);
  },
};
