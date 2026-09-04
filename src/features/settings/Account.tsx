import { useRef } from 'react';
import { Icon } from '@/components/Icon';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { Avatar } from '@/components/Avatar';
import { toast } from '@/components/Toast';
import { exportData, importData } from '@/features/settings/backup';
import { useProfile } from '@/store/profile';

export function Account() {
  const fileRef = useRef<HTMLInputElement>(null);
  const name = useProfile((s) => s.name);
  const setName = useProfile((s) => s.setName);

  return (
    <div className="flex flex-col gap-space-lg py-space-md">
      {/* Honest, on-device-only statement */}
      <Card>
        <div className="flex items-start gap-space-md">
          <Icon name="devices" className="text-primary" />
          <p className="flex-1 font-sans text-body-md text-on-surface-variant">
            بياناتك محفوظة على جهازك فقط — لا حساب ولا خادم.
          </p>
        </div>
      </Card>

      {/* Display name — used only for share cards / greeting, stays on device */}
      <section>
        <h2 className="mb-space-sm font-sans text-headline-sm text-on-surface">اسمك</h2>
        <Card>
          <div className="flex items-center gap-space-md">
            <Avatar name={name || '؟'} size={48} />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="اكتب اسمك (اختياري)"
              className="flex-1 rounded-lg bg-surface-container px-space-md py-space-sm font-sans text-body-lg text-on-surface placeholder:text-on-surface-variant"
            />
          </div>
          <p className="mt-space-sm font-sans text-label-md text-on-surface-variant">
            يُستخدم للترحيب وبطاقات المشاركة فقط، ولا يُرسَل إلى أي مكان.
          </p>
        </Card>
      </section>

      {/* Manual backup — reuses the same export/import as Settings */}
      <section>
        <h2 className="mb-space-sm font-sans text-headline-sm text-on-surface">النسخ الاحتياطي</h2>
        <Card>
          <p className="font-sans text-body-md text-on-surface-variant">
            صدّر بياناتك كملف احتياطي أو استوردها على جهاز آخر.
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

      {/* Optional cloud sync — NOT available yet. Shown disabled, honestly. */}
      <section>
        <h2 className="mb-space-sm font-sans text-headline-sm text-on-surface">
          المزامنة السحابية الاختيارية
        </h2>
        <Card className="opacity-60">
          <div className="flex items-center gap-space-md">
            <Icon name="cloud_sync" className="text-on-surface-variant" />
            <span className="flex-1 font-sans text-body-lg text-on-surface">المزامنة عبر حسابك</span>
            <Chip label="قريباً" />
          </div>
          <p className="mt-space-sm font-sans text-label-md text-on-surface-variant">
            ستكون اختيارية ومشفّرة عبر حسابك (Firebase) في تحديث لاحق.
          </p>
        </Card>
      </section>
    </div>
  );
}
