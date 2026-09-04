import { Link } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { Card } from '@/components/Card';
import { useLocation } from '@/store/location';
import { useSettings } from '@/store/settings';
import { useProgress } from '@/store/progress';
import { nightThirds } from '@/features/prayer/times';
import { getSurahMeta } from '@/data/loader';
import { fmt } from '@/lib/fmt';

// Qiyām / tahajjud helper: shows the night windows (honest, from adhan-js).
export function Night() {
  const loc = useLocation();
  const arabic = useSettings((s) => s.numerals === 'arabic');
  const lastRead = useProgress((s) => s.lastRead);

  if (loc.lat == null || loc.lng == null) {
    return (
      <div className="flex flex-col items-center gap-space-md py-space-2xl text-center">
        <Icon name="bedtime" size={48} className="text-on-surface-variant" />
        <p className="font-sans text-body-lg text-on-surface">حدّد موقعك لعرض أوقات قيام الليل.</p>
        <Link to="/prayer" className="rounded-full bg-primary px-space-xl py-space-sm font-sans text-body-lg text-on-primary">
          شاشة المواقيت
        </Link>
      </div>
    );
  }

  const t = nightThirds(new Date(), loc.lat, loc.lng, loc.method, loc.madhab);

  const rows = [
    { icon: 'nights_stay', label: 'دخول الليل (المغرب)', time: t.maghrib },
    { icon: 'dark_mode', label: 'منتصف الليل', time: t.middle },
    { icon: 'star', label: 'الثلث الأخير (وقت التنزّل)', time: t.lastThird, highlight: true },
    { icon: 'wb_twilight', label: 'الفجر', time: t.fajr },
  ];

  return (
    <div className="flex flex-col gap-space-lg py-space-md">
      <header className="text-center">
        <h1 className="font-title text-headline-md text-primary">قيام الليل</h1>
        <p className="mt-1 font-sans text-body-md text-on-surface-variant">
          «يَنْزِلُ رَبُّنَا إلى السماء الدنيا حين يبقى ثلث الليل الآخر»
        </p>
      </header>

      <Card>
        <ul className="flex flex-col divide-y divide-outline-variant/40">
          {rows.map((r) => (
            <li
              key={r.label}
              className={`flex items-center justify-between py-space-sm ${r.highlight ? 'text-primary' : 'text-on-surface'}`}
            >
              <span className="flex items-center gap-space-2xs">
                <Icon name={r.icon} filled={r.highlight} size={20} />
                <span className={`font-sans text-body-lg ${r.highlight ? 'font-bold' : ''}`}>{r.label}</span>
              </span>
              <span className="font-sans text-body-lg tabular-nums">{fmt.time(r.time, arabic)}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Link
        to={`/read/${lastRead.surah}/${lastRead.ayah}`}
        className="flex items-center justify-center gap-space-2xs rounded-full bg-primary-container px-space-md py-space-md font-sans text-body-lg text-on-primary-container"
      >
        <Icon name="menu_book" />
        تابع وردك — سورة {getSurahMeta(lastRead.surah)?.name}
      </Link>
    </div>
  );
}
