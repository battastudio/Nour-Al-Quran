import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { AyahText } from '@/components/AyahText';
import { Skeleton } from '@/components/Skeleton';
import { useHifz } from '@/store/hifz';
import { logActivity } from '@/store/activity';
import { useNum } from '@/store/settings';
import { loadSurah, getSurahMeta } from '@/data/loader';
import type { Ayah } from '@/data/types';
import type { Grade } from '@/features/hifz/sm2';

const GRADES: { g: Grade; label: string; cls: string }[] = [
  { g: 'again', label: 'أعد', cls: 'bg-error-container text-on-error-container' },
  { g: 'hard', label: 'صعب', cls: 'bg-surface-container-highest text-on-surface' },
  { g: 'good', label: 'جيد', cls: 'bg-secondary-container text-on-secondary-container' },
  { g: 'easy', label: 'سهل', cls: 'bg-primary text-on-primary' },
];

export function HifzReview() {
  const num = useNum();
  const gradeCard = useHifz((s) => s.gradeCard);
  // Snapshot the due queue once so grading doesn't reshuffle mid-session.
  const [queue] = useState<string[]>(() => useHifz.getState().dueKeys());
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [ayah, setAyah] = useState<Ayah | null>(null);

  const key = queue[i];

  useEffect(() => {
    if (!key) return;
    setRevealed(false);
    setAyah(null);
    const [s, a] = key.split(':').map(Number);
    loadSurah(s).then((f) => setAyah(f.ayahs[a - 1] ?? null));
  }, [key]);

  if (!queue.length || i >= queue.length) {
    return (
      <div className="flex flex-col items-center gap-space-md py-space-2xl text-center">
        <Icon name="verified" filled size={56} className="text-primary" />
        <h2 className="font-sans text-headline-md text-on-surface">أحسنت، أتممت مراجعة اليوم</h2>
        <p className="font-sans text-body-md text-on-surface-variant">نسأل الله أن يجعله في ميزان حسناتك.</p>
        <Link to="/hifz" className="rounded-full bg-primary px-space-xl py-space-sm font-sans text-body-lg text-on-primary">
          عودة
        </Link>
      </div>
    );
  }

  const [s, a] = key.split(':').map(Number);

  const onGrade = (g: Grade) => {
    gradeCard(key, g);
    logActivity();
    setI(i + 1);
  };

  return (
    <div className="flex min-h-[70dvh] flex-col py-space-md">
      <div className="mb-space-md flex items-center justify-between">
        <span className="font-sans text-label-md text-on-surface-variant">
          {num(i + 1)} / {num(queue.length)}
        </span>
        <span className="font-title text-headline-sm text-primary">سورة {getSurahMeta(s)?.name} · {num(a)}</span>
      </div>

      <div className="flex flex-1 items-center justify-center rounded-xl bg-surface-container p-space-lg text-center" dir="rtl">
        {!ayah ? (
          <Skeleton className="h-16 w-full" />
        ) : revealed ? (
          <div className="text-quran-verse-md leading-loose">
            <AyahText ayah={ayah} />
          </div>
        ) : (
          <button onClick={() => setRevealed(true)} className="flex flex-col items-center gap-space-sm text-on-surface-variant">
            <Icon name="visibility" size={40} />
            <span className="font-sans text-body-lg">استرجع الآية ثم أظهرها</span>
          </button>
        )}
      </div>

      {revealed && (
        <div className="mt-space-md grid grid-cols-4 gap-space-2xs">
          {GRADES.map((g) => (
            <button
              key={g.g}
              onClick={() => onGrade(g.g)}
              className={`rounded-lg py-space-sm font-sans text-label-md ${g.cls}`}
            >
              {g.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
