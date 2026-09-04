import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Ayah } from '@/data/types';
import { loadSurah, getSurahMeta, surahMeta } from '@/data/loader';
import { AyahText } from '@/components/AyahText';
import { Icon } from '@/components/Icon';
import { Card } from '@/components/Card';
import { Skeleton } from '@/components/Skeleton';
import { SegmentedControl } from '@/components/SegmentedControl';
import { useNum } from '@/store/settings';
import { getSimilar } from './similarData';

type Mode = 'list' | 'quiz';

export function Similar() {
  const { s = '1', a = '1' } = useParams();
  const sNum = Number(s);
  const aNum = Number(a);
  const num = useNum();
  const [mode, setMode] = useState<Mode>('list');
  const [source, setSource] = useState<Ayah | null>(null);
  const [similars, setSimilars] = useState<Ayah[] | null>(null);

  useEffect(() => {
    let alive = true;
    setSource(null);
    setSimilars(null);
    const refs = getSimilar(sNum, aNum);
    const surahs = [...new Set([sNum, ...refs.map((r) => r.s)])];
    Promise.all(surahs.map((n) => loadSurah(n))).then((files) => {
      if (!alive) return;
      const byNum = new Map(files.map((f) => [f.meta.n, f]));
      setSource(byNum.get(sNum)?.ayahs[aNum - 1] ?? null);
      setSimilars(refs.map((r) => byNum.get(r.s)?.ayahs[r.a - 1]).filter((x): x is Ayah => !!x));
    });
    return () => {
      alive = false;
    };
  }, [sNum, aNum]);

  if (!source || !similars) {
    return (
      <div className="flex flex-col gap-space-md py-space-lg">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (!similars.length) {
    return (
      <div className="flex flex-col items-center gap-space-md py-space-2xl text-center">
        <Icon name="join_inner" size={44} className="text-on-surface-variant" />
        <p className="font-sans text-body-lg text-on-surface">لا متشابهات لفظية بارزة لهذه الآية.</p>
        <Link to={`/read/${sNum}/${aNum}`} className="text-primary">العودة للقراءة</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-space-lg py-space-md">
      <SegmentedControl
        value={mode}
        onChange={setMode}
        className="self-center"
        options={[
          { value: 'list', label: 'المتشابهات' },
          { value: 'quiz', label: 'اختبار' },
        ]}
      />

      {mode === 'list' ? (
        <>
          <div className="rounded-xl bg-primary-container/30 p-space-md" dir="rtl">
            <p className="mb-space-2xs font-sans text-label-md text-primary">
              {getSurahMeta(sNum)?.name} · {num(aNum)}
            </p>
            <div className="text-quran-verse-md leading-loose">
              <AyahText ayah={source} showNumber={false} />
            </div>
          </div>
          <p className="font-sans text-label-md text-on-surface-variant">
            {num(similars.length)} آية متشابهة لفظياً
          </p>
          <ul className="flex flex-col gap-space-sm">
            {similars.map((ay) => (
              <li key={`${ay.s}:${ay.a}`}>
                <Link to={`/read/${ay.s}/${ay.a}`} className="block rounded-xl bg-surface-container-low p-space-md active:bg-surface-container">
                  <p className="mb-space-2xs font-sans text-label-md text-primary">
                    {getSurahMeta(ay.s)?.name} · {num(ay.a)}
                  </p>
                  <div dir="rtl" className="text-quran-verse-md leading-loose">
                    <AyahText ayah={ay} showNumber={false} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <Quiz pool={[source, ...similars]} />
      )}
    </div>
  );
}

// Quiz: show an ayah, guess its surah among 4 options. Honest, no scoring claims
// beyond a simple tally.
function Quiz({ pool }: { pool: Ayah[] }) {
  const num = useNum();
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);

  const ayah = pool[i % pool.length];
  const options = useMemo(() => {
    const correct = ayah.s;
    const opts = new Set<number>([correct]);
    // distractors: prefer other surahs present in the pool, then random surahs
    for (const p of pool) if (opts.size < 4) opts.add(p.s);
    let guard = 0;
    while (opts.size < 4 && guard++ < 200) {
      opts.add(1 + Math.floor((surahMeta.length * ((i + guard) % 97)) / 97) % 114);
    }
    return [...opts].sort((x, y) => ((x * 7 + i) % 5) - ((y * 7 + i) % 5));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  const answer = (surah: number) => {
    if (picked != null) return;
    setPicked(surah);
    if (surah === ayah.s) setScore((s) => s + 1);
  };

  return (
    <div className="flex flex-col gap-space-lg">
      <div className="flex items-center justify-between">
        <span className="font-sans text-label-md text-on-surface-variant">سؤال {num(i + 1)}</span>
        <span className="font-sans text-label-md text-primary">النتيجة {num(score)}</span>
      </div>

      <Card className="!bg-surface-container">
        <div dir="rtl" className="text-quran-verse-md leading-loose">
          <AyahText ayah={ayah} showNumber={false} />
        </div>
      </Card>

      <p className="font-sans text-body-md text-on-surface-variant">من أي سورة هذه الآية؟</p>
      <div className="grid grid-cols-2 gap-space-sm">
        {options.map((sNum) => {
          const isCorrect = sNum === ayah.s;
          const state =
            picked == null
              ? 'bg-surface-container-low text-on-surface'
              : isCorrect
                ? 'bg-primary text-on-primary'
                : sNum === picked
                  ? 'bg-error-container text-on-error-container'
                  : 'bg-surface-container-low text-on-surface-variant';
          return (
            <button key={sNum} onClick={() => answer(sNum)} className={`rounded-xl p-space-md font-title text-headline-sm ${state}`}>
              {getSurahMeta(sNum)?.name}
            </button>
          );
        })}
      </div>

      {picked != null && (
        <button
          onClick={() => {
            setPicked(null);
            setI((x) => x + 1);
          }}
          className="self-center rounded-full bg-primary px-space-xl py-space-sm font-sans text-body-lg text-on-primary"
        >
          التالي
        </button>
      )}
    </div>
  );
}
