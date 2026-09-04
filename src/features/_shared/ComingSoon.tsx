import { Icon } from '@/components/Icon';

// Honest placeholder for screens scheduled in a later phase.
export function ComingSoon({ title, note = 'قريباً بإذن الله' }: { title: string; note?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-space-sm py-space-2xl text-center text-on-surface-variant">
      <Icon name="hourglass_empty" size={40} />
      <h2 className="font-sans text-headline-md text-on-surface">{title}</h2>
      <p className="font-sans text-body-md">{note}</p>
    </div>
  );
}
