import { Icon } from './Icon';

export function Chip({
  label,
  icon,
  selected = false,
  onClick,
}: {
  label: string;
  icon?: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-space-2xs rounded-full border px-space-sm py-1 font-sans text-label-md transition-colors ${
        selected
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-outline-variant text-on-surface-variant'
      }`}
    >
      {icon && <Icon name={icon} size={16} />}
      {label}
    </button>
  );
}
