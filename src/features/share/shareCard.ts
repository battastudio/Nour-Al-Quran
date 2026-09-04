// Ayah share card: draw one verse onto an offscreen canvas and return a PNG.
// The ayah text is drawn verbatim (byte-faithful) — only wrapped across lines,
// never normalised, trimmed, or otherwise altered.

const SIZE = 1080; // square card, good for stories/feeds
const BG = '#004333'; // app primary
const PANEL = 'rgba(255, 255, 255, 0.05)'; // subtle inner panel fill
const GOLD = '#fcce66'; // reference line + panel border
const INK = '#ffffff';
const QURAN_FONT = "'Amiri Quran', serif";

// Ensure the self-hosted Amiri Quran face is loaded before drawing, otherwise
// (font-display: swap) the canvas silently falls back to a plain serif.
async function ensureFont(): Promise<void> {
  if (!('fonts' in document)) return;
  try {
    await Promise.all([
      document.fonts.load(`64px ${QURAN_FONT}`),
      document.fonts.load(`44px ${QURAN_FONT}`),
    ]);
  } catch {
    /* fall back to serif */
  }
}

// Rounded-rect path (hand-rolled — avoids depending on ctx.roundRect typings).
function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Greedy word-wrap to fit maxWidth. Words are split on the single spaces that
// separate Uthmani words and re-joined by the same space, so no character of
// `text` is dropped or changed — the line break simply replaces one space.
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const word of words) {
    const next = cur ? `${cur} ${word}` : word;
    if (cur && ctx.measureText(next).width > maxWidth) {
      lines.push(cur);
      cur = word;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

/** Draw an elegant square share card for one ayah and return it as a PNG Blob. */
export async function renderAyahCard(ayahText: string, ref: string): Promise<Blob> {
  await ensureFont();

  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d context unavailable');

  // Background.
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Subtle rounded inner panel with a thin gold border.
  const margin = 72;
  roundRectPath(ctx, margin, margin, SIZE - 2 * margin, SIZE - 2 * margin, 48);
  ctx.fillStyle = PANEL;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = GOLD;
  ctx.stroke();

  // Shared text setup — Arabic, right-to-left, centred, serif.
  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const cx = SIZE / 2;

  const innerW = SIZE - 2 * margin;
  const textMaxWidth = innerW - 96; // padding inside the panel
  const lineGap = 1.7;
  const footerZone = 220; // space reserved for reference + footer at the bottom
  const textZone = SIZE - 2 * margin - footerZone;

  // Pick the largest font size (down to a floor) whose wrapped block fits.
  let fontSize = 66;
  let lines: string[] = [];
  for (; fontSize >= 34; fontSize -= 3) {
    ctx.font = `${fontSize}px ${QURAN_FONT}`;
    lines = wrapLines(ctx, ayahText, textMaxWidth);
    if (lines.length * fontSize * lineGap <= textZone) break;
  }

  // Draw the ayah, vertically centred in the text zone.
  ctx.font = `${fontSize}px ${QURAN_FONT}`;
  ctx.fillStyle = INK;
  const lineH = fontSize * lineGap;
  const blockTop = margin + (textZone - lines.length * lineH) / 2;
  lines.forEach((line, i) => {
    ctx.fillText(line, cx, blockTop + i * lineH + lineH / 2);
  });

  // Reference line, in gold.
  ctx.font = `44px ${QURAN_FONT}`;
  ctx.fillStyle = GOLD;
  ctx.fillText(`«${ref}»`, cx, SIZE - margin - 120);

  // Footer.
  ctx.font = `34px ${QURAN_FONT}`;
  ctx.fillStyle = INK;
  ctx.fillText('نور القرآن', cx, SIZE - margin - 56);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('canvas.toBlob returned null'))),
      'image/png',
    );
  });
}

/** Share the card via the Web Share API when possible; otherwise download it. */
export async function shareAyahImage(blob: Blob, text: string): Promise<void> {
  const file = new File([blob], 'ayah.png', { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], text });
    return;
  }
  // Fallback: download the PNG (same Blob→anchor→click→revoke as backup.ts).
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ayah.png';
  a.click();
  URL.revokeObjectURL(url);
}
