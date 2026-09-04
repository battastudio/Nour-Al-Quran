import { useState } from 'react';
import { usePlayer } from '@/features/audio/player';
import { reciterName } from '@/features/audio/reciters';
import { getSurahMeta } from '@/data/loader';
import { useNum } from '@/store/settings';
import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';

// Global audio player: compact mini-bar above the bottom nav (shown only while
// audio is active) that opens a full-screen player sheet on tap.
export function MiniPlayer() {
  const { current, playing, queue, qi, reciter, toggle, next, prev, stop } = usePlayer();
  const num = useNum();
  const [open, setOpen] = useState(false);

  if (!current) return null;

  const name = getSurahMeta(current.s)?.name ?? '';

  return (
    <>
      {/* Mini-bar — sits just above the bottom nav */}
      <div className="fixed inset-x-0 bottom-16 z-30 mx-auto max-w-max-content-width px-gutter-mobile">
        <div className="flex items-center gap-space-md rounded-xl bg-surface-container-high p-space-md shadow-lg">
          {/* Tapping the info area (not the buttons) opens the full sheet */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="فتح المشغل"
            className="flex min-w-0 flex-1 flex-col items-start text-start"
          >
            <span className="truncate font-sans text-body-md text-on-surface">{name}</span>
            <span className="font-sans text-label-md text-on-surface-variant">
              آية {num(current.a)}
            </span>
          </button>

          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? 'إيقاف مؤقت' : 'تشغيل'}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary"
          >
            <Icon name={playing ? 'pause' : 'play_arrow'} filled />
          </button>

          <button
            type="button"
            onClick={stop}
            aria-label="إيقاف"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-on-surface-variant"
          >
            <Icon name="close" />
          </button>
        </div>
      </div>

      {/* Full-screen player */}
      <Sheet open={open} onClose={() => setOpen(false)} snap="high">
        <div className="flex h-full flex-col items-center justify-center gap-space-lg text-center">
          <div className="flex flex-col items-center gap-space-xs">
            <h2 className="font-title text-headline-md text-on-surface">{name}</h2>
            <p className="font-sans text-body-lg text-on-surface-variant">آية {num(current.a)}</p>
          </div>

          <div className="flex items-center justify-center gap-space-lg">
            <button
              type="button"
              onClick={prev}
              aria-label="الآية السابقة"
              className="flex h-14 w-14 items-center justify-center rounded-full text-on-surface"
            >
              <Icon name="skip_previous" filled size={32} />
            </button>

            <button
              type="button"
              onClick={toggle}
              aria-label={playing ? 'إيقاف مؤقت' : 'تشغيل'}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg"
            >
              <Icon name={playing ? 'pause' : 'play_arrow'} filled size={44} />
            </button>

            <button
              type="button"
              onClick={next}
              aria-label="الآية التالية"
              className="flex h-14 w-14 items-center justify-center rounded-full text-on-surface"
            >
              <Icon name="skip_next" filled size={32} />
            </button>
          </div>

          <p className="font-sans text-body-md text-on-surface-variant">
            {num(qi + 1)} / {num(queue.length)}
          </p>
          <p className="font-sans text-label-md text-on-surface-variant">{reciterName(reciter)}</p>
        </div>
      </Sheet>
    </>
  );
}
