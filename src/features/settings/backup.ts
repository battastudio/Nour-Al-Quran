import { get as idbGet, set as idbSet } from 'idb-keyval';

// Phase-1 sync = "your data stays on your device" + manual JSON export/import.
// These keys are the persisted zustand stores.
const KEYS = [
  'nour-settings',
  'nour-progress',
  'nour-location',
  'nour-library',
  'nour-hifz',
  'nour-khatmah',
  'nour-activity',
  'nour-downloads',
  'nour-profile',
];

export async function exportData(): Promise<void> {
  const bundle: Record<string, unknown> = { app: 'nour-alquran', v: 1, exported: new Date().toISOString() };
  for (const k of KEYS) bundle[k] = (await idbGet<string>(k)) ?? null;

  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nour-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importData(file: File): Promise<void> {
  const bundle = JSON.parse(await file.text()) as Record<string, string | null>;
  for (const k of KEYS) {
    if (typeof bundle[k] === 'string') await idbSet(k, bundle[k]);
  }
  // Reload so every persisted store rehydrates from the imported values.
  location.reload();
}
