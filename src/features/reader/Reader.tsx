import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { SurahFile, Ayah } from '@/data/types';
import { loadSurah, basmala } from '@/data/loader';
import { AyahText } from '@/components/AyahText';
import { Icon } from '@/components/Icon';
import { Skeleton } from '@/components/Skeleton';
import { Sheet } from '@/components/Sheet';
import { SegmentedControl } from '@/components/SegmentedControl';
import { toast } from '@/components/Toast';
import { useSettings, useNum } from '@/store/settings';
import { useProgress } from '@/store/progress';
import { useLibrary, ayahKey, type Highlight } from '@/store/library';
import { usePlayer } from '@/features/audio/player';
import { useWakeLock } from '@/lib/wakeLock';
import { logActivity } from '@/store/activity';
import { TafsirSheet } from '@/features/tafsir/TafsirSheet';
import { WordSheet } from '@/features/words/WordSheet';
import { hasSimilar } from '@/features/similar/similarData';
import { ShareSheet } from '@/features/share/ShareSheet';

const HL_CLASS: Record<Highlight, string> = {
  yellow: 'bg-secondary-container/50',
  green: 'bg-primary-container/25',
  blue: 'bg-inverse-primary/25',
  pink: 'bg-error-container/50',
};

export function Reader() {
  const { surah = '1', ayah } = useParams();
  const navigate = useNavigate();
  const surahNum = Number(surah);
  const [file, setFile] = useState<SurahFile | null>(null);
  const [selected, setSelected] = useState<Ayah | null>(null);
  const [tafsirFor, setTafsirFor] = useState<Ayah | null>(null);
  const [wordsFor, setWordsFor] = useState<Ayah | null>(null);
  const [shareFor, setShareFor] = useState<Ayah | null>(null);

  const readerMode = useSettings((s) => s.readerMode);
  const setReaderMode = useSettings((s) => s.setReaderMode);
  const fontScale = useSettings((s) => s.fontScale);
  const reciter = useSettings((s) => s.reciter);
  const num = useNum();
  const setLastRead = useProgress((s) => s.setLastRead);
  const { bookmarks, highlights, toggleBookmark, setHighlight } = useLibrary();

  const [focusIdx, setFocusIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useWakeLock(true);

  useEffect(() => {
    let alive = true;
    setFile(null);
    loadSurah(surahNum).then((f) => {
      if (alive) setFile(f);
    });
    return () => {
      alive = false;
    };
  }, [surahNum]);

  // Jump to requested ayah and record last-read.
  useEffect(() => {
    if (!file) return;
    const a = ayah ? Number(ayah) : 1;
    setLastRead({ surah: surahNum, ayah: a });
    logActivity();
    if (readerMode === 'focus') {
      setFocusIdx(Math.max(0, a - 1));
    } else {
      const t = setTimeout(() => {
        containerRef.current?.querySelector(`[data-ayah="${a}"]`)?.scrollIntoView({ block: 'center' });
      }, 50);
      return () => clearTimeout(t);
    }
  }, [file, ayah, surahNum, readerMode, setLastRead]);

  const ayahStyle = useMemo(
    () => ({ fontSize: `${22 * fontScale}px`, lineHeight: `${46 * fontScale}px` }),
    [fontScale],
  );

  if (!file) {
    return (
      <div className="flex flex-col gap-space-md py-space-lg">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  const { meta, ayahs } = file;

  const playFrom = (idx: number) => {
    usePlayer.getState().playList(
      ayahs.slice(idx).map((a) => ({ s: a.s, a: a.a })),
      reciter,
    );
    setSelected(null);
    toast('بدأ التشغيل');
  };

  const openActions = (a: Ayah) => {
    setSelected(a);
    setLastRead({ surah: surahNum, ayah: a.a });
  };

  return (
    <div className="py-space-md">
      {/* Surah header */}
      <div className="mb-space-lg flex flex-col items-center gap-space-2xs text-center">
        <h1 className="font-title text-surah-title text-primary">سورة {meta.name}</h1>
        <p className="font-sans text-label-md text-on-surface-variant">
          {meta.revelation === 'meccan' ? 'مكية' : 'مدنية'} · {num(meta.ayahCount)} آية
        </p>
        <SegmentedControl
          className="mt-space-sm"
          value={readerMode}
          onChange={setReaderMode}
          options={[
            { value: 'scroll', label: 'تمرير' },
            { value: 'mushaf', label: 'مصحف' },
            { value: 'focus', label: 'تركيز' },
          ]}
        />
      </div>

      {meta.bismillah && (
        <p className="mb-space-lg text-center text-on-surface" style={ayahStyle} dir="rtl">
          {/* routed through the single sacred renderer; byte-faithful basmala */}
          <AyahText ayah={{ s: surahNum, a: 0, t: basmala, p: 0, j: 0, h: 0, r: 0 }} showNumber={false} />
        </p>
      )}

      {readerMode === 'focus' ? (
        <FocusView
          ayahs={ayahs}
          idx={focusIdx}
          setIdx={setFocusIdx}
          style={ayahStyle}
          onActions={openActions}
          num={num}
        />
      ) : (
        <div
          ref={containerRef}
          className={`text-right ${readerMode === 'mushaf' ? 'text-justify leading-loose' : ''}`}
          style={ayahStyle}
          dir="rtl"
        >
          {ayahs.map((a) => {
            const k = ayahKey(a.s, a.a);
            const hl = highlights[k];
            return (
              <span
                key={a.a}
                data-ayah={a.a}
                className={`rounded px-0.5 ${hl ? HL_CLASS[hl] : ''}`}
              >
                <AyahText ayah={a} onClick={() => openActions(a)} />{' '}
              </span>
            );
          })}
        </div>
      )}

      {/* Ayah action sheet */}
      <Sheet open={!!selected} onClose={() => setSelected(null)} title={selected ? `${meta.name} · ${num(selected.a)}` : ''}>
        {selected && (
          <div className="flex flex-col gap-space-xs">
            <ActionRow
              icon="play_arrow"
              label="استماع من هنا"
              onClick={() => playFrom(ayahs.indexOf(selected))}
            />
            <ActionRow
              icon={bookmarks.includes(ayahKey(selected.s, selected.a)) ? 'bookmark' : 'bookmark_border'}
              label="علامة مرجعية"
              onClick={() => {
                toggleBookmark(selected.s, selected.a);
                toast('تم تحديث العلامات');
              }}
            />
            <ActionRow icon="menu_book" label="التفسير" onClick={() => { setTafsirFor(selected); setSelected(null); }} />
            <ActionRow icon="translate" label="المفردات" onClick={() => { setWordsFor(selected); setSelected(null); }} />
            {hasSimilar(selected.s, selected.a) && (
              <ActionRow
                icon="join_inner"
                label="المتشابهات"
                onClick={() => navigate(`/similar/${selected.s}/${selected.a}`)}
              />
            )}
            <ActionRow
              icon="content_copy"
              label="نسخ الآية"
              onClick={() => {
                void navigator.clipboard?.writeText(selected.t);
                toast('نُسخت الآية');
              }}
            />
            <ActionRow icon="share" label="مشاركة" onClick={() => { setShareFor(selected); setSelected(null); }} />
            <div className="mt-space-xs flex items-center gap-space-sm px-space-2xs">
              <span className="font-sans text-label-md text-on-surface-variant">تظليل:</span>
              {(['yellow', 'green', 'blue', 'pink'] as Highlight[]).map((h) => (
                <button
                  key={h}
                  aria-label={`تظليل ${h}`}
                  onClick={() => {
                    setHighlight(selected.s, selected.a, highlights[ayahKey(selected.s, selected.a)] === h ? null : h);
                  }}
                  className={`h-7 w-7 rounded-full border border-outline-variant ${HL_CLASS[h]}`}
                />
              ))}
            </div>
          </div>
        )}
      </Sheet>

      <TafsirSheet ayah={tafsirFor} surahName={meta.name} onClose={() => setTafsirFor(null)} />
      <WordSheet ayah={wordsFor} surahName={meta.name} onClose={() => setWordsFor(null)} />
      <ShareSheet ayah={shareFor} surahName={meta.name} onClose={() => setShareFor(null)} />
    </div>
  );
}

function ActionRow({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-space-md rounded-xl px-space-sm py-space-sm text-right active:bg-surface-container"
    >
      <Icon name={icon} className="text-primary" />
      <span className="font-sans text-body-lg text-on-surface">{label}</span>
    </button>
  );
}

function FocusView({
  ayahs,
  idx,
  setIdx,
  style,
  onActions,
  num,
}: {
  ayahs: Ayah[];
  idx: number;
  setIdx: (i: number) => void;
  style: React.CSSProperties;
  onActions: (a: Ayah) => void;
  num: (v: number) => string;
}) {
  const a = ayahs[Math.min(idx, ayahs.length - 1)];
  return (
    <div className="flex min-h-[50dvh] flex-col items-center justify-center gap-space-xl text-center">
      <div style={style} dir="rtl" onClick={() => onActions(a)}>
        <AyahText ayah={a} />
      </div>
      <div className="flex items-center gap-space-lg">
        <button
          aria-label="التالية"
          disabled={idx >= ayahs.length - 1}
          onClick={() => setIdx(idx + 1)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-container disabled:opacity-40"
        >
          <Icon name="chevron_right" />
        </button>
        <span className="font-sans text-label-md text-on-surface-variant">
          {num(a.a)} / {num(ayahs.length)}
        </span>
        <button
          aria-label="السابقة"
          disabled={idx <= 0}
          onClick={() => setIdx(idx - 1)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-container disabled:opacity-40"
        >
          <Icon name="chevron_left" />
        </button>
      </div>
    </div>
  );
}
