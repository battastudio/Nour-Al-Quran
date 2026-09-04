export function Card({
  children,
  className = '',
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`block w-full rounded-xl bg-surface-container-low p-space-md text-right ${
        onClick ? 'transition-transform active:scale-[0.99]' : ''
      } ${className}`}
    >
      {children}
    </Tag>
  );
}
