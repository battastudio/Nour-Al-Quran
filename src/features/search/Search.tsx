import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { AyahText } from '@/components/AyahText';
import { Skeleton } from '@/components/Skeleton';
import { loadSurah, getSurahMeta } from '@/data/loader';
import type { Ayah } from '@/data/types';
import { normalize } from '@/lib/normalize';
import { useNum } from '@/store/settings';

interface IndexEntry {
  s: number;
  a: number;
  n: string;
}

const CAP = 50;

export function Search() {
  const num = useNum();
  const [q, setQ] = useState('');
  const [index, setIndex] = useState<IndexEntry[] | null>(null);
  const [rows, setRows] = useState<Ayah[] | null>(null);

  useEffect(() => {
    import('@/data/search-index.json').then((m) => setIndex(m.default as IndexEntry[]));
  }, []);

  const matches = useMemo(() => {
    const nq = normalize(q);
    if (!index || nq.length < 2) return [];
    return index.filter((e) => e.n.includes(nq)).slice(0, CAP);
  }, [q, index]);

  useEffect(() => {
    if (!matches.length) {
      setRows([]);
      return;
    }
    let alive = true;
    setRows(null);
    const surahs = [...new Set(matches.map((m) => m.s))];
    Promise.all(surahs.map((n) => loadSurah(n))).then((files) => {
      if (!alive) return;
      const byNum = new Map(files.map((f) => [f.meta.n, f]));
      setRows(
        matches
          .map((m) => byNum.get(m.s)?.ayahs[m.a - 1])
          .filter((a): a is Ayah => !!a),
      );
    });
    return () => {
      alive = false;
    };
  }, [matches]);

  return (
    <div className="flex flex-col gap-space-md py-space-md">
      <div className="flex items-center gap-space-xs rounded-full bg-surface-container px-space-md py-space-xs">
        <Icon name="search" size={20} className="text-on-surface-variant" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث في القرآن الكريم"
          className="w-full bg-transparent font-sans text-body-md text-on-surface outline-none placeholder:text-on-surface-variant"
        />
      </div>

      {q.length >= 2 && rows && (
        <p className="font-sans text-label-md text-on-surface-variant">
          {rows.length >= CAP ? `أكثر من ${num(CAP)} نتيجة` : `${num(rows.length)} نتيجة`}
        </p>
      )}

      {!index && <Skeleton className="h-10 w-full" />}

      {rows === null && q.length >= 2 && (
        <div className="flex flex-col gap-space-sm">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      <ul className="flex flex-col gap-space-sm">
        {rows?.map((a) => (
          <li key={`${a.s}:${a.a}`}>
            <Link
              to={`/read/${a.s}/${a.a}`}
              className="block rounded-xl bg-surface-container-low p-space-md active:bg-surface-container"
            >
              <div className="mb-space-2xs font-sans text-label-md text-primary">
                {getSurahMeta(a.s)?.name} · {num(a.a)}
              </div>
              <div dir="rtl" className="text-quran-verse-md leading-loose">
                <AyahText ayah={a} showNumber={false} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
