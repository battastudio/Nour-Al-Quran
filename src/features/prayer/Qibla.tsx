import { useEffect, useState } from 'react';
import { Icon } from '@/components/Icon';
import { useLocation } from '@/store/location';
import { useSettings } from '@/store/settings';
import { qiblaDirection } from './times';
import { fmt } from '@/lib/fmt';

// iOS exposes an absolute compass heading; Android reports alpha (0 = north).
interface IOSOrientationEvent extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
}
type PermState = 'unknown' | 'granted' | 'denied' | 'unsupported';

export function Qibla() {
  const loc = useLocation();
  const arabic = useSettings((s) => s.numerals === 'arabic');
  const [heading, setHeading] = useState<number | null>(null);
  const [perm, setPerm] = useState<PermState>('unknown');

  const qibla = loc.lat != null && loc.lng != null ? qiblaDirection(loc.lat, loc.lng) : null;

  const start = () => {
    const anyDOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<PermissionState> };
    const attach = () => {
      const handler = (e: Event) => {
        const ev = e as IOSOrientationEvent;
        if (typeof ev.webkitCompassHeading === 'number') setHeading(ev.webkitCompassHeading);
        else if (ev.alpha != null) setHeading(360 - ev.alpha); // alpha is counter-clockwise
      };
      window.addEventListener('deviceorientationabsolute', handler);
      window.addEventListener('deviceorientation', handler);
      setPerm('granted');
    };
    if (typeof anyDOE.requestPermission === 'function') {
      anyDOE
        .requestPermission()
        .then((r) => (r === 'granted' ? attach() : setPerm('denied')))
        .catch(() => setPerm('denied'));
    } else if ('DeviceOrientationEvent' in window) {
      attach();
    } else {
      setPerm('unsupported');
    }
  };

  useEffect(() => () => setHeading(null), []);

  if (qibla == null) {
    return (
      <div className="flex flex-col items-center gap-space-md py-space-2xl text-center">
        <Icon name="explore_off" size={48} className="text-on-surface-variant" />
        <p className="font-sans text-body-lg text-on-surface">حدّد موقعك أولاً من شاشة المواقيت.</p>
      </div>
    );
  }

  // needle rotation: where qibla sits relative to the top (current heading)
  const needle = heading == null ? qibla : qibla - heading;

  return (
    <div className="flex flex-col items-center gap-space-xl py-space-xl text-center">
      <div className="relative flex h-64 w-64 items-center justify-center rounded-full border-4 border-surface-container-highest">
        <div
          className="absolute flex flex-col items-center transition-transform duration-200"
          style={{ transform: `rotate(${needle}deg)` }}
        >
          <Icon name="navigation" filled size={56} className="text-primary" />
        </div>
        <span className="absolute top-2 font-sans text-label-sm text-on-surface-variant">ش</span>
      </div>

      <div>
        <p className="font-sans text-headline-md text-on-surface">
          اتجاه القبلة {fmt.n(Math.round(qibla), arabic)}°
        </p>
        <p className="mt-1 font-sans text-body-md text-on-surface-variant">من الشمال باتجاه عقارب الساعة</p>
      </div>

      {perm !== 'granted' && (
        <button
          onClick={start}
          className="rounded-full bg-primary px-space-xl py-space-sm font-sans text-body-lg text-on-primary"
        >
          تفعيل البوصلة
        </button>
      )}
      {perm === 'denied' && (
        <p className="font-sans text-label-md text-error">تم رفض إذن البوصلة — استخدم الزاوية أعلاه يدوياً.</p>
      )}
      {perm === 'unsupported' && (
        <p className="font-sans text-label-md text-on-surface-variant">جهازك لا يدعم البوصلة — استخدم الزاوية أعلاه.</p>
      )}
    </div>
  );
}
