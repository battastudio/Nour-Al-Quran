import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/Card';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Ring } from '@/components/Ring';
import { ProgressBar } from '@/components/ProgressBar';
import { Icon } from '@/components/Icon';
import { toast } from '@/components/Toast';
import { useKhatmah, totalPortions, type KhatmahUnit, type KhatmahPlan } from '@/store/khatmah';
import { useNum } from '@/store/settings';
import { surahMeta } from '@/data/loader';
import { hijriDate } from '@/lib/hijri';

// Standard starting surah of each juz (1-based juz → surah). Linking to the surah
// start is the honest approximation the /read route supports for a juz portion.
const JUZ_START_SURAH = [
  1, 2, 2, 3, 4, 4, 5, 6, 7, 8, 9, 11, 12, 15, 17, 18, 21, 23, 25, 27, 29, 33, 36, 39, 41, 46, 51, 58, 67, 78,
];

const UNIT_ONE: Record<KhatmahUnit, string> = { juz: 'الجزء', pages: 'الصفحة', ayahs: 'الآية' };
const UNIT_MANY: Record<KhatmahUnit, string> = { juz: 'الأجزاء', pages: 'الصفحات', ayahs: 'الآيات' };
const UNIT_OPTIONS: { value: KhatmahUnit; label: string }[] = [
  { value: 'juz', label: 'جزء' },
  { value: 'pages', label: 'صفحة' },
  { value: 'ayahs', label: 'آية' },
];

const DAY_MS = 86_400_000;

// Whole days since a plan's start; 0 on the start date. Local-midnight based.
function elapsedDays(start: string): number {
  return Math.floor((Date.now() - Date.parse(`${start}T00:00:00`)) / DAY_MS);
}

// Atomic portion index range [start, end) assigned to a 0-based plan day.
function dayRange(total: number, days: number, dayIndex: number): [number, number] {
  const s = Math.min(total, Math.floor((dayIndex * total) / days));
  const e = Math.min(total, Math.floor(((dayIndex + 1) * total) / days));
  return [s, e];
}

// Global ayah index (0-based) → surah/ayah via cumulative ayah counts.
function ayahLocation(globalIndex: number): { surah: number; ayah: number } {
  let rem = globalIndex;
  for (const m of surahMeta) {
    if (rem < m.ayahCount) return { surah: m.n, ayah: rem + 1 };
    rem -= m.ayahCount;
  }
  const last = surahMeta[surahMeta.length - 1];
  return { surah: last.n, ayah: last.ayahCount };
}

// Reader link for a portion's first unit. Null for pages (no page→surah map on hand).
function readerHref(unit: KhatmahUnit, portionIndex: number): string | null {
  if (unit === 'juz') return `/read/${JUZ_START_SURAH[portionIndex] ?? 1}`;
  if (unit === 'ayahs') {
    const { surah, ayah } = ayahLocation(portionIndex);
    return `/read/${surah}/${ayah}`;
  }
  return null;
}

// Parse a shared plan from the URL hash, e.g. #/khatmah?days=30&unit=juz&start=2026-03-01
function parseSharedFromHash(): KhatmahPlan | null {
  const q = window.location.hash.indexOf('?');
  if (q < 0) return null;
  const p = new URLSearchParams(window.location.hash.slice(q + 1));
  const days = Number(p.get('days'));
  const unit = p.get('unit') as KhatmahUnit;
  const start = p.get('start') ?? '';
  if (!days || days < 1 || !UNIT_OPTIONS.some((o) => o.value === unit) || !/^\d{4}-\d{2}-\d{2}$/.test(start)) {
    return null;
  }
  return { startDate: start, days, unit };
}

export function Khatmah() {
  const num = useNum();
  const { plan, completed, startPlan, markPortion, resetPlan } = useKhatmah();

  // Setup form state
  const [days, setDays] = useState(30);
  const [unit, setUnit] = useState<KhatmahUnit>('juz');

  // Shared-plan offer parsed from the URL on mount
  const [shared, setShared] = useState<KhatmahPlan | null>(null);
  useEffect(() => setShared(parseSharedFromHash()), []);

  const sharedIsNew =
    shared &&
    (!plan || plan.startDate !== shared.startDate || plan.days !== shared.days || plan.unit !== shared.unit);

  const portionLabel = (u: KhatmahUnit, [s, e]: [number, number]): string => {
    const count = e - s;
    if (count <= 0) return 'لا وِرد لهذا اليوم';
    if (count === 1) return `${UNIT_ONE[u]} ${num(s + 1)}`;
    return `${UNIT_MANY[u]} ${num(s + 1)}–${num(e)}`;
  };

  const adopt = (p: KhatmahPlan) => {
    startPlan(p.days, p.unit, p.startDate);
    setShared(null);
    toast('تم اعتماد الخطة المشتركة');
  };

  // ---- No active plan: setup ----
  if (!plan) {
    return (
      <div className="flex flex-col gap-space-lg py-space-md">
        {sharedIsNew && shared && (
          <SharedBanner shared={shared} num={num} label={portionLabel(shared.unit, [0, totalPortions(shared.unit)])} onAdopt={() => adopt(shared)} />
        )}

        <Card>
          <h2 className="font-title text-headline-md text-on-surface">خطة الختمة</h2>
          <p className="mt-space-2xs font-sans text-body-md text-on-surface-variant">
            اعقد النية، وحدّد مدة تختم فيها القرآن بوِرد يسير كل يوم. «خيرُ العمل أدومه وإن قلّ».
          </p>

          <div className="mt-space-md flex flex-col gap-space-sm">
            <span className="font-sans text-label-md text-on-surface-variant">المدة (بالأيام)</span>
            <div className="flex flex-wrap items-center gap-space-2xs">
              {[30, 60, 90].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={`rounded-full px-space-md py-1.5 font-sans text-label-md transition-colors ${
                    days === d ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
                  {num(d)} يوماً
                </button>
              ))}
              <input
                type="number"
                min={1}
                max={999}
                value={days}
                onChange={(e) => setDays(Math.max(1, Number(e.target.value)))}
                className="w-20 rounded-lg bg-surface-container px-space-sm py-1 font-sans text-body-md text-on-surface"
                aria-label="عدد الأيام"
              />
            </div>

            <span className="mt-space-2xs font-sans text-label-md text-on-surface-variant">وحدة الوِرد</span>
            <SegmentedControl options={UNIT_OPTIONS} value={unit} onChange={setUnit} />

            {days === 30 && (
              <p className="rounded-lg bg-primary-container px-space-md py-space-sm font-sans text-body-md text-on-primary-container">
                ثلاثون يوماً تُوافق شهر رمضان — جزءٌ في كل يوم، تُتمّه مع العيد بإذن الله.
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                startPlan(days, unit);
                toast('بدأت الختمة، وفّقك الله');
              }}
              className="mt-space-2xs rounded-full bg-primary px-space-md py-space-md font-sans text-body-lg text-on-primary"
            >
              ابدأ الختمة
            </button>
          </div>
        </Card>
      </div>
    );
  }

  // ---- Active plan ----
  const total = totalPortions(plan.unit);
  const done = completed.length;
  const pct = Math.round((done / total) * 100);
  const completedSet = new Set(completed);
  const todayIndex = Math.min(Math.max(0, elapsedDays(plan.startDate)), plan.days - 1);
  const todayR = dayRange(total, plan.days, todayIndex);
  const todayHref = readerHref(plan.unit, todayR[0]);

  const dayDone = (r: [number, number]): boolean => {
    if (r[1] <= r[0]) return false;
    for (let i = r[0]; i < r[1]; i++) if (!completedSet.has(i)) return false;
    return true;
  };

  const toggleDay = (dayIndex: number) => {
    const [s, e] = dayRange(total, plan.days, dayIndex);
    if (e <= s) return;
    const next = !dayDone([s, e]);
    // ponytail: marks each atomic portion in the day (O(portions/day) sets → IDB writes).
    // Trivial for juz/pages; heaviest for ayahs (~208/day). Add a range action if it janks.
    for (let i = s; i < e; i++) markPortion(i, next);
  };

  const share = () => {
    const url = `${window.location.origin}${import.meta.env.BASE_URL}#/khatmah?days=${plan.days}&unit=${plan.unit}&start=${plan.startDate}`;
    void navigator.clipboard.writeText(url).then(() => toast('نُسخ رابط الخطة'));
  };

  const reset = () => {
    if (window.confirm('هل تريد إنهاء الختمة الحالية؟ ستُمحى العلامات.')) resetPlan();
  };

  return (
    <div className="flex flex-col gap-space-lg py-space-md">
      {sharedIsNew && shared && (
        <SharedBanner shared={shared} num={num} label={portionLabel(shared.unit, [0, totalPortions(shared.unit)])} onAdopt={() => adopt(shared)} />
      )}

      {/* Progress */}
      <Card className="flex items-center gap-space-md">
        <Ring value={done} max={total} size={96} stroke={10}>
          <span className="font-sans text-headline-sm text-on-surface">{num(pct)}٪</span>
        </Ring>
        <div className="flex-1">
          <p className="font-sans text-body-md text-on-surface-variant">
            أتممت {num(done)} من {num(total)} {UNIT_MANY[plan.unit]}
          </p>
          <div className="mt-space-xs">
            <ProgressBar value={done} max={total} label="تقدم الختمة" />
          </div>
          <p className="mt-space-xs font-sans text-label-md text-on-surface-variant">{hijriDate()}</p>
        </div>
      </Card>

      {plan.days === 30 && (
        <p className="rounded-lg bg-primary-container px-space-md py-space-sm font-sans text-body-md text-on-primary-container">
          ختمة رمضان: جزءٌ كل يوم. تقبّل الله منك.
        </p>
      )}

      {/* Today's portion */}
      <section>
        <h2 className="mb-space-sm font-sans text-headline-sm text-on-surface">المطلوب اليوم</h2>
        <Card>
          <div className="flex items-center justify-between gap-space-sm">
            <div>
              <p className="font-title text-headline-sm text-on-surface">{portionLabel(plan.unit, todayR)}</p>
              <p className="mt-space-2xs font-sans text-label-md text-on-surface-variant">
                اليوم {num(todayIndex + 1)} من {num(plan.days)}
              </p>
            </div>
            {todayHref && todayR[1] > todayR[0] && (
              <Link
                to={todayHref}
                className="flex items-center gap-space-2xs rounded-full bg-primary px-space-md py-space-sm font-sans text-body-md text-on-primary"
              >
                <Icon name="menu_book" filled size={18} />
                اقرأ
              </Link>
            )}
          </div>
          {todayR[1] > todayR[0] && (
            <button
              type="button"
              onClick={() => toggleDay(todayIndex)}
              className={`mt-space-sm w-full rounded-full px-space-md py-space-sm font-sans text-body-md transition-colors ${
                dayDone(todayR)
                  ? 'bg-surface-container text-on-surface-variant'
                  : 'bg-primary-container text-on-primary-container'
              }`}
            >
              {dayDone(todayR) ? 'تم إتمام وِرد اليوم' : 'أتممتُ وِرد اليوم'}
            </button>
          )}
        </Card>
      </section>

      {/* All days */}
      <section>
        <h2 className="mb-space-sm font-sans text-headline-sm text-on-surface">أيام الختمة</h2>
        <div className="grid grid-cols-2 gap-space-2xs">
          {Array.from({ length: plan.days }, (_, i) => {
            const r = dayRange(total, plan.days, i);
            const d = dayDone(r);
            const isToday = i === todayIndex;
            return (
              <button
                key={i}
                type="button"
                onClick={() => toggleDay(i)}
                className={`flex items-center justify-between gap-space-2xs rounded-xl px-space-md py-space-sm text-right transition-colors ${
                  d ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-low text-on-surface'
                } ${isToday ? 'border border-primary' : ''}`}
              >
                <span className="flex flex-col">
                  <span className="font-sans text-label-md text-on-surface-variant">اليوم {num(i + 1)}</span>
                  <span className="font-sans text-body-md">{portionLabel(plan.unit, r)}</span>
                </span>
                <Icon
                  name={d ? 'check_circle' : 'radio_button_unchecked'}
                  filled={d}
                  size={22}
                  className={d ? 'text-primary' : 'text-on-surface-variant'}
                />
              </button>
            );
          })}
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center gap-space-sm">
        <button
          type="button"
          onClick={share}
          className="flex flex-1 items-center justify-center gap-space-2xs rounded-full bg-surface-container px-space-md py-space-sm font-sans text-body-md text-on-surface"
        >
          <Icon name="share" size={18} />
          مشاركة الخطة
        </button>
        <button
          type="button"
          onClick={reset}
          className="flex items-center justify-center gap-space-2xs rounded-full px-space-md py-space-sm font-sans text-body-md text-on-surface-variant"
        >
          <Icon name="restart_alt" size={18} />
          إنهاء
        </button>
      </div>
    </div>
  );
}

// Offer to adopt a plan shared via link.
function SharedBanner({
  shared,
  label,
  num,
  onAdopt,
}: {
  shared: KhatmahPlan;
  label: string;
  num: (v: number) => string;
  onAdopt: () => void;
}) {
  return (
    <Card className="bg-primary-container">
      <p className="font-sans text-body-md text-on-primary-container">
        وصلتك خطة ختمة مشتركة: {label} على مدى {num(shared.days)} يوماً، تبدأ من {shared.startDate}.
      </p>
      <button
        type="button"
        onClick={onAdopt}
        className="mt-space-sm rounded-full bg-primary px-space-md py-space-sm font-sans text-body-md text-on-primary"
      >
        اعتمد هذه الخطة
      </button>
    </Card>
  );
}
