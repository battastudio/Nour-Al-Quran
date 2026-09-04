// Renders ayah text with optional tajwīd colour spans WITHOUT ever changing a
// character. Colour comes only from a class per range; the visible text is always
// text.slice(a,b) segments that concatenate back to the exact original string.
// Real ranges come from QUL tajwīd-tagged data (loaded on demand). No ranges → the
// text renders as a single node.

export interface TajweedRange {
  start: number; // inclusive code-unit index
  end: number; // exclusive
  rule: string; // e.g. 'ghunnah' | 'madd' | 'qalqalah' — maps to a colour class
}

export interface Segment {
  text: string;
  rule?: string;
}

// CSS colour per rule (kept minimal; extend when real tajwīd data ships).
const RULE_CLASS: Record<string, string> = {
  ghunnah: 'text-primary',
  madd: 'text-secondary',
  qalqalah: 'text-error',
  ikhfa: 'text-tertiary',
  idgham: 'text-primary-container',
};

/**
 * Partition `text` into contiguous, gap-free, non-overlapping segments covering
 * [0, text.length). Guarantees `segments.map(s => s.text).join('') === text`.
 */
export function splitByRanges(text: string, ranges: TajweedRange[]): Segment[] {
  if (!ranges.length) return [{ text }];
  const sorted = [...ranges]
    .filter((r) => r.start < r.end && r.start >= 0 && r.end <= text.length)
    .sort((a, b) => a.start - b.start);

  const out: Segment[] = [];
  let cursor = 0;
  for (const r of sorted) {
    if (r.start < cursor) continue; // skip overlaps — never drop/duplicate text
    if (r.start > cursor) out.push({ text: text.slice(cursor, r.start) });
    out.push({ text: text.slice(r.start, r.end), rule: r.rule });
    cursor = r.end;
  }
  if (cursor < text.length) out.push({ text: text.slice(cursor) });
  return out;
}

export function Tajweed({ text, ranges = [] }: { text: string; ranges?: TajweedRange[] }) {
  const segments = splitByRanges(text, ranges);
  return (
    <>
      {segments.map((seg, i) =>
        seg.rule ? (
          <span key={i} className={RULE_CLASS[seg.rule] ?? ''}>
            {seg.text}
          </span>
        ) : (
          seg.text
        ),
      )}
    </>
  );
}
