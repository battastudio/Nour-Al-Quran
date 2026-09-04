import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import { fmt } from '@/lib/fmt';

export type Theme = 'day' | 'night' | 'emerald' | 'royal';
export type Numerals = 'arabic' | 'western';
export type ReaderMode = 'scroll' | 'mushaf' | 'focus';

interface SettingsState {
  theme: Theme;
  numerals: Numerals;
  fontScale: number; // ayah text scale, 0.8–1.6
  tajweed: boolean;
  readerMode: ReaderMode;
  reciter: string; // everyayah subfolder id
  setTheme: (t: Theme) => void;
  setNumerals: (n: Numerals) => void;
  setFontScale: (s: number) => void;
  setTajweed: (v: boolean) => void;
  setReaderMode: (m: ReaderMode) => void;
  setReciter: (r: string) => void;
}

// zustand persist over IndexedDB via idb-keyval (keeps settings off localStorage).
const idbStorage = {
  getItem: async (name: string): Promise<string | null> => (await idbGet(name)) ?? null,
  setItem: async (name: string, value: string): Promise<void> => {
    await idbSet(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await idbDel(name);
  },
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'day',
      numerals: 'arabic',
      fontScale: 1,
      tajweed: false,
      readerMode: 'scroll',
      reciter: 'Alafasy_128kbps',
      setTheme: (theme) => set({ theme }),
      setNumerals: (numerals) => set({ numerals }),
      setFontScale: (fontScale) => set({ fontScale }),
      setTajweed: (tajweed) => set({ tajweed }),
      setReaderMode: (readerMode) => set({ readerMode }),
      setReciter: (reciter) => set({ reciter }),
    }),
    { name: 'nour-settings', storage: createJSONStorage(() => idbStorage) },
  ),
);

/** Reactive numeral formatter — re-renders on the Arabic/Western toggle. */
export function useNum(): (v: number) => string {
  const arabic = useSettings((s) => s.numerals === 'arabic');
  return (v: number) => fmt.n(v, arabic);
}

/** Reflect the chosen theme onto <html data-theme>. Call once on mount. */
export function bindThemeToDocument(): () => void {
  const apply = (t: Theme) => {
    document.documentElement.dataset.theme = t;
  };
  apply(useSettings.getState().theme);
  return useSettings.subscribe((s) => apply(s.theme));
}
