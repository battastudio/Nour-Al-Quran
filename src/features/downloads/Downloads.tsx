import { useState } from 'react';
import { Icon } from '@/components/Icon';
import { Avatar } from '@/components/Avatar';
import { ProgressBar } from '@/components/ProgressBar';
import { toast } from '@/components/Toast';
import { useNum } from '@/store/settings';
import { surahMeta } from '@/data/loader';
import { RECITERS } from '@/features/audio/reciters';
import { useDownloads } from '@/store/downloads';
import { downloadSurah, deleteSurah } from './download';

export function Downloads() {
  const num = useNum();
  const { done, markDone, unmarkDone } = useDownloads();
  const [reciter, setReciter] = useState(RECITERS[0].id);
  const [progress, setProgress] = useState<Record<number, number>>({}); // surah -> 0..1

  const reciterMeta = RECITERS.find((r) => r.id === reciter) ?? RECITERS[0];

  const handleDownload = async (s: number) => {
    setProgress((p) => ({ ...p, [s]: 0 }));
    await downloadSurah(reciter, s, (d, t) => {
      setProgress((p) => ({ ...p, [s]: t ? d / t : 0 }));
    });
    setProgress((p) => {
      const n = { ...p };
      delete n[s];
      return n;
    });
    markDone(`${reciter}:${s}`);
    toast('اكتمل تنزيل السورة');
  };

  const handleDelete = async (s: number) => {
    await deleteSurah(reciter, s);
    unmarkDone(`${reciter}:${s}`);
    toast('حُذفت التلاوة المنزّلة');
  };

  return (
    <div className="flex flex-col gap-space-lg py-space-md">
      {/* Chosen reciter — initials avatar only, never a photo */}
      <div className="flex items-center gap-space-sm">
        <Avatar name={reciterMeta.name} size={44} />
        <div>
          <p className="font-title text-headline-sm text-on-surface">{reciterMeta.name}</p>
          <p className="font-sans text-label-md text-on-surface-variant">القارئ المختار</p>
        </div>
      </div>

      <select
        value={reciter}
        onChange={(e) => setReciter(e.target.value)}
        className="w-full rounded-lg bg-surface-container px-space-md py-space-sm font-sans text-body-md text-on-surface"
      >
        {RECITERS.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>

      <p className="rounded-xl bg-surface-container px-space-md py-space-sm text-center font-sans text-body-md text-on-surface-variant">
        التلاوات المنزّلة تعمل دون اتصال
      </p>

      {/* All 114 surahs */}
      <ul className="flex flex-col gap-space-2xs">
        {surahMeta.map((m) => {
          const key = `${reciter}:${m.n}`;
          const pct = progress[m.n];
          const inProgress = pct !== undefined;
          const isDone = done[key];
          return (
            <li
              key={m.n}
              className="flex items-center justify-between gap-space-sm rounded-xl bg-surface-container-low px-space-md py-space-sm"
            >
              <div className="min-w-0">
                <p className="font-title text-headline-sm text-on-surface">سورة {m.name}</p>
                <p className="font-sans text-label-md text-on-surface-variant">{num(m.ayahCount)} آية</p>
              </div>

              {inProgress ? (
                <div className="flex w-32 items-center gap-space-2xs">
                  <ProgressBar value={pct} label="جارٍ التنزيل" />
                  <span className="font-sans text-label-md text-on-surface-variant">
                    {num(Math.round(pct * 100))}٪
                  </span>
                </div>
              ) : isDone ? (
                <div className="flex items-center gap-space-2xs">
                  <Icon name="check_circle" filled className="text-primary" />
                  <button onClick={() => handleDelete(m.n)} aria-label="حذف التنزيل" className="text-error">
                    <Icon name="delete" />
                  </button>
                </div>
              ) : (
                <button onClick={() => handleDownload(m.n)} aria-label="تنزيل السورة" className="text-primary">
                  <Icon name="download" />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
