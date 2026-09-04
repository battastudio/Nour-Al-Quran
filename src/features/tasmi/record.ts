// Mic capture → 16 kHz mono Float32 (what Whisper expects).

export interface Recording {
  stop: () => Promise<Float32Array>;
  cancel: () => void;
}

async function toMono16k(blob: Blob): Promise<Float32Array> {
  const buf = await blob.arrayBuffer();
  const ctx = new AudioContext();
  const decoded = await ctx.decodeAudioData(buf);
  await ctx.close();
  const offline = new OfflineAudioContext(1, Math.ceil(decoded.duration * 16000), 16000);
  const src = offline.createBufferSource();
  src.buffer = decoded;
  src.connect(offline.destination);
  src.start();
  const rendered = await offline.startRendering();
  return rendered.getChannelData(0).slice();
}

export async function startRecording(): Promise<Recording> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const rec = new MediaRecorder(stream);
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  rec.start();

  const cleanup = () => stream.getTracks().forEach((t) => t.stop());

  return {
    stop: () =>
      new Promise<Float32Array>((resolve, reject) => {
        rec.onstop = () => {
          cleanup();
          toMono16k(new Blob(chunks, { type: rec.mimeType })).then(resolve, reject);
        };
        rec.stop();
      }),
    cancel: () => {
      rec.onstop = null;
      if (rec.state !== 'inactive') rec.stop();
      cleanup();
    },
  };
}
