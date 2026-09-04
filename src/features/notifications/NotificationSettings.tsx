import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { Card } from '@/components/Card';
import { Toggle } from '@/components/Toggle';
import { toast } from '@/components/Toast';
import { useLocation, PRAYER_LABELS, type PrayerKey } from '@/store/location';
import { useSettings } from '@/store/settings';
import { computeSchedule, type ScheduleOptions } from '@/notifications/engine';
import { isNative, reschedule, ensurePermission } from '@/notifications/native';
import { canWebPush, subscribeWebPush, isStandalone } from '@/notifications/webpush';
import { generatePrayerICS, downloadICS } from '@/notifications/ics';
import { fmt } from '@/lib/fmt';

export function NotificationSettings() {
  const loc = useLocation();
  const arabic = useSettings((s) => s.numerals === 'arabic');
  const [busy, setBusy] = useState(false);

  const opts: ScheduleOptions | null = useMemo(
    () =>
      loc.lat == null || loc.lng == null
        ? null
        : {
            lat: loc.lat,
            lng: loc.lng,
            method: loc.method,
            madhab: loc.madhab,
            enabledPrayers: loc.enabledPrayers,
            wirdTime: loc.wirdTime,
            fridayKahf: loc.fridayKahf,
            city: loc.city,
          },
    [loc],
  );

  const preview = useMemo(() => (opts ? computeSchedule(opts, 7).slice(0, 8) : []), [opts]);

  if (!opts) {
    return (
      <div className="flex flex-col items-center gap-space-md py-space-2xl text-center">
        <Icon name="notifications_off" size={48} className="text-on-surface-variant" />
        <p className="font-sans text-body-lg text-on-surface">حدّد موقعك أولاً لتفعيل تنبيهات الأذان.</p>
        <Link to="/prayer" className="rounded-full bg-primary px-space-xl py-space-sm font-sans text-body-lg text-on-primary">
          شاشة المواقيت
        </Link>
      </div>
    );
  }

  const applyNative = async () => {
    setBusy(true);
    const ok = await ensurePermission();
    if (ok) {
      await reschedule(opts);
      toast('تم جدولة التنبيهات لسبعة أيام');
    } else {
      toast('لم يُمنح إذن التنبيهات');
    }
    setBusy(false);
  };

  const applyWeb = async () => {
    setBusy(true);
    const ok = await subscribeWebPush(opts);
    toast(ok ? 'تم تفعيل الإشعارات' : 'تعذّر التفعيل الآن');
    setBusy(false);
  };

  return (
    <div className="flex flex-col gap-space-lg py-space-md">
      {/* Prayer toggles */}
      <section>
        <h2 className="mb-space-sm font-sans text-headline-sm text-on-surface">صلوات التنبيه</h2>
        <Card>
          <ul className="flex flex-col divide-y divide-outline-variant/40">
            {(Object.keys(PRAYER_LABELS) as PrayerKey[]).map((p) => (
              <li key={p} className="flex items-center justify-between py-space-sm">
                <span className="font-sans text-body-lg text-on-surface">{PRAYER_LABELS[p]}</span>
                <Toggle
                  checked={loc.enabledPrayers[p]}
                  onChange={(v) => loc.togglePrayer(p, v)}
                  label={PRAYER_LABELS[p]}
                />
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* Wird + Kahf */}
      <section className="flex flex-col gap-space-sm">
        <div className="flex items-center justify-between rounded-xl bg-surface-container-low px-space-md py-space-md">
          <span className="font-sans text-body-lg text-on-surface">تذكير الورد اليومي</span>
          <input
            type="time"
            value={loc.wirdTime ?? ''}
            onChange={(e) => loc.setWirdTime(e.target.value || null)}
            className="rounded-lg bg-surface-container px-space-sm py-1 font-sans text-body-md text-on-surface"
          />
        </div>
        <div className="flex items-center justify-between rounded-xl bg-surface-container-low px-space-md py-space-md">
          <span className="font-sans text-body-lg text-on-surface">تذكير سورة الكهف (الجمعة)</span>
          <Toggle checked={loc.fridayKahf} onChange={loc.setFridayKahf} label="سورة الكهف" />
        </div>
      </section>

      {/* Delivery method */}
      <section className="flex flex-col gap-space-sm">
        <h2 className="font-sans text-headline-sm text-on-surface">طريقة التوصيل</h2>
        {isNative() && (
          <button onClick={applyNative} disabled={busy} className="rounded-full bg-primary px-space-md py-space-sm font-sans text-body-lg text-on-primary disabled:opacity-60">
            تفعيل تنبيهات الأذان
          </button>
        )}
        {!isNative() && canWebPush() && (
          <button onClick={applyWeb} disabled={busy} className="rounded-full bg-primary px-space-md py-space-sm font-sans text-body-lg text-on-primary disabled:opacity-60">
            تفعيل الإشعارات (للتطبيق المثبّت)
          </button>
        )}
        {!isNative() && !canWebPush() && !isStandalone() && (
          <p className="rounded-xl bg-surface-container px-space-md py-space-sm font-sans text-body-md text-on-surface-variant">
            لتلقّي إشعارات الأذان على iPhone، أضف التطبيق إلى الشاشة الرئيسية ثم فعّل الإشعارات، أو استخدم ملف التقويم أدناه.
          </p>
        )}
        <button
          onClick={() => {
            downloadICS(generatePrayerICS({ ...opts }));
            toast('تم إنشاء ملف التقويم');
          }}
          className="flex items-center justify-center gap-space-2xs rounded-full border border-primary px-space-md py-space-sm font-sans text-body-md text-primary"
        >
          <Icon name="calendar_add_on" size={20} />
          أضف المواقيت إلى التقويم (.ics)
        </button>
      </section>

      {/* Preview */}
      <section>
        <h2 className="mb-space-sm font-sans text-headline-sm text-on-surface">التنبيهات القادمة</h2>
        <Card>
          <ul className="flex flex-col divide-y divide-outline-variant/40">
            {preview.map((n) => (
              <li key={n.id} className="flex items-center justify-between py-space-xs">
                <span className="font-sans text-body-md text-on-surface">{n.title}</span>
                <span className="font-sans text-label-md text-on-surface-variant">
                  {n.at.toLocaleDateString('ar-EG', { weekday: 'short' })} {fmt.time(n.at, arabic)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}
