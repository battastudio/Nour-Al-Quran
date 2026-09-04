import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';

// Per-day activity tally for the stats heatmap (self-progress only — never ranked).
interface ActivityState {
  days: Record<string, number>; // "YYYY-MM-DD" → interaction count
  bump: (n?: number) => void;
}

const idbStorage = {
  getItem: async (name: string): Promise<string | null> => (await idbGet(name)) ?? null,
  setItem: async (name: string, value: string): Promise<void> => {
    await idbSet(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await idbDel(name);
  },
};

const today = () => new Date().toISOString().slice(0, 10);

export const useActivity = create<ActivityState>()(
  persist(
    (set) => ({
      days: {},
      bump: (n = 1) =>
        set((s) => {
          const d = today();
          return { days: { ...s.days, [d]: (s.days[d] ?? 0) + n } };
        }),
    }),
    { name: 'nour-activity', storage: createJSONStorage(() => idbStorage) },
  ),
);

/** Fire-and-forget activity log (safe to call from effects/handlers). */
export const logActivity = (n = 1) => useActivity.getState().bump(n);
