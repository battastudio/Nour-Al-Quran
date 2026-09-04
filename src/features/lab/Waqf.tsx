import { Icon } from '@/components/Icon';
import { Card } from '@/components/Card';

// Educational reference for the Uthmani waqf (stopping) marks. Text/knowledge
// only — NO recitation scoring, timing, or "AI listens" claims (see §6 honesty).
const SIGNS = [
  { sign: 'مـ', name: 'الوقف اللازم', tag: 'يلزم', desc: 'يلزم الوقف عنده خشية إيهام معنى غير مراد عند الوصل.', cls: 'bg-secondary-container text-on-secondary-container' },
  { sign: 'لا', name: 'لا تقف', tag: 'نهي', desc: 'لشدة تعلق ما بعده بما قبله لفظاً ومعنى، فلا يُبتدأ بما بعده.', cls: 'bg-surface-container-highest text-error' },
  { sign: 'ج', name: 'جواز الوقف', tag: 'جائز', desc: 'يجوز الوقف والوصل بنسبة متساوية دون ترجيح.', cls: 'bg-primary/10 text-primary' },
  { sign: 'صلى', name: 'الوصل أولى', tag: 'الوصل أرجح', desc: 'يجوز الأمران مع رجحان الوصل لتمام المعنى.', cls: 'bg-surface-container-highest text-secondary' },
  { sign: 'قلى', name: 'الوقف أولى', tag: 'الوقف أرجح', desc: 'يجوز الأمران مع رجحان الوقف لحسن السياق.', cls: 'bg-surface-container-highest text-secondary' },
  { sign: '∴ ∴', name: 'تعانق الوقف', tag: 'المراقبة', desc: 'موضعان متجاوران؛ إذا وُقف على أحدهما امتنع الوقف على الآخر.', cls: 'bg-surface-container-high text-primary' },
];

export function Waqf() {
  return (
    <div className="flex flex-col gap-space-md py-space-md">
      <Card>
        <div className="flex items-center gap-space-2xs text-primary">
          <Icon name="library_books" size={20} />
          <span className="font-sans text-label-md">فقه القراءة</span>
        </div>
        <p className="mt-space-xs font-sans text-body-md leading-relaxed text-on-surface-variant">
          علامات الضبط العثماني الدالة على الوقف أو الوصل، وُضعت لحفظ سلامة المعنى. هذه صفحة تعريفية
          للتعلّم فقط.
        </p>
      </Card>

      <div className="grid grid-cols-1 gap-space-sm sm:grid-cols-2">
        {SIGNS.map((s) => (
          <div key={s.name} className="flex items-start gap-space-sm rounded-xl bg-surface-container-low p-space-md">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg font-title text-headline-md ${s.cls}`}>
              {s.sign}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-space-2xs">
                <span className="font-sans text-headline-sm text-on-surface">{s.name}</span>
                <span className="rounded bg-surface-container-highest px-1.5 py-0.5 font-sans text-label-sm text-on-surface-variant">
                  {s.tag}
                </span>
              </div>
              <span className="mt-0.5 font-sans text-body-md text-on-surface-variant">{s.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
