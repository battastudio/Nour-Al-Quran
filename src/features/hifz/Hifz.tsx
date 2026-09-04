import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { Card } from '@/components/Card';
import { toast } from '@/components/Toast';
import { useHifz } from '@/store/hifz';
import { useNum } from '@/store/settings';
import { surahMeta, getSurahMeta } from '@/data/loader';

export function Hifz() {
  const num = useNum();
  const { cards, streak, addRange, dueKeys } = useHifz();
  const due = dueKeys();

  const [surah, setSurah] = useState(1);
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(7);

  const bySurah = useMemo(() => {
    const map = new Map<number, number>();
    for (const k of Object.keys(cards)) {
      const s = Number(k.split(':')[0]);
      map.set(s, (map.get(s) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [cards]);

  const maxAyah = getSurahMeta(surah)?.ayahCount ?? 7;

  return (
    <div className="flex flex-col gap-space-lg py-space-md">
      {/* Continuity + due */}
      <div className="grid grid-cols-2 gap-space-md">
        <Card>
          <div className="flex items-center gap-space-2xs text-on-surface-variant">
            <Icon name="star" filled size={18} className="text-secondary" />
            <span className="font-sans text-label-md">الاستمرار</span>
          </div>
          <p className="mt-space-xs font-sans text-display-lg text-on-surface">{num(streak)} يوماً</p>
        </Card>
        <Card>
          <div className="flex items-center gap-space-2xs text-on-surface-variant">
            <Icon name="assignment" size={18} />
            <span className="font-sans text-label-md">المستحق اليوم</span>
          </div>
          <p className="mt-space-xs font-sans text-display-lg text-on-surface">{num(due.length)}</p>
        </Card>
      </div>

      {due.length > 0 ? (
        <Link
          to="/hifz/review"
          className="flex items-center justify-center gap-space-2xs rounded-full bg-primary px-space-md py-space-md font-sans text-body-lg text-on-primary"
        >
          <Icon name="play_arrow" filled />
          ابدأ مراجعة اليوم ({num(due.length)})
        </Link>
      ) : (
        <p className="rounded-xl bg-surface-container px-space-md py-space-md text-center font-sans text-body-md text-on-surface-variant">
          لا مراجعات مستحقة الآن. بارك الله فيك.
        </p>
      )}

      {/* Add plan */}
      <section>
        <h2 className="mb-space-sm font-sans text-headline-sm text-on-surface">إضافة إلى الحفظ</h2>
        <Card>
          <div className="flex flex-col gap-space-sm">
            <select
              value={surah}
              onChange={(e) => {
                setSurah(Number(e.target.value));
                setFrom(1);
                setTo(Math.min(7, getSurahMeta(Number(e.target.value))?.ayahCount ?? 7));
              }}
              className="w-full rounded-lg bg-surface-container px-space-md py-space-sm font-sans text-body-md text-on-surface"
            >
              {surahMeta.map((m) => (
                <option key={m.n} value={m.n}>
                  سورة {m.name}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-space-sm">
              <label className="font-sans text-label-md text-on-surface-variant">من</label>
              <input
                type="number"
                min={1}
                max={maxAyah}
                value={from}
                onChange={(e) => setFrom(Number(e.target.value))}
                className="w-20 rounded-lg bg-surface-container px-space-sm py-1 font-sans text-body-md text-on-surface"
              />
              <label className="font-sans text-label-md text-on-surface-variant">إلى</label>
              <input
                type="number"
                min={from}
                max={maxAyah}
                value={to}
                onChange={(e) => setTo(Number(e.target.value))}
                className="w-20 rounded-lg bg-surface-container px-space-sm py-1 font-sans text-body-md text-on-surface"
              />
            </div>
            <button
              onClick={() => {
                addRange(surah, Math.min(from, to), Math.max(from, to));
                toast('أُضيفت الآيات إلى خطة الحفظ');
              }}
              className="rounded-full bg-primary-container px-space-md py-space-sm font-sans text-body-md text-on-primary-container"
            >
              إضافة الآيات
            </button>
          </div>
        </Card>
      </section>

      {/* Memorized */}
      {bySurah.length > 0 && (
        <section>
          <h2 className="mb-space-sm font-sans text-headline-sm text-on-surface">محفوظاتي</h2>
          <ul className="flex flex-col gap-space-2xs">
            {bySurah.map(([s, count]) => (
              <li key={s} className="flex items-center justify-between rounded-xl bg-surface-container-low px-space-md py-space-sm">
                <span className="font-title text-headline-sm text-on-surface">سورة {getSurahMeta(s)?.name}</span>
                <span className="font-sans text-label-md text-on-surface-variant">{num(count)} آية</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
