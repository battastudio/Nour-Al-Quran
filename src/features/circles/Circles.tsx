import { Icon } from '@/components/Icon';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';

// Honest "coming soon" for the circles feature. No backend yet — no fake data, no fake login.
const FEATURES = [
  {
    icon: 'record_voice_over',
    title: 'حلقة مع معلّم',
    line: 'يراجع المعلّم تسميعك ويصحّح تلاوتك.',
  },
  {
    icon: 'menu_book',
    title: 'وردك الجماعي',
    line: 'ختمة جماعية يتشارك فيها أعضاء الحلقة.',
  },
  {
    icon: 'lock',
    title: 'تقدّمك يخصّك',
    line: 'يرى كل عضو تقدّمه فقط — لا لوحات شرف ولا ترتيب.',
  },
];

export function Circles() {
  return (
    <div className="flex flex-col gap-space-lg py-space-md">
      <header className="flex flex-col items-center gap-space-2xs pt-space-lg text-center">
        <Icon name="groups" size={44} className="text-primary" />
        <h1 className="font-title text-headline-md text-on-surface">المقارئ والحلقات</h1>
        <p className="font-sans text-body-md text-on-surface-variant">
          حلقات تحفيظ مع مراجعة المعلّم — قريباً بإذن الله
        </p>
      </header>

      <section className="flex flex-col gap-space-md">
        {FEATURES.map((f) => (
          <Card key={f.title}>
            <div className="flex items-start gap-space-md">
              <Icon name={f.icon} className="text-primary" />
              <div className="flex flex-col gap-space-2xs">
                <h2 className="font-sans text-body-lg text-on-surface">{f.title}</h2>
                <p className="font-sans text-body-md text-on-surface-variant">{f.line}</p>
              </div>
            </div>
          </Card>
        ))}
      </section>

      <div className="flex items-center justify-center gap-space-sm">
        <button
          type="button"
          disabled
          className="rounded-full bg-surface-container px-space-lg py-space-sm font-sans text-label-md text-on-surface-variant opacity-60"
        >
          إنشاء حلقة
        </button>
        <Chip label="قريباً" />
      </div>

      <p className="text-center font-sans text-label-md text-on-surface-variant">
        تتطلب هذه الميزة اتصالاً بالخادم (اختياري) وستبقى مجانية.
      </p>
    </div>
  );
}
