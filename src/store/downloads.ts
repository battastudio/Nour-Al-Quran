import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';

// UI convenience cache of completed downloads. Source of truth is Cache Storage
// (see features/downloads/download.ts); this just persists the checkmarks so the
// list renders instantly without probing every surah on mount.
interface DownloadsState {
  done: Record<string, boolean>; // key: `${reciter}:${surah}`
  markDone: (key: string) => void;
  unmarkDone: (key: string) => void;
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

export const useDownloads = create<DownloadsState>()(
  persist(
    (set, getState) => ({
      done: {},
      markDone: (key) => set({ done: { ...getState().done, [key]: true } }),
      unmarkDone: (key) => {
        const done = { ...getState().done };
        delete done[key];
        set({ done });
      },
    }),
    { name: 'nour-downloads', storage: createJSONStorage(() => idbStorage) },
  ),
);
