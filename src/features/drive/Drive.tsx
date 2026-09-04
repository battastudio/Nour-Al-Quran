import { useState } from 'react';
import { Icon } from '@/components/Icon';
import { usePlayer } from '@/features/audio/player';
import { useProgress } from '@/store/progress';
import { useSettings, useNum } from '@/store/settings';
import { surahMeta, getSurahMeta, loadSurah } from '@/data/loader';

// Large-button listening layout for hands-busy use. Just audio + Media Session —
// no CarPlay claims, no small tap targets.
export function Drive() {
  const num = useNum();
  const reciter = useSettings((s) => s.reciter);
  const lastRead = useProgress((s) => s.lastRead);
  const player = usePlayer();
  const [surah, setSurah] = useState(lastRead.surah);

  const playSurah = async (n: number) => {
    const f = await loadSurah(n);
    player.playList(
      f.ayahs.map((a) => ({ s: a.s, a: a.a })),
      reciter,
    );
  };

  const current = player.current;

  return (
    <div className="flex min-h-[80dvh] flex-col items-center justify-between py-space-xl">
      <div className="text-center">
        <p className="font-sans text-body-lg text-on-surface-variant">الاستماع</p>
        <p className="mt-space-xs font-title text-surah-title text-primary">
          سورة {getSurahMeta(current?.s ?? surah)?.name}
        </p>
        {current && <p className="font-sans text-headline-md text-on-surface">آية {num(current.a)}</p>}
      </div>

      <div className="flex items-center justify-center gap-space-xl">
        <button
          onClick={() => player.prev()}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-surface-container text-on-surface active:scale-95"
          aria-label="السابقة"
        >
          <Icon name="skip_next" size={40} />
        </button>
        <button
          onClick={() => (current ? player.toggle() : void playSurah(surah))}
          className="flex h-28 w-28 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg active:scale-95"
          aria-label="تشغيل/إيقاف"
        >
          <Icon name={player.playing ? 'pause' : 'play_arrow'} filled size={64} />
        </button>
        <button
          onClick={() => player.next()}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-surface-container text-on-surface active:scale-95"
          aria-label="التالية"
        >
          <Icon name="skip_previous" size={40} />
        </button>
      </div>

      <select
        value={surah}
        onChange={(e) => {
          const n = Number(e.target.value);
          setSurah(n);
          void playSurah(n);
        }}
        className="w-full max-w-xs rounded-xl bg-surface-container px-space-md py-space-md text-center font-sans text-headline-sm text-on-surface"
      >
        {surahMeta.map((m) => (
          <option key={m.n} value={m.n}>
            سورة {m.name}
          </option>
        ))}
      </select>
    </div>
  );
}
