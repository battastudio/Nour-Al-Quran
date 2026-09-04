import type { Ayah } from '@/data/types';
import { Tajweed, type TajweedRange } from './Tajweed';
import { useNum, useSettings } from '@/store/settings';

// The ONLY component allowed to render sacred ayah text (`ayah.t`).
// Invariant, enforced by tests/quran-integrity.test.ts:
//   the [data-ayah-text] node's textContent === ayah.t, exactly, always.
// Rules that keep this true:
//   - the base render is the single bare expression {ayah.t} (no concat/templates)
//   - Tajweed only emits text.slice() segments (colour via class, never ::before)
//   - the ayah-number ornament lives OUTSIDE [data-ayah-text]

export function AyahText({
  ayah,
  tajweed,
  ranges,
  showNumber = true,
  className = '',
  onClick,
}: {
  ayah: Ayah;
  tajweed?: boolean; // overrides the global setting when provided
  ranges?: TajweedRange[];
  showNumber?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  const num = useNum();
  const globalTajweed = useSettings((s) => s.tajweed);
  const useTajweed = tajweed ?? globalTajweed;

  return (
    <span
      className={`ayah inline ${onClick ? 'cursor-pointer' : ''}`}
      role="group"
      aria-label={`الآية ${ayah.a}`}
      onClick={onClick}
    >
      <span data-ayah-text className={`ayah-text font-quran ${className}`}>
        {useTajweed ? <Tajweed text={ayah.t} ranges={ranges} /> : ayah.t}
      </span>
      {showNumber && (
        <span
          aria-hidden
          className="ayah-end mx-space-2xs inline-flex h-6 min-w-6 select-none items-center justify-center rounded-full border border-secondary/50 px-1 align-middle font-sans text-label-sm text-secondary"
        >
          {num(ayah.a)}
        </span>
      )}
    </span>
  );
}
