// RTL-aware linear progress. Fill grows from the inline-start edge (right in RTL)
// via a logical flex row, so no manual left/right juggling.
export function ProgressBar({
  value,
  max = 1,
  className = '',
  label,
}: {
  value: number;
  max?: number;
  className?: string;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(1, value / max)) * 100;
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemax={max}
      aria-label={label}
      className={`h-2 w-full overflow-hidden rounded-full bg-surface-container-highest ${className}`}
    >
      <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${pct}%` }} />
    </div>
  );
}
