// Initials avatar. We NEVER render fabricated photos of real reciters/scholars —
// this is the honest stand-in used everywhere a person is shown.
const COLORS = [
  'bg-primary text-on-primary',
  'bg-primary-container text-on-primary-container',
  'bg-secondary-container text-on-secondary-container',
  'bg-tertiary-container text-on-tertiary-container',
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '؟';
  if (parts.length === 1) return parts[0].slice(0, 2);
  return parts[0][0] + parts[1][0];
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const color = COLORS[hash(name) % COLORS.length];
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-sans font-semibold ${color}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-label={name}
    >
      {initials(name)}
    </span>
  );
}
