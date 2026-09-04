import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { SurahFile } from '@/data/types';
import { loadSurah } from '@/data/loader';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { Ring } from '@/components/Ring';
import { ProgressBar } from '@/components/ProgressBar';
import { Skeleton } from '@/components/Skeleton';
import { toast } from '@/components/Toast';
import { useHifz } from '@/store/hifz';
import { ayahKey } from '@/store/library';
import { useNum } from '@/store/settings';

// Per-ayah memorization map for one surah — honest self-progress only.
// No certificates, seals, "إجازة/سند", or leaderboards.
export function SurahPath() {
  const { surah = '1' } = useParams();
  const n = Number(surah);
  const num = useNum();
  const { cards, addRange } = useHifz();

  const [file, setFile] = useState<SurahFile | null>(null);

  useEffect(() => {
    let alive = true;
    setFile(null);
    loadSurah(n).then((f) => {
      if (alive) setFile(f);
    });
    return () => {
      alive = false;
    };
  }, [n]);

  const ayahCount = file?.meta.ayahCount ?? 0;

  // Learned = memorized ayahs (reps >= 2) inside this surah.
  const learned = useMemo(() => {
    let count = 0;
    for (let a = 1; a <= ayahCount; a++) {
      const c = cards[ayahKey(n, a)];
      if (c && c.reps >= 2) count++;
    }
    return count;
  }, [cards, n, ayahCount]);

  if (!file) {
    return (
      <div className="flex flex-col gap-space-md py-space-md">
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-14 w-full rounded-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const now = Date.now();

  // Node colour by memorization state; due cards get an error ring.
  const nodeClass = (a: number) => {
    const c = cards[ayahKey(n, a)];
    const base = !c
      ? 'bg-surface-container-highest text-on-surface-variant'
      : c.reps >= 2
        ? 'bg-primary text-on-primary'
        : 'bg-secondary-container text-on-secondary-container';
    return c && c.due <= now ? `${base} ring-2 ring-error` : base;
  };

  return (
    <div className="flex flex-col gap-space-lg py-space-md">
      {/* Header: overview of learned / total */}
      <Card>
        <div className="flex items-center gap-space-md">
          <Ring value={learned} max={ayahCount || 1} size={84}>
            <span className="font-sans text-label-md text-on-surface">
              {num(learned)}‏/‏{num(ayahCount)}
            </span>
          </Ring>
          <div className="flex flex-1 flex-col gap-space-xs">
            <h1 className="font-title text-headline-md text-on-surface">سورة {file.meta.name}</h1>
            <p className="font-sans text-body-lg text-on-surface-variant">تقدّمك في إتقان السورة</p>
            <ProgressBar value={learned} max={ayahCount || 1} label="تقدّم إتقان السورة" />
          </div>
        </div>
      </Card>

      {/* Add the whole surah to the memorization plan */}
      <button
        onClick={() => {
          addRange(n, 1, ayahCount);
          toast('أُضيفت السورة إلى خطة الحفظ');
        }}
        className="flex items-center justify-center gap-space-2xs rounded-full bg-primary-container px-space-md py-space-md font-sans text-body-lg text-on-primary-container"
      >
        <Icon name="add" />
        أضف السورة كاملة إلى الحفظ
      </button>

      {/* Per-ayah path — tap an ayah to open the reader */}
      <section className="flex flex-col gap-space-sm">
        <h2 className="font-sans text-label-md text-on-surface-variant">اضغط على آية لقراءتها</h2>
        <div className="grid grid-cols-6 gap-space-sm">
          {Array.from({ length: ayahCount }, (_, i) => i + 1).map((a) => (
            <Link
              key={a}
              to={`/read/${n}/${a}`}
              className={`flex aspect-square items-center justify-center rounded-full font-sans text-label-md ${nodeClass(a)}`}
            >
              {num(a)}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
