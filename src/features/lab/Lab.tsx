import { Link } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';

// Hub for the study "labs". Honest: only ships what actually works. No scoring
// claims beyond word-match (in Tasmi), no A/B waveform until it's real.
const LABS = [
  { to: '/tasmi', icon: 'mic', title: 'التسميع', desc: 'مطابقة الكلمات عبر التعرّف الصوتي على الجهاز.' },
  { to: '/lab/waqf', icon: 'menu_book', title: 'الوقف والابتداء', desc: 'تعريف بعلامات الوقف في المصحف (تعليمي).' },
  { to: '/similar/2/255', icon: 'join_inner', title: 'المتشابهات', desc: 'الآيات المتشابهة لفظاً واختبار عليها.' },
];

export function Lab() {
  return (
    <div className="flex flex-col gap-space-md py-space-md">
      <p className="font-sans text-body-md text-on-surface-variant">أدوات الدراسة والتدبّر</p>
      {LABS.map((l) => (
        <Link key={l.to} to={l.to}>
          <Card className="flex items-center gap-space-md">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
              <Icon name={l.icon} />
            </span>
            <span className="flex flex-1 flex-col">
              <span className="font-sans text-headline-sm text-on-surface">{l.title}</span>
              <span className="font-sans text-body-md text-on-surface-variant">{l.desc}</span>
            </span>
            <Icon name="chevron_left" className="text-on-surface-variant" />
          </Card>
        </Link>
      ))}

      <Card className="flex items-center justify-between opacity-70">
        <span className="flex flex-col">
          <span className="font-sans text-headline-sm text-on-surface">مقارنة القرّاء (A/B)</span>
          <span className="font-sans text-body-md text-on-surface-variant">استماع مقارن بين تلاوتين.</span>
        </span>
        <Chip label="قريباً" />
      </Card>
    </div>
  );
}
