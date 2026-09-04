import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { Card } from '@/components/Card';
import { toast } from '@/components/Toast';
import { useLocation, PRAYER_LABELS, type CalcMethod, type PrayerKey } from '@/store/location';
import { useSettings } from '@/store/settings';
import { dayTimes, orderedTimes } from './times';
import { generatePrayerICS, downloadICS } from '@/notifications/ics';
import { hijriDate } from '@/lib/hijri';
import { fmt } from '@/lib/fmt';

const METHOD_LABELS: Record<CalcMethod, string> = {
  UmmAlQura: 'أم القرى',
  MuslimWorldLeague: 'رابطة العالم الإسلامي',
  Egyptian: 'الهيئة المصرية',
  Karachi: 'كراتشي',
  Dubai: 'دبي',
  Qatar: 'قطر',
  Kuwait: 'الكويت',
  Singapore: 'سنغافورة',
  Turkey: 'تركيا',
  Tehran: 'طهران',
  NorthAmerica: 'أمريكا الشمالية',
  MoonsightingCommittee: 'لجنة رؤية الهلال',
};

export function Prayer() {
  const loc = useLocation();
  const arabic = useSettings((s) => s.numerals === 'arabic');
  const [locating, setLocating] = useState(false);

  const detect = () => {
    if (!navigator.geolocation) {
      toast('تحديد الموقع غير متاح');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        loc.setLocation(pos.coords.latitude, pos.coords.longitude, 'موقعي');
        setLocating(false);
        toast('تم تحديد الموقع');
      },
      () => {
        setLocating(false);
        toast('تعذّر تحديد الموقع');
      },
    );
  };

  if (loc.lat == null || loc.lng == null) {
    return (
      <div className="flex flex-col items-center gap-space-md py-space-2xl text-center">
        <Icon name="location_on" size={48} className="text-primary" />
        <h2 className="font-sans text-headline-md text-on-surface">حدّد موقعك لعرض المواقيت</h2>
        <p className="max-w-xs font-sans text-body-md text-on-surface-variant">
          نحسب المواقيت على جهازك دون إرسال موقعك لأي خادم.
        </p>
        <button
          onClick={detect}
          disabled={locating}
          className="rounded-full bg-primary px-space-xl py-space-sm font-sans text-body-lg text-on-primary disabled:opacity-60"
        >
          {locating ? 'جارٍ التحديد…' : 'تحديد موقعي'}
        </button>
      </div>
    );
  }

  const now = new Date();
  const times = orderedTimes(dayTimes(now, loc.lat, loc.lng, loc.method, loc.madhab));
  const nextIdx = times.findIndex((t) => t.time.getTime() > now.getTime());

  return (
    <div className="flex flex-col gap-space-lg py-space-md">
      <header className="text-center">
        <p className="font-sans text-body-md text-on-surface-variant">{hijriDate()}</p>
        <p className="mt-1 font-sans text-label-md text-primary">{loc.city || 'موقعي'}</p>
      </header>

      <Card>
        <ul className="flex flex-col divide-y divide-outline-variant/40">
          {times.map((t, i) => {
            const isNext = i === nextIdx;
            const label = t.key === 'sunrise' ? 'الشروق' : PRAYER_LABELS[t.key as PrayerKey];
            return (
              <li
                key={t.key}
                className={`flex items-center justify-between py-space-sm ${isNext ? 'text-primary' : 'text-on-surface'}`}
              >
                <span className={`font-sans text-body-lg ${isNext ? 'font-bold' : ''}`}>{label}</span>
                <span className="font-sans text-body-lg tabular-nums">{fmt.time(t.time, arabic)}</span>
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="grid grid-cols-2 gap-space-sm">
        <Link to="/prayer/qibla" className="flex items-center justify-center gap-space-2xs rounded-xl bg-surface-container-low p-space-md text-on-surface active:bg-surface-container">
          <Icon name="explore" className="text-primary" />
          <span className="font-sans text-body-md">القبلة</span>
        </Link>
        <Link to="/settings/notifications" className="flex items-center justify-center gap-space-2xs rounded-xl bg-surface-container-low p-space-md text-on-surface active:bg-surface-container">
          <Icon name="notifications" className="text-primary" />
          <span className="font-sans text-body-md">التنبيهات</span>
        </Link>
      </div>

      <div className="flex flex-col gap-space-sm">
        <label className="font-sans text-label-md text-on-surface-variant">طريقة الحساب</label>
        <select
          value={loc.method}
          onChange={(e) => loc.setMethod(e.target.value as CalcMethod)}
          className="w-full rounded-lg bg-surface-container px-space-md py-space-sm font-sans text-body-md text-on-surface"
        >
          {(Object.keys(METHOD_LABELS) as CalcMethod[]).map((m) => (
            <option key={m} value={m}>
              {METHOD_LABELS[m]}
            </option>
          ))}
        </select>

        <div className="flex items-center justify-between rounded-lg bg-surface-container px-space-md py-space-sm">
          <span className="font-sans text-body-md text-on-surface">مذهب العصر</span>
          <div className="flex gap-space-2xs">
            {(['shafi', 'hanafi'] as const).map((m) => (
              <button
                key={m}
                onClick={() => loc.setMadhab(m)}
                className={`rounded-full px-space-md py-1 font-sans text-label-md ${
                  loc.madhab === m ? 'bg-primary text-on-primary' : 'text-on-surface-variant'
                }`}
              >
                {m === 'shafi' ? 'الجمهور' : 'الحنفي'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={() => {
          const ics = generatePrayerICS({
            lat: loc.lat!,
            lng: loc.lng!,
            method: loc.method,
            madhab: loc.madhab,
            enabledPrayers: loc.enabledPrayers,
            wirdTime: loc.wirdTime,
          });
          downloadICS(ics);
          toast('تم إنشاء ملف التقويم');
        }}
        className="flex items-center justify-center gap-space-2xs rounded-full border border-primary px-space-md py-space-sm font-sans text-body-md text-primary"
      >
        <Icon name="calendar_add_on" size={20} />
        أضف المواقيت إلى التقويم
      </button>
    </div>
  );
}
