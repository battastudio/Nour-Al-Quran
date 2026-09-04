import { useEffect, useState } from 'react';
import type { Ayah } from '@/data/types';
import { Sheet } from '@/components/Sheet';
import { Skeleton } from '@/components/Skeleton';
import { useNum } from '@/store/settings';
import { fetchWords, type WordInfo } from './words';

export function WordSheet({
  ayah,
  surahName,
  onClose,
}: {
  ayah: Ayah | null;
  surahName: string;
  onClose: () => void;
}) {
  const num = useNum();
  const [words, setWords] = useState<WordInfo[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!ayah) return;
    let alive = true;
    setWords(null);
    setError(false);
    fetchWords(`${ayah.s}:${ayah.a}`)
      .then((w) => alive && setWords(w))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [ayah]);

  return (
    <Sheet open={!!ayah} onClose={onClose} snap="high" title={ayah ? `المفردات · ${surahName} ${num(ayah.a)}` : ''}>
      {ayah && (
        <div className="flex flex-col gap-space-md">
          <p className="font-sans text-label-sm text-on-surface-variant">
            المعنى إنجليزي — الجذر والإعراب قريباً بإذن الله
          </p>

          {!words && !error && (
            <div className="grid grid-cols-2 gap-space-sm">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          )}
          {error && (
            <p className="py-space-lg text-center font-sans text-body-md text-on-surface-variant">
              تعذّر جلب المفردات. تأكد من الاتصال ثم أعد المحاولة.
            </p>
          )}
          {words && (
            <div className="grid grid-cols-2 gap-space-sm" dir="rtl">
              {words.map((w, i) => (
                <div key={i} className="flex flex-col items-center gap-space-2xs rounded-xl bg-surface-container p-space-md text-center">
                  <span className="font-quran text-quran-verse-md text-on-surface">{w.text}</span>
                  {w.translit && <span className="font-sans text-label-sm text-on-surface-variant" dir="ltr">{w.translit}</span>}
                  {w.translation && <span className="font-sans text-label-md text-primary" dir="ltr">{w.translation}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}
