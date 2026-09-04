// everyayah.com folder ids. Avatars are rendered from the name (initials) — we
// never fabricate a photo of a real reciter.
export interface Reciter {
  id: string; // everyayah folder
  name: string;
}

export const RECITERS: Reciter[] = [
  { id: 'Alafasy_128kbps', name: 'مشاري العفاسي' },
  { id: 'Husary_128kbps', name: 'محمود خليل الحصري' },
  { id: 'Abdul_Basit_Murattal_192kbps', name: 'عبد الباسط عبد الصمد' },
  { id: 'Minshawy_Murattal_128kbps', name: 'محمد صديق المنشاوي' },
  { id: 'Abdurrahmaan_As-Sudais_192kbps', name: 'عبد الرحمن السديس' },
  { id: 'Ghamadi_40kbps', name: 'سعد الغامدي' },
];

export const reciterName = (id: string): string =>
  RECITERS.find((r) => r.id === id)?.name ?? id;
