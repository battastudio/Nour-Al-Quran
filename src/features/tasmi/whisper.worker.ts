/// <reference lib="webworker" />
import { pipeline, env } from '@huggingface/transformers';

// On-device ASR (Whisper). Runs off the main thread. Model is downloaded once
// and cached by the browser (Cache Storage). WebGPU used when available.
// Narrow call signature avoids transformers' huge pipeline() return union.
type ASR = (audio: Float32Array, opts?: Record<string, unknown>) => Promise<{ text: string }>;
env.allowLocalModels = false;

let asr: ASR | null = null;

type InMsg =
  | { type: 'load' }
  | { type: 'transcribe'; audio: Float32Array };
type OutMsg =
  | { type: 'progress'; pct: number; file?: string }
  | { type: 'ready' }
  | { type: 'result'; text: string }
  | { type: 'error'; message: string };

const post = (m: OutMsg) => (self as unknown as Worker).postMessage(m);

async function getASR(): Promise<ASR> {
  if (asr) return asr;
  asr = (await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
    progress_callback: (p: { status: string; progress?: number; file?: string }) => {
      if (p.status === 'progress' && typeof p.progress === 'number') {
        post({ type: 'progress', pct: Math.round(p.progress), file: p.file });
      }
    },
  })) as unknown as ASR;
  return asr;
}

self.onmessage = async (e: MessageEvent<InMsg>) => {
  try {
    if (e.data.type === 'load') {
      await getASR();
      post({ type: 'ready' });
      return;
    }
    if (e.data.type === 'transcribe') {
      const p = await getASR();
      post({ type: 'ready' });
      const out = (await p(e.data.audio, { language: 'arabic', task: 'transcribe' })) as {
        text: string;
      };
      post({ type: 'result', text: out.text ?? '' });
    }
  } catch (err) {
    post({ type: 'error', message: err instanceof Error ? err.message : String(err) });
  }
};

export type { InMsg, OutMsg };
