import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/Icon';
import { AyahText } from '@/components/AyahText';
import { Skeleton } from '@/components/Skeleton';
import { toast } from '@/components/Toast';
import { useProgress } from '@/store/progress';
import { useNum } from '@/store/settings';
import { surahMeta, getSurahMeta, loadSurah } from '@/data/loader';
import type { Ayah } from '@/data/types';
import { matchWords, type MatchResult } from './match';
import { startRecording, type Recording } from './record';
import { useWakeLock } from '@/lib/wakeLock';
import type { OutMsg } from './whisper.worker';

type ModelState = 'idle' | 'loading' | 'ready';
type Phase = 'setup' | 'recording' | 'thinking' | 'done';

export function Tasmi() {
  const num = useNum();
  const lastRead = useProgress((s) => s.lastRead);
  useWakeLock(true);

  const [surah, setSurah] = useState(lastRead.surah);
  const [ayahNum, setAyahNum] = useState(lastRead.ayah);
  const [ayah, setAyah] = useState<Ayah | null>(null);

  const [model, setModel] = useState<ModelState>('idle');
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<Phase>('setup');
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState<MatchResult | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const recRef = useRef<Recording | null>(null);

  const maxAyah = getSurahMeta(surah)?.ayahCount ?? 7;

  useEffect(() => {
    loadSurah(surah).then((f) => setAyah(f.ayahs[Math.min(ayahNum, f.ayahs.length) - 1] ?? f.ayahs[0]));
  }, [surah, ayahNum]);

  useEffect(() => {
    const w = new Worker(new URL('./whisper.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = w;
    w.onmessage = (e: MessageEvent<OutMsg>) => {
      const m = e.data;
      if (m.type === 'progress') setProgress(m.pct);
      else if (m.type === 'ready') setModel('ready');
      else if (m.type === 'result') {
        setTranscript(m.text);
        setPhase('done');
      } else if (m.type === 'error') {
        toast('تعذّر التعرّف الصوتي');
        setPhase('setup');
      }
    };
    return () => w.terminate();
  }, []);

  // Compute the match once both the transcript and target ayah are ready.
  useEffect(() => {
    if (phase === 'done' && ayah) setResult(matchWords(ayah.t, transcript));
  }, [phase, transcript, ayah]);

  const loadModel = () => {
    setModel('loading');
    workerRef.current?.postMessage({ type: 'load' });
  };

  const record = async () => {
    try {
      recRef.current = await startRecording();
      setPhase('recording');
      setResult(null);
      setTranscript('');
    } catch {
      toast('تعذّر الوصول إلى الميكروفون');
    }
  };

  const stop = async () => {
    const rec = recRef.current;
    if (!rec) return;
    setPhase('thinking');
    const audio = await rec.stop();
    workerRef.current?.postMessage({ type: 'transcribe', audio }, [audio.buffer]);
  };

  return (
    <div className="flex flex-col gap-space-lg py-space-md">
      {/* Honest header */}
      <div className="rounded-xl bg-surface-container-low p-space-md">
        <div className="flex items-center gap-space-2xs text-primary">
          <Icon name="graphic_eq" size={20} />
          <span className="font-sans text-label-md">التعرّف الصوتي على الجهاز (Whisper)</span>
        </div>
        <p className="mt-1 font-sans text-label-sm text-on-surface-variant">
          نقيس مطابقة الكلمات فقط — لا تقييم للتجويد ولا شهادات.
        </p>
      </div>

      {/* Target picker */}
      <div className="flex gap-space-sm">
        <select
          value={surah}
          onChange={(e) => {
            setSurah(Number(e.target.value));
            setAyahNum(1);
          }}
          className="flex-1 rounded-lg bg-surface-container px-space-sm py-space-sm font-sans text-body-md text-on-surface"
        >
          {surahMeta.map((m) => (
            <option key={m.n} value={m.n}>
              سورة {m.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          max={maxAyah}
          value={ayahNum}
          onChange={(e) => setAyahNum(Math.min(maxAyah, Math.max(1, Number(e.target.value))))}
          className="w-20 rounded-lg bg-surface-container px-space-sm py-space-sm font-sans text-body-md text-on-surface"
        />
      </div>

      {/* Target ayah */}
      <div className="rounded-xl bg-surface-container p-space-lg text-center" dir="rtl">
        {ayah ? (
          result ? (
            <p className="text-quran-verse-md leading-loose">
              {result.words.map((w, i) => (
                <span key={i} className={w.ok ? 'text-primary' : 'text-error'}>
                  {w.word}{' '}
                </span>
              ))}
            </p>
          ) : (
            <div className="text-quran-verse-md leading-loose">
              <AyahText ayah={ayah} />
            </div>
          )
        ) : (
          <Skeleton className="h-12 w-full" />
        )}
      </div>

      {/* Result summary */}
      {result && (
        <div className="rounded-xl bg-surface-container-low p-space-md text-center">
          <p className="font-sans text-display-lg text-primary">{num(Math.round(result.accuracy * 100))}٪</p>
          <p className="font-sans text-label-md text-on-surface-variant">مطابقة الكلمات</p>
          {transcript && (
            <p className="mt-space-sm font-sans text-body-md text-on-surface-variant" dir="rtl">
              ما سُمع: {transcript}
            </p>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col items-center gap-space-sm">
        {model === 'idle' && (
          <button onClick={loadModel} className="rounded-full bg-primary px-space-xl py-space-sm font-sans text-body-lg text-on-primary">
            تنزيل نموذج التعرّف (~٤٠ ميغابايت، مرة واحدة)
          </button>
        )}
        {model === 'loading' && (
          <div className="w-full text-center">
            <p className="font-sans text-label-md text-on-surface-variant">جارٍ تنزيل النموذج… {num(progress)}٪</p>
          </div>
        )}
        {model === 'ready' && phase !== 'recording' && phase !== 'thinking' && (
          <button
            onClick={record}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-container text-on-primary shadow-lg ring-2 ring-secondary/40 active:scale-95"
            aria-label="ابدأ التسميع"
          >
            <Icon name="mic" filled size={36} className="text-secondary-container" />
          </button>
        )}
        {phase === 'recording' && (
          <button
            onClick={stop}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-error text-on-error shadow-lg active:scale-95"
            aria-label="إيقاف"
          >
            <Icon name="stop" filled size={36} />
          </button>
        )}
        {phase === 'thinking' && <p className="font-sans text-body-md text-on-surface-variant">جارٍ التحليل…</p>}
        {phase === 'done' && model === 'ready' && (
          <button onClick={record} className="rounded-full border border-primary px-space-xl py-space-sm font-sans text-body-md text-primary">
            أعد التسميع
          </button>
        )}
      </div>
    </div>
  );
}
