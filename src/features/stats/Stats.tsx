import { useMemo } from 'react';
import { Icon } from '@/components/Icon';
import { Card } from '@/components/Card';
import { useActivity } from '@/store/activity';
import { useHifz } from '@/store/hifz';
import { useLibrary } from '@/store/library';
import { useNum } from '@/store/settings';

const WEEKS = 17;
const LEVEL_BG = [
  'bg-surface-container-highest',
  'bg-primary-container/40',
  'bg-primary-container/70',
  'bg-primary/80',
  'bg-primary',
];

function level(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

export function Stats() {
  const num = useNum();
  const days = useActivity((s) => s.days);
  const streak = useHifz((s) => s.streak);
  const cardCount = useHifz((s) => Object.keys(s.cards).length);
  const bookmarks = useLibrary((s) => s.bookmarks.length);

  // Build a WEEKS×7 grid ending today; oldest first so RTL puts newest on the right.
  const grid = useMemo(() => {
    const cells: { date: string; count: number }[] = [];
    const today = new Date();
    const total = WEEKS * 7;
    for (let i = total - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      cells.push({ date: key, count: days[key] ?? 0 });
    }
    // columns of 7 (weeks)
    const cols: { date: string; count: number }[][] = [];
    for (let c = 0; c < WEEKS; c++) cols.push(cells.slice(c * 7, c * 7 + 7));
    return cols;
  }, [days]);

  const activeDays = Object.values(days).filter((c) => c > 0).length;

  return (
    <div className="flex flex-col gap-space-lg py-space-md">
      <div className="grid grid-cols-2 gap-space-md">
        <Stat icon="star" iconClass="text-secondary" label="الاستمرار" value={`${num(streak)} يوماً`} />
        <Stat icon="calendar_month" label="أيام نشطة" value={num(activeDays)} />
        <Stat icon="auto_stories" label="آيات محفوظة" value={num(cardCount)} />
        <Stat icon="bookmark" label="العلامات" value={num(bookmarks)} />
      </div>

      <section>
        <h2 className="mb-space-sm font-sans text-headline-sm text-on-surface">سجادة الاستمرار</h2>
        <Card>
          <div className="flex justify-center gap-[3px]" dir="ltr">
            {grid.map((col, ci) => (
              <div key={ci} className="flex flex-col gap-[3px]">
                {col.map((cell) => (
                  <span
                    key={cell.date}
                    title={`${cell.date}: ${cell.count}`}
                    className={`h-3.5 w-3.5 rounded-[3px] ${LEVEL_BG[level(cell.count)]}`}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="mt-space-md flex items-center justify-center gap-space-2xs">
            <span className="font-sans text-label-sm text-on-surface-variant">أقل</span>
            {LEVEL_BG.map((bg, i) => (
              <span key={i} className={`h-3 w-3 rounded-[3px] ${bg}`} />
            ))}
            <span className="font-sans text-label-sm text-on-surface-variant">أكثر</span>
          </div>
        </Card>
      </section>

      <p className="text-center font-sans text-label-sm text-on-surface-variant">
        هذه إحصاءاتك الخاصة — لا مقارنة ولا ترتيب مع أحد.
      </p>
    </div>
  );
}

function Stat({ icon, iconClass, label, value }: { icon: string; iconClass?: string; label: string; value: string }) {
  return (
    <Card>
      <div className="flex items-center gap-space-2xs text-on-surface-variant">
        <Icon name={icon} filled size={18} className={iconClass} />
        <span className="font-sans text-label-md">{label}</span>
      </div>
      <p className="mt-space-xs font-sans text-display-lg text-on-surface">{value}</p>
    </Card>
  );
}
