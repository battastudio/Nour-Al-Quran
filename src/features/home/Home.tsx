import { Link } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { Card } from '@/components/Card';
import { Ring } from '@/components/Ring';
import { useProgress } from '@/store/progress';
import { useLocation, PRAYER_LABELS } from '@/store/location';
import { useSettings, useNum } from '@/store/settings';
import { getSurahMeta } from '@/data/loader';
import { hijriDate } from '@/lib/hijri';
import { fmt } from '@/lib/fmt';
import { nextPrayer } from '@/features/prayer/times';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'ليلة مباركة';
  if (h < 12) return 'صباح الخير';
  if (h < 17) return 'طاب يومك';
  return 'مساء الخير';
}

const QUICK = [
  { to: '/tasmi', icon: 'mic', label: 'التسميع' },
  { to: '/hifz', icon: 'auto_stories', label: 'الحفظ' },
  { to: '/adhkar', icon: 'menu_book', label: 'الأذكار' },
  { to: '/prayer/qibla', icon: 'explore', label: 'القبلة' },
  { to: '/search', icon: 'search', label: 'البحث' },
  { to: '/khatmah', icon: 'event_repeat', label: 'الختمة' },
];

export function Home() {
  const num = useNum();
  const arabic = useSettings((s) => s.numerals === 'arabic');
  const { lastRead, wirdTarget, wirdCount, wirdDate } = useProgress();
  const loc = useLocation();

  const meta = getSurahMeta(lastRead.surah);
  const todaysWird = wirdDate === new Date().toISOString().slice(0, 10) ? wirdCount : 0;

  const next =
    loc.lat != null && loc.lng != null
      ? nextPrayer(new Date(), loc.lat, loc.lng, loc.method, loc.madhab)
      : null;

  return (
    <div className="flex flex-col gap-space-lg py-space-md">
      <header className="pt-space-xs">
        <h1 className="font-sans text-display-lg text-on-surface">{greeting()}</h1>
        <p className="mt-1 font-sans text-body-md text-on-surface-variant">{hijriDate()}</p>
      </header>

      {/* Continue reading */}
      <Card className="!bg-primary-container !text-on-primary-container">
        <Link to={`/read/${lastRead.surah}/${lastRead.ayah}`} className="flex items-center justify-between">
          <div className="text-right">
            <p className="font-sans text-label-md opacity-80">متابعة القراءة</p>
            <p className="mt-1 font-title text-headline-md">
              سورة {meta?.name ?? ''} · الآية {num(lastRead.ayah)}
            </p>
          </div>
          <Icon name="play_circle" filled size={40} />
        </Link>
      </Card>

      {/* Next prayer + wird ring */}
      <div className="grid grid-cols-2 gap-space-md">
        <Card>
          <Link to="/prayer" className="flex h-full flex-col justify-between">
            <div className="flex items-center gap-space-2xs text-on-surface-variant">
              <Icon name="mosque" size={18} />
              <span className="font-sans text-label-md">الصلاة القادمة</span>
            </div>
            {next ? (
              <div className="mt-space-sm text-right">
                <p className="font-sans text-headline-md text-on-surface">
                  {next.key === 'sunrise' ? 'الشروق' : PRAYER_LABELS[next.key]}
                </p>
                <p className="font-sans text-body-md text-primary">{fmt.time(next.time, arabic)}</p>
              </div>
            ) : (
              <p className="mt-space-sm font-sans text-body-md text-primary">حدّد موقعك</p>
            )}
          </Link>
        </Card>

        <Card>
          <div className="flex items-center gap-space-2xs text-on-surface-variant">
            <Icon name="local_florist" size={18} />
            <span className="font-sans text-label-md">الورد اليومي</span>
          </div>
          <div className="mt-space-sm flex items-center justify-center">
            <Ring value={todaysWird} max={wirdTarget} size={68}>
              <span className="font-sans text-label-md text-on-surface">
                {num(todaysWird)}/{num(wirdTarget)}
              </span>
            </Ring>
          </div>
        </Card>
      </div>

      {/* Quick actions */}
      <section>
        <h2 className="mb-space-sm font-sans text-headline-sm text-on-surface">إجراءات سريعة</h2>
        <div className="grid grid-cols-3 gap-space-sm">
          {QUICK.map((q) => (
            <Link
              key={q.to}
              to={q.to}
              className="flex flex-col items-center gap-space-2xs rounded-xl bg-surface-container-low p-space-md text-on-surface transition-transform active:scale-95"
            >
              <Icon name={q.icon} className="text-primary" size={26} />
              <span className="font-sans text-label-md">{q.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
