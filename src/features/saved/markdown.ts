import { useLibrary } from '@/store/library';
import { loadSurah, getSurahMeta } from '@/data/loader';

// Build a Markdown document of the user's saved items and trigger a download.
// Blob -> anchor -> revoke idiom mirrors src/features/settings/backup.ts.
export async function exportSavedMarkdown(): Promise<void> {
  const { bookmarks, notes, highlights } = useLibrary.getState();

  // Collect every referenced surah once, then load the chunks in parallel.
  const keys = [...bookmarks, ...Object.keys(notes), ...Object.keys(highlights)];
  const surahNums = [...new Set(keys.map((k) => Number(k.split(':')[0])))];
  const files = await Promise.all(surahNums.map((n) => loadSurah(n)));
  const byNum = new Map(files.map((f) => [f.meta.n, f]));

  const text = (key: string): string => {
    const [s, a] = key.split(':').map(Number);
    return byNum.get(s)?.ayahs[a - 1]?.t ?? '';
  };
  const ref = (key: string): string => {
    const [s, a] = key.split(':').map(Number);
    return `${getSurahMeta(s)?.name ?? ''} — ${a}`;
  };

  const lines: string[] = ['# نور القرآن — محفوظاتي', ''];

  if (bookmarks.length) {
    lines.push('## العلامات', '');
    for (const k of bookmarks) lines.push(`### ${ref(k)}`, '', `> ${text(k)}`, '');
  }

  const noteList = Object.values(notes);
  if (noteList.length) {
    lines.push('## الملاحظات', '');
    for (const n of noteList)
      lines.push(`### ${ref(n.key)}`, '', `> ${text(n.key)}`, '', n.text, '');
  }

  const hlKeys = Object.keys(highlights);
  if (hlKeys.length) {
    lines.push('## التظليل', '');
    for (const k of hlKeys) lines.push(`### ${ref(k)} (${highlights[k]})`, '', `> ${text(k)}`, '');
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nour-saved-${new Date().toISOString().slice(0, 10)}.md`;
  a.click();
  URL.revokeObjectURL(url);
}
