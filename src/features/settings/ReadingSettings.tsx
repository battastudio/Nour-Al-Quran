import { AyahText } from '@/components/AyahText';
import { Toggle } from '@/components/Toggle';
import { SegmentedControl } from '@/components/SegmentedControl';
import { useSettings, type Theme } from '@/store/settings';
import { RECITERS } from '@/features/audio/reciters';

const THEMES: { value: Theme; label: string }[] = [
  { value: 'day', label: 'النهار' },
  { value: 'night', label: 'ليل' },
  { value: 'emerald', label: 'زمرّد' },
  { value: 'royal', label: 'ملكي' },
];

const PREVIEW = { s: 112, a: 1, t: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ', p: 0, j: 0, h: 0, r: 0 };

export function ReadingSettings() {
  const s = useSettings();

  return (
    <div className="flex flex-col gap-space-xl py-space-md">
      {/* Live preview */}
      <div className="rounded-xl bg-surface-container p-space-lg text-center" dir="rtl">
        <div style={{ fontSize: `${22 * s.fontScale}px`, lineHeight: `${46 * s.fontScale}px` }}>
          <AyahText ayah={PREVIEW} tajweed={s.tajweed} ranges={[{ start: 0, end: 3, rule: 'ghunnah' }]} />
        </div>
      </div>

      <Field label="السمة">
        <div className="grid grid-cols-4 gap-space-xs">
          {THEMES.map((t) => (
            <button
              key={t.value}
              onClick={() => s.setTheme(t.value)}
              className={`rounded-lg border px-space-xs py-space-sm font-sans text-label-md ${
                s.theme === t.value ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant text-on-surface-variant'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label={`حجم الخط (${Math.round(s.fontScale * 100)}٪)`}>
        <input
          type="range"
          min={0.8}
          max={1.8}
          step={0.05}
          value={s.fontScale}
          onChange={(e) => s.setFontScale(Number(e.target.value))}
          className="w-full accent-primary"
        />
      </Field>

      <Row label="تلوين التجويد">
        <Toggle checked={s.tajweed} onChange={s.setTajweed} label="تلوين التجويد" />
      </Row>

      <Field label="الأرقام">
        <SegmentedControl
          value={s.numerals}
          onChange={s.setNumerals}
          options={[
            { value: 'arabic', label: '١٢٣ عربية' },
            { value: 'western', label: '123 لاتينية' },
          ]}
        />
      </Field>

      <Field label="القارئ">
        <select
          value={s.reciter}
          onChange={(e) => s.setReciter(e.target.value)}
          className="w-full rounded-lg bg-surface-container px-space-md py-space-sm font-sans text-body-md text-on-surface"
        >
          {RECITERS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-space-sm">
      <span className="font-sans text-label-md text-on-surface-variant">{label}</span>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-sans text-body-lg text-on-surface">{label}</span>
      {children}
    </div>
  );
}
