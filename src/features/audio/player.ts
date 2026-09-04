import { create } from 'zustand';
import { fmt } from '@/lib/fmt';
import { getSurahMeta } from '@/data/loader';

// everyayah.com per-ayah files: /data/<reciter>/<sss><aaa>.mp3
export function ayahAudioUrl(reciter: string, s: number, a: number): string {
  return `https://everyayah.com/data/${reciter}/${fmt.pad3(s)}${fmt.pad3(a)}.mp3`;
}

export interface AyahRef {
  s: number;
  a: number;
}

interface PlayerState {
  current: AyahRef | null;
  playing: boolean;
  queue: AyahRef[];
  qi: number;
  reciter: string;
  playList: (queue: AyahRef[], reciter: string, startIndex?: number) => void;
  toggle: () => void;
  stop: () => void;
  next: () => void;
  prev: () => void;
  _advance: () => void;
}

const el = typeof Audio !== 'undefined' ? new Audio() : null;

function setMediaSession(ref: AyahRef) {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  const meta = getSurahMeta(ref.s);
  navigator.mediaSession.metadata = new MediaMetadata({
    title: `${meta?.name ?? ''} · آية ${ref.a}`,
    artist: 'نور القرآن',
    album: 'تلاوة',
  });
}

export const usePlayer = create<PlayerState>((set, get) => {
  if (el) {
    el.addEventListener('ended', () => get()._advance());
    el.addEventListener('play', () => set({ playing: true }));
    el.addEventListener('pause', () => set({ playing: false }));
  }

  const playAt = (i: number) => {
    const { queue, reciter } = get();
    const ref = queue[i];
    if (!el || !ref) {
      set({ playing: false, current: null });
      return;
    }
    el.src = ayahAudioUrl(reciter, ref.s, ref.a);
    void el.play().catch(() => set({ playing: false }));
    setMediaSession(ref);
    set({ current: ref, qi: i, playing: true });
  };

  return {
    current: null,
    playing: false,
    queue: [],
    qi: 0,
    reciter: 'Alafasy_128kbps',
    playList: (queue, reciter, startIndex = 0) => {
      set({ queue, reciter });
      playAt(startIndex);
    },
    toggle: () => {
      if (!el) return;
      if (el.paused) void el.play();
      else el.pause();
    },
    stop: () => {
      el?.pause();
      if (el) el.currentTime = 0;
      set({ playing: false, current: null });
    },
    next: () => {
      const { qi, queue } = get();
      if (qi + 1 < queue.length) playAt(qi + 1);
    },
    prev: () => {
      const { qi } = get();
      if (qi > 0) playAt(qi - 1);
    },
    _advance: () => {
      const { qi, queue } = get();
      if (qi + 1 < queue.length) playAt(qi + 1);
      else set({ playing: false, current: null });
    },
  };
});

// Media Session transport controls (lock screen / headset).
if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
  navigator.mediaSession.setActionHandler('play', () => usePlayer.getState().toggle());
  navigator.mediaSession.setActionHandler('pause', () => usePlayer.getState().toggle());
  navigator.mediaSession.setActionHandler('nexttrack', () => usePlayer.getState().next());
  navigator.mediaSession.setActionHandler('previoustrack', () => usePlayer.getState().prev());
}
