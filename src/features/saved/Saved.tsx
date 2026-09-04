import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AyahText } from '@/components/AyahText';
import { Icon } from '@/components/Icon';
import { Skeleton } from '@/components/Skeleton';
import { SegmentedControl } from '@/components/SegmentedControl';
import { toast } from '@/components/Toast';
import { loadSurah, getSurahMeta } from '@/data/loader';
import type { Ayah } from '@/data/types';
import { useLibrary, type Highlight } from '@/store/library';
import { useNum } from '@/store/settings';
import { exportSavedMarkdown } from './markdown';

type Tab = 'bookmarks' | 'notes' | 'highlights';

const TABS: { value: Tab; label: string }[] = [
  { value: 'bookmarks', label: 'العلامات' },
  { value: 'notes', label: 'الملاحظات' },
  { value: 'highlights', label: 'التظليل' },
];

const EMPTY: Record<Tab, string> = {
  bookmarks: 'لا علامات بعد',
  notes: 'لا ملاحظات بعد',
  highlights: 'لا تظليل بعد',
};

const TAB_ICON: Record<Tab, string> = {
  bookmarks: 'bookmark',
  notes: 'edit_note',
  highlights: 'ink_highlighter',
};

// Solid swatch colours matching the reader's highlight background family.
const HL_SWATCH: Record<Highlight, string> = {
  yellow: 'bg-secondary-container',
  green: 'bg-primary-container',
  blue: 'bg-inverse-primary',
  pink: 'bg-error-container',
};

export function Saved() {
  const num = useNum();
  const { bookmarks, notes, highlights } = useLibrary();
  const [tab, setTab] = useState<Tab>('bookmarks');
  const [ayahs, setAyahs] = useState<Map<string, Ayah> | null>(null);

  // Every key referenced across all three sections — load the surahs once.
  const allKeys = useMemo(
    () => [...new Set([...bookmarks, ...Object.keys(notes), ...Object.keys(highlights)])],
    [bookmarks, notes, highlights],
  );

  useEffect(() => {
    if (!allKeys.length) {
      setAyahs(new Map());
      return;
    }
    let alive = true;
    setAyahs(null);
    const surahs = [...new Set(allKeys.map((k) => Number(k.split(':')[0])))];
    Promise.all(surahs.map((n) => loadSurah(n))).then((files) => {
      if (!alive) return;
      const byNum = new Map(files.map((f) => [f.meta.n, f]));
      const map = new Map<string, Ayah>();
      for (const k of allKeys) {
        const [s, a] = k.split(':').map(Number);
        const ay = byNum.get(s)?.ayahs[a - 1];
        if (ay) map.set(k, ay);
      }
      setAyahs(map);
    });
    return () => {
      alive = false;
    };
  }, [allKeys]);

  const keys =
    tab === 'bookmarks' ? bookmarks : tab === 'notes' ? Object.keys(notes) : Object.keys(highlights);

  const handleExport = () => {
    if (!allKeys.length) {
      toast('لا يوجد محتوى محفوظ');
      return;
    }
    void exportSavedMarkdown().then(() => toast('تم تصدير Markdown'));
  };

  return (
    <div className="flex flex-col gap-space-md py-space-md">
      <div className="flex flex-wrap items-center justify-between gap-space-sm">
        <SegmentedControl options={TABS} value={tab} onChange={setTab} />
        <button
          onClick={handleExport}
          className="flex items-center gap-space-2xs rounded-full bg-surface-container px-space-md py-1.5 font-sans text-label-md text-on-surface active:bg-surface-container-high"
        >
          <Icon name="download" size={18} />
          تصدير Markdown
        </button>
      </div>

      {ayahs === null ? (
        <div className="flex flex-col gap-space-sm">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : keys.length === 0 ? (
        <div className="flex flex-col items-center gap-space-sm py-space-2xl text-on-surface-variant">
          <Icon name={TAB_ICON[tab]} size={40} className="text-on-surface-variant" />
          <p className="font-sans text-body-lg">{EMPTY[tab]}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-space-sm">
          {keys.map((k) => {
            const ay = ayahs.get(k);
            if (!ay) return null;
            const [s, a] = k.split(':').map(Number);
            return (
              <li key={k}>
                <Link
                  to={`/read/${s}/${a}`}
                  className="block rounded-xl bg-surface-container-low p-space-md active:bg-surface-container"
                >
                  <div className="mb-space-2xs flex items-center gap-space-xs font-sans text-label-md text-primary">
                    {tab === 'highlights' && (
                      <span
                        className={`inline-block h-3 w-3 rounded-full ${HL_SWATCH[highlights[k]]}`}
                      />
                    )}
                    <span>
                      {getSurahMeta(s)?.name} · {num(a)}
                    </span>
                  </div>
                  <div dir="rtl" className="text-quran-verse-md leading-loose">
                    <AyahText ayah={ay} showNumber={false} />
                  </div>
                  {tab === 'notes' && (
                    <p className="mt-space-sm font-sans text-body-md text-on-surface-variant">
                      {notes[k].text}
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
