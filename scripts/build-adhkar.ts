/*
 * Build the bundled adhkar dataset from the open rn0x/Adhkar-json (Hisn al-Muslim
 * derived). Text is kept verbatim; each item keeps its source reference string.
 * Run: npx tsx scripts/build-adhkar.ts   (also wired as part of `npm run data` if desired)
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = 'https://raw.githubusercontent.com/rn0x/Adhkar-json/main/adhkar.json';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src', 'data', 'adhkar.json');

interface RawItem {
  text?: string;
  count?: string | number;
  reference?: string;
  description?: string;
}
interface RawCategory {
  category?: string;
  array?: RawItem[];
}

interface Item {
  text: string;
  count: number;
  ref: string;
}
interface Category {
  category: string;
  items: Item[];
}

async function main() {
  const res = await fetch(SRC, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const raw = (await res.json()) as RawCategory[];

  const out: Category[] = raw
    .filter((c) => c.category && Array.isArray(c.array))
    .map((c) => ({
      category: c.category!,
      items: c
        .array!.filter((it) => it.text)
        .map((it) => ({
          text: it.text!, // verbatim
          count: Number(it.count) > 0 ? Number(it.count) : 1,
          ref: it.reference || it.description || '',
        })),
    }))
    .filter((c) => c.items.length > 0);

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(out));
  console.log(`Adhkar: ${out.length} categories, ${out.reduce((n, c) => n + c.items.length, 0)} items`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
