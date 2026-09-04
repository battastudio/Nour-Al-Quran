import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';

export const ayahKey = (s: number, a: number) => `${s}:${a}`;

export interface Note {
  key: string; // "s:a"
  text: string;
  updated: number;
}
export type Highlight = 'yellow' | 'green' | 'blue' | 'pink';

interface LibraryState {
  bookmarks: string[]; // "s:a"
  notes: Record<string, Note>;
  highlights: Record<string, Highlight>;
  toggleBookmark: (s: number, a: number) => void;
  setNote: (s: number, a: number, text: string) => void;
  setHighlight: (s: number, a: number, h: Highlight | null) => void;
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

export const useLibrary = create<LibraryState>()(
  persist(
    (set) => ({
      bookmarks: [],
      notes: {},
      highlights: {},
      toggleBookmark: (s, a) =>
        set((st) => {
          const k = ayahKey(s, a);
          return {
            bookmarks: st.bookmarks.includes(k)
              ? st.bookmarks.filter((x) => x !== k)
              : [...st.bookmarks, k],
          };
        }),
      setNote: (s, a, text) =>
        set((st) => {
          const k = ayahKey(s, a);
          const notes = { ...st.notes };
          if (text.trim()) notes[k] = { key: k, text, updated: Date.now() };
          else delete notes[k];
          return { notes };
        }),
      setHighlight: (s, a, h) =>
        set((st) => {
          const k = ayahKey(s, a);
          const highlights = { ...st.highlights };
          if (h) highlights[k] = h;
          else delete highlights[k];
          return { highlights };
        }),
    }),
    { name: 'nour-library', storage: createJSONStorage(() => idbStorage) },
  ),
);
