// RTL switch. `on` slides the knob to the inline-start (right) edge.
export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-primary' : 'bg-surface-container-highest'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-surface-container-lowest shadow transition-transform ${
          checked ? '-translate-x-1' : '-translate-x-6'
        }`}
      />
    </button>
  );
}
