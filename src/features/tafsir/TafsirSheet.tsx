import { useEffect, useState } from 'react';
import type { Ayah } from '@/data/types';
import { Sheet } from '@/components/Sheet';
import { Chip } from '@/components/Chip';
import { Skeleton } from '@/components/Skeleton';
import { AyahText } from '@/components/AyahText';
import { useNum } from '@/store/settings';
import { fetchTafsir, TAFSIR_SOURCES } from './tafsir';

export function TafsirSheet({
  ayah,
  surahName,
  onClose,
}: {
  ayah: Ayah | null;
  surahName: string;
  onClose: () => void;
}) {
  const num = useNum();
  const [sourceId, setSourceId] = useState(TAFSIR_SOURCES[0].id);
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!ayah) return;
    let alive = true;
    setText(null);
    setError(false);
    fetchTafsir(sourceId, `${ayah.s}:${ayah.a}`)
      .then((t) => alive && setText(t))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [ayah, sourceId]);

  return (
    <Sheet open={!!ayah} onClose={onClose} snap="high" title={ayah ? `تفسير ${surahName} · ${num(ayah.a)}` : ''}>
      {ayah && (
        <div className="flex flex-col gap-space-md">
          <div className="rounded-xl bg-surface-container p-space-md text-center" dir="rtl">
            <AyahText ayah={ayah} />
          </div>

          <div className="no-scrollbar -mx-1 flex gap-space-2xs overflow-x-auto px-1">
            {TAFSIR_SOURCES.map((s) => (
              <Chip key={s.id} label={s.name} selected={s.id === sourceId} onClick={() => setSourceId(s.id)} />
            ))}
          </div>

          {text == null && !error && (
            <div className="flex flex-col gap-space-xs">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          )}
          {error && (
            <p className="py-space-lg text-center font-sans text-body-md text-on-surface-variant">
              تعذّر جلب التفسير. تأكد من الاتصال ثم أعد المحاولة.
            </p>
          )}
          {text != null && (
            <div
              dir="rtl"
              className="tafsir-body font-sans text-body-lg leading-loose text-on-surface"
              // Trusted quran.com/QUL commentary HTML (not sacred text).
              dangerouslySetInnerHTML={{ __html: text }}
            />
          )}
        </div>
      )}
    </Sheet>
  );
}
