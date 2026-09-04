import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';

export interface ReadPosition {
  surah: number;
  ayah: number;
}

interface ProgressState {
  lastRead: ReadPosition;
  wirdTarget: number; // ayahs per day
  wirdDate: string; // YYYY-MM-DD of the current count
  wirdCount: number; // ayahs read today toward the wird
  setLastRead: (p: ReadPosition) => void;
  setWirdTarget: (n: number) => void;
  addWird: (ayahs: number) => void;
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

const today = (): string => new Date().toISOString().slice(0, 10);

export const useProgress = create<ProgressState>()(
  persist(
    (set, getState) => ({
      lastRead: { surah: 1, ayah: 1 },
      wirdTarget: 20,
      wirdDate: today(),
      wirdCount: 0,
      setLastRead: (lastRead) => set({ lastRead }),
      setWirdTarget: (wirdTarget) => set({ wirdTarget }),
      addWird: (ayahs) => {
        const d = today();
        const s = getState();
        set(s.wirdDate === d ? { wirdCount: s.wirdCount + ayahs } : { wirdDate: d, wirdCount: ayahs });
      },
    }),
    { name: 'nour-progress', storage: createJSONStorage(() => idbStorage) },
  ),
);
