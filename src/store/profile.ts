import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';

interface ProfileState {
  name: string; // display name for share cards / greeting only — never leaves the device
  setName: (n: string) => void;
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

export const useProfile = create<ProfileState>()(
  persist(
    (set) => ({
      name: '',
      setName: (name) => set({ name }),
    }),
    { name: 'nour-profile', storage: createJSONStorage(() => idbStorage) },
  ),
);
