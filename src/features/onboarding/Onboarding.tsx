import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings, type Theme } from '@/store/settings';
import { useLocation } from '@/store/location';
import { Icon } from '@/components/Icon';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Chip } from '@/components/Chip';
import { toast } from '@/components/Toast';

// Theme labels mirror ReadingSettings so the control feels identical.
const THEMES: { value: Theme; label: string }[] = [
  { value: 'day', label: 'النهار' },
  { value: 'night', label: 'ليل' },
  { value: 'emerald', label: 'زمرّد' },
  { value: 'royal', label: 'ملكي' },
];

// Only Hafs is shipped; the rest are shown disabled with a «قريباً» chip.
const RIWAYAT = [
  { id: 'hafs', label: 'حفص عن عاصم', available: true },
  { id: 'warsh', label: 'ورش عن نافع', available: false },
  { id: 'qalun', label: 'قالون', available: false },
  { id: 'duri', label: 'الدوري', available: false },
];

const STEPS = 5;

export function Onboarding() {
  const nav = useNavigate();
  const settings = useSettings();
  const loc = useLocation();
  const [step, setStep] = useState(0);
  const [riwaya, setRiwaya] = useState('hafs');
  const [locating, setLocating] = useState(false);

  const last = step === STEPS - 1;
  const advance = () => setStep((s) => Math.min(STEPS - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));
  const next = () => (last ? nav('/') : advance());

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast('تحديد الموقع غير متاح');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        loc.setLocation(pos.coords.latitude, pos.coords.longitude, 'موقعي');
        setLocating(false);
        toast('تم تحديد الموقع');
        advance();
      },
      () => {
        setLocating(false);
        toast('تعذّر تحديد الموقع');
      },
    );
  };

  return (
    <div className="flex min-h-[70dvh] flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-space-lg px-space-md text-center">
        {step === 0 && (
          <>
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-on-primary">
              <Icon name="menu_book" size={40} />
            </div>
            <h1 className="font-title text-display-lg text-on-surface">نور القرآن</h1>
            <p className="max-w-xs font-sans text-body-lg text-on-surface-variant">
              مصحف ومواقيت وتسميع وحفظ، يعمل دون اتصال
            </p>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="font-sans text-headline-md text-on-surface">اختر الرواية</h2>
            <div className="flex w-full max-w-sm flex-col gap-space-sm">
              {RIWAYAT.map((r) => {
                const base =
                  'flex items-center justify-between rounded-xl border p-space-md font-sans text-body-lg';
                if (!r.available) {
                  return (
                    <div
                      key={r.id}
                      className={`${base} border-outline-variant text-on-surface-variant opacity-70`}
                    >
                      <span>{r.label}</span>
                      <Chip label="قريباً" />
                    </div>
                  );
                }
                const selected = riwaya === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setRiwaya(r.id)}
                    className={`${base} transition-colors ${
                      selected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-outline-variant text-on-surface'
                    }`}
                  >
                    <span className="flex items-center gap-space-sm">
                      {selected && <Icon name="check_circle" size={20} filled />}
                      {r.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="font-sans text-headline-md text-on-surface">المظهر</h2>
            <div className="grid w-full max-w-sm grid-cols-4 gap-space-xs">
              {THEMES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => settings.setTheme(t.value)}
                  className={`rounded-lg border px-space-xs py-space-sm font-sans text-label-md ${
                    settings.theme === t.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-outline-variant text-on-surface-variant'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col items-center gap-space-sm">
              <span className="font-sans text-label-md text-on-surface-variant">الأرقام</span>
              <SegmentedControl
                value={settings.numerals}
                onChange={settings.setNumerals}
                options={[
                  { value: 'arabic', label: '١٢٣ عربية' },
                  { value: 'western', label: '123 لاتينية' },
                ]}
              />
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <Icon name="location_on" size={48} className="text-primary" />
            <h2 className="font-sans text-headline-md text-on-surface">موقعك (اختياري)</h2>
            <p className="max-w-xs font-sans text-body-md text-on-surface-variant">
              نحسب المواقيت على جهازك دون إرسال موقعك
            </p>
            <button
              onClick={detectLocation}
              disabled={locating}
              className="rounded-full bg-primary px-space-xl py-space-sm font-sans text-body-lg text-on-primary disabled:opacity-60"
            >
              {locating ? 'جارٍ التحديد…' : 'تحديد موقعي'}
            </button>
            <button
              onClick={advance}
              className="font-sans text-label-md text-on-surface-variant underline"
            >
              تخطٍّ
            </button>
          </>
        )}

        {step === 4 && (
          <>
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
              <Icon name="check" size={40} />
            </div>
            <h2 className="font-sans text-headline-md text-on-surface">كل شيء جاهز</h2>
            <p className="max-w-xs font-sans text-body-lg text-on-surface-variant">
              نسأل الله أن يعينك على تلاوته وحفظه والعمل به
            </p>
          </>
        )}
      </div>

      {/* Step dots + navigation */}
      <div className="flex flex-col gap-space-md py-space-md">
        <div className="flex justify-center gap-space-2xs">
          {Array.from({ length: STEPS }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-4 bg-primary' : 'w-1.5 bg-outline-variant'
              }`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between gap-space-md">
          <button
            onClick={back}
            disabled={step === 0}
            className="rounded-full px-space-xl py-space-sm font-sans text-body-lg text-on-surface-variant disabled:pointer-events-none disabled:opacity-0"
          >
            السابق
          </button>
          <button
            onClick={next}
            className="rounded-full bg-primary px-space-xl py-space-sm font-sans text-body-lg text-on-primary"
          >
            {last ? 'ابدأ' : 'التالي'}
          </button>
        </div>
      </div>
    </div>
  );
}
