import { useNavigate } from 'react-router-dom';
import { Icon } from './Icon';

// Fixed glass header (64px). Two variants:
//  - default: brand (right, RTL-leading) + optional centre title + avatar (left)
//  - back:    back-arrow + compact title (used by ImmersiveLayout)
export function Header({
  title,
  variant = 'default',
  onBack,
}: {
  title?: string;
  variant?: 'default' | 'back';
  onBack?: () => void;
}) {
  const navigate = useNavigate();
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-outline-variant/40 bg-surface/85 backdrop-blur-xl pt-safe">
      <div className="mx-auto flex h-16 max-w-max-content-width items-center justify-between px-gutter-mobile">
        {variant === 'back' ? (
          <button
            type="button"
            aria-label="رجوع"
            onClick={() => (onBack ? onBack() : navigate(-1))}
            className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface hover:bg-surface-container"
          >
            {/* RTL: "forward" arrow points right = back */}
            <Icon name="arrow_forward" />
          </button>
        ) : (
          <div className="flex items-center gap-space-xs">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-on-primary">
              <Icon name="menu_book" size={20} />
            </div>
            <span className="font-title text-headline-sm text-on-surface">نور القرآن</span>
          </div>
        )}

        {title && (
          <h1 className="pointer-events-none absolute inset-x-0 mx-auto w-fit font-sans text-headline-sm text-on-surface">
            {title}
          </h1>
        )}

        {variant === 'default' ? (
          <button
            type="button"
            aria-label="حسابي"
            onClick={() => navigate('/settings')}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-on-primary"
          >
            <Icon name="person" size={20} />
          </button>
        ) : (
          <div className="h-10 w-10" />
        )}
      </div>
    </header>
  );
}
