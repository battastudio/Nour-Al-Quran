// Pill segmented control. Generic over the option value.
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = '',
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={`inline-flex rounded-full bg-surface-container p-1 ${className}`}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(o.value)}
            className={`rounded-full px-space-md py-1.5 font-sans text-label-md transition-colors ${
              active ? 'bg-primary text-on-primary' : 'text-on-surface-variant'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
