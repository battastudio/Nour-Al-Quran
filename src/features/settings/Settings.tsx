import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { Card } from '@/components/Card';
import { toast } from '@/components/Toast';
import { exportData, importData } from './backup';

const LINKS = [
  { to: '/settings/reading', icon: 'text_fields', label: 'الخط والعرض والسمات' },
  { to: '/settings/notifications', icon: 'notifications', label: 'التنبيهات والأذان' },
  { to: '/downloads', icon: 'download', label: 'التنزيلات دون اتصال' },
];

export function Settings() {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-space-lg py-space-md">
      <nav className="flex flex-col gap-space-2xs">
        {LINKS.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="flex items-center gap-space-md rounded-xl bg-surface-container-low px-space-md py-space-md active:bg-surface-container"
          >
            <Icon name={l.icon} className="text-primary" />
            <span className="flex-1 font-sans text-body-lg text-on-surface">{l.label}</span>
            <Icon name="chevron_left" className="text-on-surface-variant" />
          </Link>
        ))}
      </nav>

      <section>
        <h2 className="mb-space-sm font-sans text-headline-sm text-on-surface">بياناتك</h2>
        <Card>
          <p className="font-sans text-body-md text-on-surface-variant">
            بياناتك محفوظة على جهازك فقط. يمكنك تصديرها كملف احتياطي أو استيرادها لاحقاً.
          </p>
          <div className="mt-space-md flex gap-space-sm">
            <button
              onClick={() => void exportData().then(() => toast('تم التصدير'))}
              className="flex-1 rounded-lg bg-primary px-space-md py-space-sm font-sans text-label-md text-on-primary"
            >
              تصدير نسخة
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex-1 rounded-lg bg-surface-container-highest px-space-md py-space-sm font-sans text-label-md text-on-surface"
            >
              استيراد
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void importData(f);
              }}
            />
          </div>
        </Card>
      </section>

      <p className="text-center font-sans text-label-sm text-on-surface-variant">
        نور القرآن — مجاني دائماً، بلا إعلانات
      </p>
    </div>
  );
}
