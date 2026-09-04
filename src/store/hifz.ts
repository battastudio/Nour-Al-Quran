import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import { initCard, review, isDue, type SM2, type Grade } from '@/features/hifz/sm2';
import { ayahKey } from './library';

interface HifzState {
  cards: Record<string, SM2>; // key "s:a"
  streak: number; // «الاستمرار» — consecutive days reviewed
  lastReviewDay: string; // YYYY-MM-DD
  addRange: (s: number, from: number, to: number) => void;
  gradeCard: (key: string, grade: Grade) => void;
  removeCard: (key: string) => void;
  dueKeys: (now?: number) => string[];
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
const yesterday = () => new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

export const useHifz = create<HifzState>()(
  persist(
    (set, get) => ({
      cards: {},
      streak: 0,
      lastReviewDay: '',
      addRange: (s, from, to) =>
        set((st) => {
          const cards = { ...st.cards };
          const now = Date.now();
          for (let a = from; a <= to; a++) {
            const k = ayahKey(s, a);
            if (!cards[k]) cards[k] = initCard(now);
          }
          return { cards };
        }),
      gradeCard: (key, grade) =>
        set((st) => {
          const card = st.cards[key];
          if (!card) return st;
          const cards = { ...st.cards, [key]: review(card, grade) };
          // streak bookkeeping
          const d = today();
          let { streak, lastReviewDay } = st;
          if (lastReviewDay !== d) {
            streak = lastReviewDay === yesterday() ? streak + 1 : 1;
            lastReviewDay = d;
          }
          return { cards, streak, lastReviewDay };
        }),
      removeCard: (key) =>
        set((st) => {
          const cards = { ...st.cards };
          delete cards[key];
          return { cards };
        }),
      dueKeys: (now = Date.now()) =>
        Object.entries(get().cards)
          .filter(([, c]) => isDue(c, now))
          .sort((a, b) => a[1].due - b[1].due)
          .map(([k]) => k),
    }),
    { name: 'nour-hifz', storage: createJSONStorage(() => idbStorage) },
  ),
);
