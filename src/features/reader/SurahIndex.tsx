import { useState } from 'react';
import { Link } from 'react-router-dom';
import { surahMeta } from '@/data/loader';
import { useNum } from '@/store/settings';
import { normalize } from '@/lib/normalize';
import { Icon } from '@/components/Icon';

export function SurahIndex() {
  const num = useNum();
  const [q, setQ] = useState('');
  const nq = normalize(q);
  const list = nq
    ? surahMeta.filter(
        (m) => normalize(m.name).includes(nq) || m.nameLatin.toLowerCase().includes(q.toLowerCase()),
      )
    : surahMeta;

  return (
    <div className="flex flex-col gap-space-md py-space-md">
      <div className="flex items-center gap-space-xs rounded-full bg-surface-container px-space-md py-space-xs">
        <Icon name="search" size={20} className="text-on-surface-variant" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث عن سورة"
          className="w-full bg-transparent font-sans text-body-md text-on-surface outline-none placeholder:text-on-surface-variant"
        />
      </div>

      <ul className="flex flex-col">
        {list.map((m) => (
          <li key={m.n}>
            <Link
              to={`/read/${m.n}`}
              className="flex items-center gap-space-md rounded-xl px-space-xs py-space-sm active:bg-surface-container"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container text-label-md font-semibold text-primary">
                {num(m.n)}
              </span>
              <div className="flex-1 text-right">
                <p className="font-title text-headline-sm text-on-surface">سورة {m.name}</p>
                <p className="font-sans text-label-md text-on-surface-variant">
                  {m.revelation === 'meccan' ? 'مكية' : 'مدنية'} · {num(m.ayahCount)} آية
                </p>
              </div>
              <Icon name="chevron_left" className="text-on-surface-variant" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
