import { useState } from 'react';
import { Icon } from '@/components/Icon';
import { Card } from '@/components/Card';
import { useNum } from '@/store/settings';
import adhkarData from '@/data/adhkar.json';

interface Item {
  text: string;
  count: number;
  ref: string;
}
interface Category {
  category: string;
  items: Item[];
}

const CATS = adhkarData as Category[];
const vibrate = () => navigator.vibrate?.(8);

export function Adhkar() {
  const [active, setActive] = useState<Category | null>(null);

  if (active) return <Session cat={active} onBack={() => setActive(null)} />;

  return (
    <div className="flex flex-col gap-space-sm py-space-md">
      <p className="font-sans text-body-md text-on-surface-variant">حصن المسلم — اختر مجموعة الأذكار</p>
      <ul className="flex flex-col gap-space-2xs">
        {CATS.map((c, i) => (
          <li key={i}>
            <Card onClick={() => setActive(c)} className="flex items-center justify-between">
              <span className="font-sans text-body-lg text-on-surface">{c.category}</span>
              <Icon name="chevron_left" className="text-on-surface-variant" />
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Session({ cat, onBack }: { cat: Category; onBack: () => void }) {
  const num = useNum();
  // remaining repetitions per item; tap decrements
  const [remaining, setRemaining] = useState<number[]>(() => cat.items.map((it) => it.count));

  const tap = (i: number) => {
    setRemaining((r) => {
      if (r[i] <= 0) return r;
      vibrate();
      const next = [...r];
      next[i] = r[i] - 1;
      return next;
    });
  };

  const doneCount = remaining.filter((r) => r <= 0).length;

  return (
    <div className="flex flex-col gap-space-md py-space-md">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-space-2xs font-sans text-body-md text-primary">
          <Icon name="chevron_right" size={20} />
          كل الأذكار
        </button>
        <span className="font-sans text-label-md text-on-surface-variant">
          {num(doneCount)} / {num(cat.items.length)}
        </span>
      </div>
      <h2 className="font-title text-headline-md text-on-surface">{cat.category}</h2>

      <ul className="flex flex-col gap-space-md">
        {cat.items.map((it, i) => {
          const done = remaining[i] <= 0;
          return (
            <li key={i}>
              <button
                onClick={() => tap(i)}
                className={`w-full rounded-xl p-space-lg text-right transition-colors ${
                  done ? 'bg-primary-container/40' : 'bg-surface-container-low active:bg-surface-container'
                }`}
                dir="rtl"
              >
                <p className="font-quran text-quran-verse-md leading-loose text-on-surface">{it.text}</p>
                <div className="mt-space-sm flex items-center justify-between">
                  {it.ref && <span className="font-sans text-label-sm text-on-surface-variant">{it.ref}</span>}
                  <span
                    className={`flex h-9 min-w-9 items-center justify-center rounded-full px-space-sm font-sans text-label-md ${
                      done ? 'bg-primary text-on-primary' : 'bg-secondary-container text-on-secondary-container'
                    }`}
                  >
                    {done ? <Icon name="check" size={18} /> : num(remaining[i])}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
