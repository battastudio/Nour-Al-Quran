import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';

// Bottom sheet: drag to dismiss, two snap heights (45% / 88%), Escape + backdrop
// close, basic focus trap (focus in on open, Tab stays inside, restore on close).
export function Sheet({
  open,
  onClose,
  children,
  title,
  snap = 'auto',
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  snap?: 'low' | 'high' | 'auto';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement;
    const el = ref.current;
    el?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab' && el) {
        const items = el.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])',
        );
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      restoreRef.current?.focus?.();
    };
  }, [open, onClose]);

  const height = snap === 'high' ? '88dvh' : snap === 'low' ? '45dvh' : 'auto';

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 500) onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-inverse-surface/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] max-w-max-content-width flex-col rounded-t-xl bg-surface-container-low pb-safe outline-none"
            style={{ height }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={onDragEnd}
          >
            <div className="flex justify-center pt-space-sm">
              <span className="h-1.5 w-10 rounded-full bg-outline-variant" />
            </div>
            {title && (
              <h2 className="px-gutter-mobile pb-space-xs pt-space-sm font-sans text-headline-sm text-on-surface">
                {title}
              </h2>
            )}
            <div className="no-scrollbar flex-1 overflow-y-auto px-gutter-mobile pb-space-lg">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
