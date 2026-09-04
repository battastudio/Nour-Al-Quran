import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';

export type KhatmahUnit = 'juz' | 'pages' | 'ayahs';

export interface KhatmahPlan {
  startDate: string; // YYYY-MM-DD
  days: number;
  unit: KhatmahUnit;
}

interface KhatmahState {
  plan: KhatmahPlan | null;
  completed: number[]; // completed portion indices (0-based); array so persist() serialises it cleanly
  startPlan: (days: number, unit: KhatmahUnit, start?: string) => void;
  markPortion: (index: number, done: boolean) => void;
  resetPlan: () => void;
}

// zustand persist over IndexedDB via idb-keyval — copied verbatim from src/store/progress.ts.
const idbStorage = {
  getItem: async (name: string): Promise<string | null> => (await idbGet(name)) ?? null,
  setItem: async (name: string, value: string): Promise<void> => {
    await idbSet(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await idbDel(name);
  },
};

const today = (): string => new Date().toISOString().slice(0, 10);

/** Atomic portions in a complete Quran for the chosen unit. */
export const totalPortions = (unit: KhatmahUnit): number =>
  unit === 'juz' ? 30 : unit === 'pages' ? 604 : 6236;

export const useKhatmah = create<KhatmahState>()(
  persist(
    (set, getState) => ({
      plan: null,
      completed: [],
      // start defaults to today; an explicit date lets a shared plan keep its own schedule.
      startPlan: (days, unit, start = today()) => set({ plan: { startDate: start, days, unit }, completed: [] }),
      markPortion: (index, done) => {
        const s = new Set(getState().completed);
        if (done) s.add(index);
        else s.delete(index);
        set({ completed: [...s].sort((a, b) => a - b) });
      },
      resetPlan: () => set({ plan: null, completed: [] }),
    }),
    { name: 'nour-khatmah', storage: createJSONStorage(() => idbStorage) },
  ),
);
