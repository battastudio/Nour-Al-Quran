import { useEffect, useState } from 'react';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import { Icon } from '@/components/Icon';
import { Ring } from '@/components/Ring';
import { SegmentedControl } from '@/components/SegmentedControl';
import { useNum } from '@/store/settings';

const PRESETS = ['سُبْحَانَ اللَّه', 'الْحَمْدُ لِلَّه', 'اللَّهُ أَكْبَر', 'لَا إِلٰهَ إِلَّا اللَّه'];
const TARGETS = [33, 100, 1000];
const vibrate = () => navigator.vibrate?.(8);

export function Tasbih() {
  const num = useNum();
  const [dhikr, setDhikr] = useState(PRESETS[0]);
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(33);
  const [lifetime, setLifetime] = useState(0);

  useEffect(() => {
    idbGet<number>('nour-tasbih-total').then((v) => setLifetime(v ?? 0));
  }, []);

  const inc = () => {
    vibrate();
    setCount((c) => {
      const next = c + 1;
      if (next % target === 0) navigator.vibrate?.([12, 40, 12]); // gentle cue at each target
      return next;
    });
    setLifetime((l) => {
      const next = l + 1;
      void idbSet('nour-tasbih-total', next);
      return next;
    });
  };

  const reset = () => setCount(0);

  return (
    <div className="flex flex-col items-center gap-space-lg py-space-md">
      <SegmentedControl
        value={String(target)}
        onChange={(v) => setTarget(Number(v))}
        options={TARGETS.map((t) => ({ value: String(t), label: num(t) }))}
      />

      <div className="flex flex-wrap justify-center gap-space-2xs">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => setDhikr(p)}
            className={`rounded-full px-space-md py-1.5 font-quran text-body-lg ${
              dhikr === p ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <button
        onClick={inc}
        className="flex flex-col items-center justify-center gap-space-sm rounded-full active:scale-95"
        aria-label="سبّح"
      >
        <Ring value={count % target || (count > 0 ? target : 0)} max={target} size={220} stroke={14}>
          <div className="flex flex-col items-center">
            <span className="font-quran text-headline-md text-on-surface">{dhikr}</span>
            <span className="mt-space-2xs font-sans text-display-lg text-primary">{num(count)}</span>
            <span className="font-sans text-label-md text-on-surface-variant">
              الجولة {num(Math.floor(count / target) + (count % target ? 1 : count > 0 ? 0 : 1))}
            </span>
          </div>
        </Ring>
      </button>

      <div className="flex items-center gap-space-lg">
        <button onClick={reset} className="flex items-center gap-space-2xs rounded-full bg-surface-container px-space-md py-space-sm font-sans text-body-md text-on-surface">
          <Icon name="refresh" size={20} />
          تصفير
        </button>
        <span className="font-sans text-label-md text-on-surface-variant">الإجمالي: {num(lifetime)}</span>
      </div>
    </div>
  );
}
