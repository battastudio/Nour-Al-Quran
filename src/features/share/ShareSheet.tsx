import { useEffect, useState } from 'react';
import type { Ayah } from '@/data/types';
import { Sheet } from '@/components/Sheet';
import { Icon } from '@/components/Icon';
import { Skeleton } from '@/components/Skeleton';
import { toast } from '@/components/Toast';
import { useNum } from '@/store/settings';
import { renderAyahCard, shareAyahImage } from './shareCard';

export function ShareSheet({
  ayah,
  surahName,
  onClose,
}: {
  ayah: Ayah | null;
  surahName: string;
  onClose: () => void;
}) {
  const num = useNum();
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  const ref = ayah ? `${surahName}: ${num(ayah.a)}` : '';

  // Render the card to a PNG when the sheet opens; revoke the preview URL on cleanup.
  // `ref` is a primitive string so re-running on a numerals change is safe (no loop).
  useEffect(() => {
    if (!ayah) return;
    let alive = true;
    let objectUrl: string | null = null;
    setBlob(null);
    setUrl(null);
    renderAyahCard(ayah.t, ref).then((b) => {
      if (!alive) return;
      objectUrl = URL.createObjectURL(b);
      setBlob(b);
      setUrl(objectUrl);
    });
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [ayah, ref]);

  const onShare = () => {
    if (blob && ayah) void shareAyahImage(blob, `${ayah.t} — ${ref}`);
  };

  const onCopy = () => {
    if (!ayah) return;
    void navigator.clipboard.writeText(`${ayah.t} — ${ref}`).then(() => toast('تم نسخ النص'));
  };

  const onDownload = () => {
    if (!blob) return;
    const u = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = u;
    a.download = 'ayah.png';
    a.click();
    URL.revokeObjectURL(u);
  };

  return (
    <Sheet open={!!ayah} onClose={onClose} title={ayah ? `مشاركة · ${ref}` : ''}>
      {ayah && (
        <div className="flex flex-col gap-space-md">
          {url ? (
            <img
              src={url}
              alt={`بطاقة ${ref}`}
              className="mx-auto aspect-square w-full max-w-xs rounded-xl"
            />
          ) : (
            <Skeleton className="mx-auto aspect-square w-full max-w-xs" />
          )}

          <button
            onClick={onShare}
            disabled={!blob}
            className="flex w-full items-center justify-center gap-space-2xs rounded-full bg-primary px-space-md py-space-md font-sans text-body-lg text-on-primary disabled:opacity-50"
          >
            <Icon name="ios_share" />
            مشاركة كصورة
          </button>

          <div className="flex gap-space-sm">
            <button
              onClick={onCopy}
              className="flex flex-1 items-center justify-center gap-space-2xs rounded-full bg-surface-container-highest px-space-md py-space-sm font-sans text-label-md text-on-surface"
            >
              <Icon name="content_copy" size={20} />
              نسخ النص
            </button>
            <button
              onClick={onDownload}
              disabled={!blob}
              className="flex flex-1 items-center justify-center gap-space-2xs rounded-full bg-surface-container-highest px-space-md py-space-sm font-sans text-label-md text-on-surface disabled:opacity-50"
            >
              <Icon name="download" size={20} />
              تنزيل
            </button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
