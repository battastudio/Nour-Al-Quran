import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';

export type CalcMethod =
  | 'MuslimWorldLeague'
  | 'UmmAlQura'
  | 'Egyptian'
  | 'Karachi'
  | 'Dubai'
  | 'Qatar'
  | 'Kuwait'
  | 'Singapore'
  | 'Turkey'
  | 'Tehran'
  | 'NorthAmerica'
  | 'MoonsightingCommittee';

export type Madhab = 'shafi' | 'hanafi';
export type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export const PRAYER_LABELS: Record<PrayerKey, string> = {
  fajr: 'الفجر',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء',
};

interface LocationState {
  lat: number | null;
  lng: number | null;
  city: string;
  method: CalcMethod;
  madhab: Madhab;
  enabledPrayers: Record<PrayerKey, boolean>;
  wirdTime: string | null; // "HH:MM" for the daily wird reminder
  fridayKahf: boolean;
  setLocation: (lat: number, lng: number, city: string) => void;
  setMethod: (m: CalcMethod) => void;
  setMadhab: (m: Madhab) => void;
  togglePrayer: (p: PrayerKey, on: boolean) => void;
  setWirdTime: (t: string | null) => void;
  setFridayKahf: (v: boolean) => void;
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

export const useLocation = create<LocationState>()(
  persist(
    (set) => ({
      lat: null,
      lng: null,
      city: '',
      method: 'UmmAlQura',
      madhab: 'shafi',
      enabledPrayers: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
      wirdTime: null,
      fridayKahf: true,
      setLocation: (lat, lng, city) => set({ lat, lng, city }),
      setMethod: (method) => set({ method }),
      setMadhab: (madhab) => set({ madhab }),
      togglePrayer: (p, on) =>
        set((s) => ({ enabledPrayers: { ...s.enabledPrayers, [p]: on } })),
      setWirdTime: (wirdTime) => set({ wirdTime }),
      setFridayKahf: (fridayKahf) => set({ fridayKahf }),
    }),
    { name: 'nour-location', storage: createJSONStorage(() => idbStorage) },
  ),
);
