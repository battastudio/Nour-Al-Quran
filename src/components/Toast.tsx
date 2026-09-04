import { create } from 'zustand';
import { AnimatePresence, motion } from 'framer-motion';

interface ToastItem {
  id: number;
  msg: string;
}
interface ToastState {
  items: ToastItem[];
  push: (msg: string) => void;
  remove: (id: number) => void;
}

let seq = 1;
export const useToast = create<ToastState>((set) => ({
  items: [],
  push: (msg) => {
    const id = seq++;
    set((s) => ({ items: [...s.items, { id, msg }] }));
    setTimeout(() => set((s) => ({ items: s.items.filter((t) => t.id !== id) })), 3000);
  },
  remove: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}));

/** Convenience: `toast('تم الحفظ')` from anywhere. */
export const toast = (msg: string) => useToast.getState().push(msg);

export function ToastHost() {
  const items = useToast((s) => s.items);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] mx-auto flex max-w-max-content-width flex-col items-center gap-space-2xs px-gutter-mobile">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="pointer-events-auto rounded-full bg-inverse-surface px-space-md py-space-xs font-sans text-body-md text-inverse-on-surface shadow-lg"
          >
            {t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
