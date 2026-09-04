// Material Symbols Outlined via ligatures. `name` is the symbol id, e.g. "home".
export function Icon({
  name,
  filled = false,
  className = '',
  size,
}: {
  name: string;
  filled?: boolean;
  className?: string;
  size?: number;
}) {
  return (
    <span
      aria-hidden
      className={`material-symbols-outlined ${filled ? 'filled' : ''} ${className}`}
      style={size ? { fontSize: size } : undefined}
    >
      {name}
    </span>
  );
}
